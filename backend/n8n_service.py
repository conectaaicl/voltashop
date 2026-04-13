import os
import httpx

N8N_WEBHOOK_URL = os.getenv("N8N_WEBHOOK_URL", "")

async def _post(payload: dict) -> bool:
    if not N8N_WEBHOOK_URL:
        print(f"[n8n] N8N_WEBHOOK_URL no configurada — webhook omitido", flush=True)
        return False
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(N8N_WEBHOOK_URL, json=payload)
        if resp.status_code < 400:
            print(f"[n8n] ✅ Webhook disparado: {payload.get('event_type', payload.get('event', '?'))}", flush=True)
            return True
        else:
            print(f"[n8n] ❌ Error {resp.status_code}: {resp.text}", flush=True)
            return False
    except Exception as e:
        print(f"[n8n] ❌ Excepción: {e}", flush=True)
        return False


async def trigger_n8n_whatsapp_flow(event_type: str, client_name: str, client_phone: str, dynamic_data: dict):
    return await _post({
        "event_type": event_type,
        "cliente": client_name,
        "telefono": client_phone,
        "datos": dynamic_data,
    })

async def trigger_n8n_stock_alert(product_name: str, remaining_stock: int):
    return await _post({
        "event_type": "low_stock_alert",
        "product": product_name,
        "stock": remaining_stock,
        "msg": f"⚠️ ALERTA: '{product_name}' tiene solo {remaining_stock} unidades.",
    })

async def trigger_abandoned_cart_alert(order_id: str, client_name: str, amount: float, phone: str):
    return await _post({
        "event": "abandoned_cart",
        "order_id": order_id,
        "name": client_name,
        "amount": f"${amount:,.0f}",
        "phone": phone,
        "msg": f"⚠️ Carrito Abandonado: {client_name} dejó ${amount:,.0f} pendiente.",
    })
