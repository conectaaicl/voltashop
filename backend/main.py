from fastapi import FastAPI, Depends, HTTPException, Request, status, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from typing import List
import os
import uuid
import json

from database import engine, Base, get_db
import database
import models, schemas, auth
import ai_service
import email_service
import n8n_service
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime
import mercadopago

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
SEED_DEMO_DATA = os.getenv("SEED_DEMO_DATA", "false").lower() == "true"

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="VoltaShop Backend API", description="Server para Base de Datos y Seguridad")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ==== WEBSOCKET MANAGER ====
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                continue

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Carpeta para guardar archivos subidos
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB
MAX_VIDEO_SIZE = 50 * 1024 * 1024  # 50 MB

# CORS — restringir a los orígenes reales (se puede ampliar via env: ALLOWED_ORIGINS)
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]
# In production also add the public domain
if FRONTEND_URL and FRONTEND_URL not in ALLOWED_ORIGINS:
    ALLOWED_ORIGINS.append(FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    # Inicializar las tablas de la DB si no existen
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Auto-crear el SuperAdmin por defecto
    async with database.AsyncSessionLocal() as session:
        result = await session.execute(select(models.User).filter(models.User.username == "admin"))
        user = result.scalars().first()
        if not user:
            hashed_pw = auth.get_password_hash("voltashop2026")
            super_admin = models.User(username="admin", email="corp.conectaai@gmail.com", hashed_password=hashed_pw, is_admin=True)
            session.add(super_admin)
            await session.commit()
        elif not user.email:
            user.email = "corp.conectaai@gmail.com"
            await session.commit()
            
        # Auto-crear la configuración de la Landing SaaS si no existe
        result_saas = await session.execute(select(models.SaasConfig))
        if not result_saas.scalars().first():
            default_saas = models.SaasConfig()
            session.add(default_saas)
            await session.commit()

# ==== AUTENTICACIÓN ====
@app.post("/api/auth/register", status_code=201)
async def create_user(user: schemas.UserCreate, db: AsyncSession = Depends(get_db)):
    # 1. Validar Usuario Existente
    result = await db.execute(select(models.User).filter(models.User.username == user.username))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="El usuario ya existe")
    
    # 2. Refuerzo de Seguridad: Validar Fortaleza de Contraseña
    if len(user.password) < 8:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 8 caracteres")
    
    # 3. Solo el primer usuario registrado en la base de datos será Admin automáticamente
    user_count_result = await db.execute(select(database.models.User))
    is_first_user = not user_count_result.scalars().first()
    admin_status = is_first_user 
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(username=user.username, hashed_password=hashed_password, is_admin=admin_status)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    role = "Admin" if admin_status else "Cliente"
    return {"message": f"Usuario registrado como {role} exitosamente"}

# ==== RECUPERACIÓN DE CONTRASEÑA ====
@app.post("/api/auth/forgot-password")
@limiter.limit("5/minute")
async def forgot_password(request: Request, body: schemas.ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.User).filter(models.User.email == body.email))
    user = result.scalars().first()

    if user:
        token = auth.create_password_reset_token(user.email)
        reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
        
        # Enviar Email vía ConectaAI
        await email_service.send_password_reset_email(user.email, reset_link)
    
    # Por seguridad, siempre devolvemos el mismo mensaje para no dar pistas si el mail existe o no
    return {"message": "Si el correo está registrado, recibirás un enlace de recuperación en breve."}

@app.post("/api/auth/reset-password")
async def reset_password(request: schemas.ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    email = auth.decode_password_reset_token(request.token)
    if not email:
        raise HTTPException(status_code=400, detail="El token es inválido o ha expirado")
        
    result = await db.execute(select(models.User).filter(models.User.email == email))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    # Actualizar Contraseña
    user.hashed_password = auth.get_password_hash(request.new_password)
    await db.commit()
    
    return {"message": "Contraseña actualizada con éxito. Ya puedes iniciar sesión."}

@app.post("/api/auth/login", response_model=schemas.Token)
@limiter.limit("10/minute")
async def login_for_access_token(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.User).filter(models.User.username == form_data.username))
    user = result.scalars().first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario o contraseña incorrectos")

    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer", "is_admin": user.is_admin}

# ==== PERFIL DE USUARIO ====

@app.get("/api/users/me", response_model=schemas.UserResponse)
async def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@app.put("/api/users/me")
async def update_me(
    update: dict,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    allowed = {"email", "username"}
    for key, val in update.items():
        if key in allowed and val:
            setattr(current_user, key, val)
    # Change password if provided
    if "new_password" in update and update["new_password"]:
        if len(update["new_password"]) < 8:
            raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 8 caracteres")
        current_user.hashed_password = auth.get_password_hash(update["new_password"])
    await db.commit()
    await db.refresh(current_user)
    return {"message": "Perfil actualizado", "username": current_user.username, "email": current_user.email}


# ==== LISTA DE DESEOS (requiere auth) ====

@app.get("/api/wishlist", response_model=list[schemas.WishlistItemResponse])
async def get_wishlist(
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    result = await db.execute(
        select(models.WishlistItem).filter(models.WishlistItem.user_id == current_user.id)
    )
    return result.scalars().all()

@app.post("/api/wishlist/{product_id}", status_code=201)
async def add_to_wishlist(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    # Verify product exists
    prod = await db.execute(select(models.Product).filter(models.Product.id == product_id))
    if not prod.scalars().first():
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    # Check if already in wishlist
    existing = await db.execute(
        select(models.WishlistItem).filter(
            models.WishlistItem.user_id == current_user.id,
            models.WishlistItem.product_id == product_id,
        )
    )
    if existing.scalars().first():
        return {"message": "Ya está en tu lista de deseos"}
    item = models.WishlistItem(user_id=current_user.id, product_id=product_id)
    db.add(item)
    await db.commit()
    return {"message": "Agregado a la lista de deseos"}

@app.delete("/api/wishlist/{product_id}")
async def remove_from_wishlist(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    result = await db.execute(
        select(models.WishlistItem).filter(
            models.WishlistItem.user_id == current_user.id,
            models.WishlistItem.product_id == product_id,
        )
    )
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="No está en tu lista de deseos")
    await db.delete(item)
    await db.commit()
    return {"message": "Eliminado de la lista de deseos"}


# ==== AI SERVICES (ADMIN) ====
@app.post("/api/ai/optimize")
async def ai_optimize_product(product: schemas.ProductCreate, current_user: models.User = Depends(auth.require_admin)):
    """Optimiza el copy de un producto usando el motor de ConectaAI"""
    return ai_service.generate_ai_description(product.name, product.category)

# ==== INVENTARIO (PÚBLICO) ====
from typing import Optional

@app.get("/api/products", response_model=List[schemas.ProductResponse])
async def read_products(
    q: Optional[str] = None,
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    query = select(models.Product)
    if q:
        query = query.filter(
            (models.Product.name.ilike(f"%{q}%")) | 
            (models.Product.description.ilike(f"%{q}%"))
        )
    if category and category != "Todos":
        query = query.filter(models.Product.category == category)
    if min_price:
        query = query.filter(models.Product.price >= min_price)
    if max_price:
        query = query.filter(models.Product.price <= max_price)
        
    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    products = result.scalars().all()

    # Only seed demo data if explicitly enabled (SEED_DEMO_DATA=true in .env)
    if not products and not q and not category and SEED_DEMO_DATA:
        await seed_demo_products(db)
        result = await db.execute(select(models.Product).offset(offset).limit(limit))
        products = result.scalars().all()

    return products

async def seed_demo_products(db):
    demo = models.Product(name="Celular Demo API", price=500.0, category="Smartphones", stock=10, freeShipping=True, image="https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&q=80&w=400")
    db.add(demo)
    await db.commit()

# ==== INVENTARIO (ADMIN PROTEGIDO) ====
@app.post("/api/products", response_model=schemas.ProductResponse)
async def create_product(product: schemas.ProductCreate, db: AsyncSession = Depends(get_db), current_user: models.User = Depends(auth.require_admin)):
    new_product = models.Product(**product.dict())
    db.add(new_product)
    await db.commit()
    await db.refresh(new_product)
    return new_product

@app.put("/api/products/{id}", response_model=schemas.ProductResponse)
async def update_product(id: int, product_update: schemas.ProductCreate, db: AsyncSession = Depends(get_db), current_user: models.User = Depends(auth.require_admin)):
    result = await db.execute(select(models.Product).filter(models.Product.id == id))
    product = result.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    update_data = product_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)
    
    await db.commit()
    await db.refresh(product)
    return product

@app.delete("/api/products/{id}")
async def delete_product(id: int, db: AsyncSession = Depends(get_db), current_user: models.User = Depends(auth.require_admin)):
    result = await db.execute(select(models.Product).filter(models.Product.id == id))
    product = result.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    await db.delete(product)
    await db.commit()
    return {"message": "Producto eliminado exitosamente"}


# Configuración Mercado Pago — usar token desde .env (nunca hardcodear en producción)
MP_ACCESS_TOKEN = os.getenv("MP_ACCESS_TOKEN", "")
if not MP_ACCESS_TOKEN:
    print("[WARNING] MP_ACCESS_TOKEN no configurado — los pagos no funcionarán en producción", flush=True)
sdk = mercadopago.SDK(MP_ACCESS_TOKEN) if MP_ACCESS_TOKEN else None

@app.post("/api/admin/check-abandoned-carts")
async def check_abandoned_carts(db: AsyncSession = Depends(get_db), current_user: models.User = Depends(auth.require_admin)):
    """Busca carritos pendientes de hace más de 1 hora y avisa vía n8n"""
    result = await db.execute(select(models.Order).filter(models.Order.status == 'Pendiente'))
    pending_orders = result.scalars().all()
    
    count = 0
    now = datetime.now()
    for order in pending_orders:
        try:
            order_time = datetime.strptime(order.date, "%Y-%m-%d %H:%M:%S")
            diff = now - order_time
            if diff.total_seconds() > 3600: # 1 hora
                await n8n_service.trigger_abandoned_cart_alert(
                    order_id=order.id,
                    client_name=order.customer,
                    amount=order.amount,
                    phone=order.phone
                )
                count += 1
        except:
            continue
            
    return {"message": f"Se procesaron {count} carritos abandonados."}

# ==== RESEÑAS (PÚBLICO) ====
@app.get("/api/products/{id}/reviews", response_model=List[schemas.ReviewResponse])
async def get_reviews(id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Review).filter(models.Review.product_id == id))
    return result.scalars().all()

@app.post("/api/products/{id}/reviews", response_model=schemas.ReviewResponse)
async def create_review(id: int, review: schemas.ReviewBase, db: AsyncSession = Depends(get_db)):
    # Validar que el producto existe
    prod_result = await db.execute(select(models.Product).filter(models.Product.id == id))
    if not prod_result.scalars().first():
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    new_review = models.Review(
        product_id=id,
        user_name=review.user_name,
        rating=review.rating,
        comment=review.comment
    )
    db.add(new_review)
    await db.commit()
    await db.refresh(new_review)
    return new_review

# ==== PAGOS (MERCADO PAGO) ====
@app.post("/api/payments/create_preference")
async def create_preference(order_data: schemas.OrderCreate, db: AsyncSession = Depends(get_db)):
    if not sdk:
        raise HTTPException(status_code=503, detail="Pagos no configurados. Contacta al administrador.")

    # 1. Crear la preferencia en Mercado Pago
    preference_data = {
        "items": [
            {
                "title": f"Compra en VoltaShop - Orden {order_data.id}",
                "unit_price": float(order_data.amount),
                "quantity": 1,
                "currency_id": "CLP",
            }
        ],
        "back_urls": {
            "success": f"{FRONTEND_URL}/checkout?status=success",
            "failure": f"{FRONTEND_URL}/checkout?status=failure",
            "pending": f"{FRONTEND_URL}/checkout?status=pending",
        },
        "auto_return": "approved",
        "notification_url": f"{FRONTEND_URL}/api/webhooks/mercadopago",
        "external_reference": order_data.id,
    }

    preference_response = sdk.preference().create(preference_data)
    preference = preference_response["response"]

    # 2. Guardar orden en DB como Pendiente
    date_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    new_order = models.Order(
        id=order_data.id, 
        date=date_str, 
        customer=order_data.customer, 
        document=order_data.document,
        email=order_data.email, 
        phone=order_data.phone, 
        amount=order_data.amount, 
        status="Pendiente",
        preference_id=preference["id"],
        items_json=json.dumps(order_data.items)
    )
    db.add(new_order)
    await db.commit()
    
    return {"preference_id": preference["id"], "init_point": preference["init_point"]}

@app.post("/api/webhooks/mercadopago")
async def mercadopago_webhook(data: dict, db: AsyncSession = Depends(get_db)):
    # Los webhooks de MP envían 'type' y 'data.id'
    # Solo nos interesan los 'payment'
    if data.get("type") == "payment":
        payment_id = data["data"]["id"]
        
        # Consultar el estado del pago al API de MP
        payment_info = sdk.payment().get(payment_id)
        payment_status = payment_info["response"]["status"]
        order_id = payment_info["response"]["external_reference"]
        
        if payment_status == "approved":
            # 1. Buscar orden en DB
            result = await db.execute(select(models.Order).filter(models.Order.id == order_id))
            order = result.scalars().first()
            
            if order and order.status != "Pagado":
                order.status = "Pagado"
                order.payment_id = str(payment_id)
                await db.commit()
                
                # WebSocket Notification
                await manager.broadcast(json.dumps({
                    "event": "new_order",
                    "customer": order.customer,
                    "amount": order.amount,
                    "items": json.loads(order.items_json) if order.items_json else []
                }))
                
                # 2. Notificaciones (Email & WhatsApp)
                await email_service.notify_order_created(
                    to_email=order.email, client_name=order.customer, 
                    order_id=order.id, amount=order.amount
                )
                await n8n_service.trigger_n8n_whatsapp_flow(
                    event_type="orden_creada", client_name=order.customer,
                    client_phone=order.phone, dynamic_data={"orden": order.id, "monto": str(order.amount)}
                )
                
                # 3. Gestión de Stock Directa
                if order.items_json:
                    items = json.loads(order.items_json)
                    for item in items:
                        prod_id = item.get("id")
                        qty = item.get("quantity", 1)
                        
                        p_result = await db.execute(select(models.Product).filter(models.Product.id == prod_id))
                        product = p_result.scalars().first()
                        
                        if product:
                            product.stock -= qty
                            await db.commit()
                            
                            # Si el stock es bajo, avisar a n8n
                            if product.stock < 3:
                                await n8n_service.trigger_n8n_stock_alert(product.name, product.stock)
                
    return {"status": "ok"}

@app.post("/api/orders", response_model=schemas.OrderResponse)
async def create_order(order: schemas.OrderCreate, db: AsyncSession = Depends(get_db)):
    # Guardar en DB
    date_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    new_order = models.Order(
        id=order.id, date=date_str, customer=order.customer, document=order.document,
        email=order.email, phone=order.phone, amount=order.amount, status="Pendiente"
    )
    db.add(new_order)
    await db.commit()
    await db.refresh(new_order)
    
    # WebSocket Notification (for the frontend/admin)
    await manager.broadcast(json.dumps({
        "event": "new_order_created",
        "customer": order.customer,
        "amount": order.amount
    }))
    
    # 1. ✉️ LLAMADA AL API DE ConectaAI: Email Confirmación
    await email_service.notify_order_created(
        to_email=order.email, 
        client_name=order.customer, 
        order_id=order.id, 
        amount=order.amount
    )
    
    # 2. 🤖 LLAMADA AL API DE n8n (WhatsApp Meta): Confirmación por Teléfono
    await n8n_service.trigger_n8n_whatsapp_flow(
        event_type="orden_creada",
        client_name=order.customer,
        client_phone=order.phone,
        dynamic_data={"orden": order.id, "monto": str(order.amount)}
    )
    
    # 3. 📬 NOTIFICAR AL DUEÑO (TÚ): Te llega un correo con los datos de la venta
    await email_service.notify_admin_new_sale(
        client_name=order.customer,
        client_email=order.email,
        client_phone=order.phone,
        order_id=order.id,
        amount=order.amount
    )
    
    return new_order

@app.put("/api/orders/{order_id}/ship")
async def mark_order_shipped(order_id: str, ship_data: schemas.ShipOrder, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Order).filter(models.Order.id == order_id))
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    
    # Guardar datos logísticos reales
    order.status = "Enviado"
    order.courier = ship_data.courier
    order.tracking_number = ship_data.tracking_number
    await db.commit()
    
    # Generar URL de rastreo según el courier chileno
    tracking_urls = {
        "Chilexpress": f"https://www.chilexpress.cl/estado-envio/{ship_data.tracking_number}",
        "Starken": f"https://www.starken.cl/seguimiento?codigo={ship_data.tracking_number}",
        "Correos de Chile": f"https://www.correos.cl/web/guest/seguimiento-en-linea?codigos={ship_data.tracking_number}",
        "Bluexpress": f"https://www.bluexpress.cl/seguimiento?guia={ship_data.tracking_number}"
    }
    tracking_url = tracking_urls.get(ship_data.courier, "#")
    
    # 1. ✉️ CORREO ConectaAI con datos logísticos reales
    await email_service.notify_order_shipped(
        to_email=order.email,
        client_name=order.customer,
        order_id=order.id,
        tracking=ship_data.tracking_number,
        courier=ship_data.courier,
        tracking_url=tracking_url
    )
    
    # 2. 🤖 WHATSAPP n8n con tracking real
    await n8n_service.trigger_n8n_whatsapp_flow(
        event_type="orden_enviada",
        client_name=order.customer,
        client_phone=order.phone,
        dynamic_data={
            "orden": order.id, 
            "courier": ship_data.courier,
            "tracking": ship_data.tracking_number,
            "tracking_url": tracking_url
        }
    )
    
    return {"message": f"Orden despachada por {ship_data.courier}. Correo y WhatsApp enviados.", "tracking_url": tracking_url}

@app.get("/api/orders")
async def get_orders(
    limit: int = 100,
    offset: int = 0,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin),
):
    query = select(models.Order).order_by(models.Order.date.desc())
    if status:
        query = query.filter(models.Order.status == status)
    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@app.put("/api/orders/{order_id}/cancel")
async def cancel_order(
    order_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin),
):
    result = await db.execute(select(models.Order).filter(models.Order.id == order_id))
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    if order.status in ("Enviado", "Cancelado"):
        raise HTTPException(status_code=400, detail=f"No se puede cancelar una orden en estado '{order.status}'")
    order.status = "Cancelado"
    await db.commit()
    return {"message": f"Orden {order_id} cancelada"}

# ==== SUBIDA DE ARCHIVOS (FOTOS Y VIDEOS) ====
@app.post("/api/upload")
async def upload_media(file: UploadFile = File(...)):
    # Validar tipo de archivo
    allowed_image_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    allowed_video_types = ["video/mp4", "video/webm", "video/quicktime"]
    all_allowed = allowed_image_types + allowed_video_types
    
    if file.content_type not in all_allowed:
        raise HTTPException(status_code=400, detail=f"Tipo de archivo no permitido: {file.content_type}. Permitidos: JPG, PNG, WEBP, GIF, MP4, WEBM, MOV")
    
    # Leer contenido y validar tamaño
    contents = await file.read()
    file_size = len(contents)
    
    is_video = file.content_type in allowed_video_types
    max_size = MAX_VIDEO_SIZE if is_video else MAX_IMAGE_SIZE
    max_label = "50MB" if is_video else "10MB"
    
    if file_size > max_size:
        raise HTTPException(status_code=400, detail=f"Archivo demasiado grande ({file_size / 1024 / 1024:.1f}MB). Máximo permitido: {max_label}")
    
    # Guardar con nombre único
    ext = os.path.splitext(file.filename)[1]
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)
    
    with open(file_path, "wb") as f:
        f.write(contents)
    
    # Devolver URL pública
    file_url = f"/uploads/{unique_name}"
    file_type = "video" if is_video else "image"
    print(f"📸 [Upload] Archivo '{file.filename}' ({file_size/1024:.0f}KB) guardado como {unique_name}")
    
    return {"url": file_url, "filename": unique_name, "type": file_type, "size_kb": round(file_size / 1024)}

# ==== SAAS & LANDING CONFIG ====
@app.get("/api/landing", response_model=schemas.SaasConfigResponse)
async def get_landing_config(db: AsyncSession = Depends(database.get_db)):
    result = await db.execute(select(models.SaasConfig))
    config = result.scalars().first()
    if not config:
        # Fallback si por alguna razón el startup no la creó
        config = models.SaasConfig()
        db.add(config)
        await db.commit()
        await db.refresh(config)
    return config

@app.put("/api/landing", response_model=schemas.SaasConfigResponse)
async def update_landing_config(
    update: schemas.SaasConfigBase, 
    db: AsyncSession = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    result = await db.execute(select(models.SaasConfig))
    config = result.scalars().first()
    if not config:
        raise HTTPException(status_code=404, detail="Configuración no encontrada")
    
    for key, value in update.dict().items():
        setattr(config, key, value)
    
    await db.commit()
    await db.refresh(config)
    return config

@app.get("/")
def read_root():
    return {"status": "VotaShop API is Running. Listo para subir a Contabo."}

if __name__ == "__main__":
    import uvicorn
    # Usa reload=False en producción
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
