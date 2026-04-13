import os
import httpx

CONECTAAI_API_KEY = os.getenv("CONECTAAI_API_KEY", "")
CONECTAAI_API_URL = os.getenv("CONECTAAI_API_URL", "https://mail.conectaai.cl/api/send")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@voltashop.cl")

async def send_transactional_email(to_email: str, subject: str, template_name: str, dynamic_data: dict):
    """Envía un correo transaccional vía mail.conectaai.cl"""
    if not CONECTAAI_API_KEY:
        print(f"[email] CONECTAAI_API_KEY no configurada — email omitido para {to_email}", flush=True)
        return False

    payload = {
        "to": to_email,
        "subject": subject,
        "template": template_name,
        "data": dynamic_data,
    }
    headers = {
        "Authorization": f"Bearer {CONECTAAI_API_KEY}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(CONECTAAI_API_URL, json=payload, headers=headers)
        if resp.status_code < 400:
            print(f"[email] ✅ Enviado '{template_name}' → {to_email}", flush=True)
            return True
        else:
            print(f"[email] ❌ Error {resp.status_code}: {resp.text}", flush=True)
            return False
    except Exception as e:
        print(f"[email] ❌ Excepción: {e}", flush=True)
        return False


# === CORREOS AL CLIENTE ===

async def notify_order_created(to_email: str, client_name: str, order_id: str, amount: float):
    return await send_transactional_email(
        to_email=to_email,
        subject=f"Confirmación de Compra - Pedido {order_id}",
        template_name="compra_realizada",
        dynamic_data={"nombre": client_name, "orden": order_id, "total": f"${amount:,.0f}"},
    )

async def notify_order_shipped(to_email: str, client_name: str, order_id: str, tracking: str, courier: str = "", tracking_url: str = ""):
    return await send_transactional_email(
        to_email=to_email,
        subject=f"¡Tu pedido {order_id} va en camino por {courier}!",
        template_name="producto_enviado",
        dynamic_data={
            "nombre": client_name,
            "orden": order_id,
            "tracking": tracking,
            "courier": courier,
            "tracking_url": tracking_url,
        },
    )

async def notify_account_created(to_email: str, client_name: str, temp_password: str):
    return await send_transactional_email(
        to_email=to_email,
        subject="¡Bienvenido a VoltaShop! Tus credenciales",
        template_name="creacion_cuenta",
        dynamic_data={"nombre": client_name, "password": temp_password, "email": to_email},
    )

async def send_password_reset_email(to_email: str, reset_link: str):
    return await send_transactional_email(
        to_email=to_email,
        subject="Recuperación de Contraseña - VoltaShop",
        template_name="recuperar_password",
        dynamic_data={"email": to_email, "reset_link": reset_link},
    )


# === CORREO AL ADMINISTRADOR ===

async def notify_admin_new_sale(client_name: str, client_email: str, client_phone: str, order_id: str, amount: float):
    return await send_transactional_email(
        to_email=ADMIN_EMAIL,
        subject=f"🔔 ¡NUEVA VENTA! Pedido {order_id} — ${amount:,.0f}",
        template_name="alerta_admin_venta",
        dynamic_data={
            "cliente": client_name,
            "email_cliente": client_email,
            "telefono_cliente": client_phone,
            "orden": order_id,
            "total": f"${amount:,.0f}",
        },
    )
