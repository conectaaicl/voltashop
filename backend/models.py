from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String)
    is_admin = Column(Boolean, default=False)

    wishlist = relationship("WishlistItem", back_populates="user", cascade="all, delete-orphan")

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    price = Column(Float)
    image = Column(String)
    category = Column(String)
    stock = Column(Integer)
    freeShipping = Column(Boolean, default=False)
    description = Column(String, nullable=True)
    images = Column(String, nullable=True)  # JSON-encoded list of URLs

    reviews = relationship("Review", back_populates="product", cascade="all, delete-orphan")

class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    user_name = Column(String)
    rating = Column(Integer)  # 1–5
    comment = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product", back_populates="reviews")

class Order(Base):
    __tablename__ = "orders"
    id = Column(String, primary_key=True, index=True)
    date = Column(String)  # ISO format: YYYY-MM-DD HH:MM:SS
    customer = Column(String)
    document = Column(String)
    email = Column(String)
    phone = Column(String)
    amount = Column(Float)
    status = Column(String)  # Pendiente, Pagado, Enviado, Cancelado

    preference_id = Column(String, nullable=True)
    payment_id = Column(String, nullable=True)
    courier = Column(String, nullable=True)
    tracking_number = Column(String, nullable=True)
    items_json = Column(String, nullable=True)

class WishlistItem(Base):
    __tablename__ = "wishlist_items"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (UniqueConstraint("user_id", "product_id", name="uq_user_product"),)

    user = relationship("User", back_populates="wishlist")
    product = relationship("Product")

class SaasConfig(Base):
    __tablename__ = "saas_config"
    id = Column(Integer, primary_key=True, index=True)
    hero_title = Column(String, default="Lanza tu Propia Tienda VoltaShop")
    hero_subtitle = Column(String, default="La solución e-commerce más avanzada con IA, Pagos Chilenos y Automatización.")
    feature_1_title = Column(String, default="Mercado Pago Chile")
    feature_1_desc = Column(String, default="Pagos reales y seguros integrados localmente.")
    feature_2_title = Column(String, default="IA Generativa")
    feature_2_desc = Column(String, default="Descripciones optimizadas con ConectaAI Intelligence.")
    feature_3_title = Column(String, default="n8n Automations")
    feature_3_desc = Column(String, default="WhatsApp y Emails automáticos para tus clientes.")
    price_starter = Column(Float, default=199.0)
    price_pro = Column(Float, default=499.0)
    cta_text = Column(String, default="Comenzar Ahora")

    # White Label Branding
    store_name = Column(String, default="VoltaShop")
    store_logo = Column(String, default="https://img.icons8.com/clouds/100/shopping-cart.png")
    active_theme = Column(Integer, default=1)  # 1–5

    # Contacto & Redes Sociales
    whatsapp_number = Column(String, default="56912345678")
    instagram_url = Column(String, default="")
    facebook_url = Column(String, default="")
    tiktok_url = Column(String, default="")
    accent_color = Column(String, default="#f7c948")
    page_visits = Column(Integer, default=0)

    # Configuracion de Pagos
    mp_access_token = Column(String, nullable=True)
    transfer_enabled = Column(Boolean, default=False)
    bank_name = Column(String, nullable=True)
    bank_account_type = Column(String, nullable=True)
    bank_account_number = Column(String, nullable=True)
    bank_holder_name = Column(String, nullable=True)
    bank_holder_rut = Column(String, nullable=True)
    bank_email = Column(String, nullable=True)
    transfer_instructions = Column(String, nullable=True)
