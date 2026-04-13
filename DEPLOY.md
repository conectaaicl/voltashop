# VoltaShop — Deploy en Producción

## 1. Configurar variables de entorno

```bash
cp .env.example .env
nano .env   # completar con valores reales
```

Valores obligatorios:
- `SECRET_KEY` — mínimo 64 caracteres aleatorios (`openssl rand -hex 32`)
- `CONECTAAI_API_KEY` — clave de mail.conectaai.cl
- `MP_ACCESS_TOKEN` — token de PRODUCCIÓN de MercadoPago
- `FRONTEND_URL` — `https://voltashop.cl` (sin barra final)
- `ADMIN_EMAIL` — tu correo para alertas de venta

## 2. Primera vez — levantar servicios

```bash
docker compose up -d --build
```

## 3. Obtener certificado SSL (primera vez)

```bash
# Primero levanta el servidor sin SSL (ya está corriendo en paso 2)
# Luego obtén el cert:
docker compose --profile ssl run --rm certbot

# Después activa el bloque HTTPS en nginx.conf (descomentar el server block 443)
# y reinicia nginx:
docker compose restart web
```

## 4. Renovar certificado SSL (mensual — agregar a cron)

```bash
docker compose --profile ssl run --rm certbot renew
docker compose restart web
```

## 5. Templates de email necesarios en mail.conectaai.cl

Crear estos templates en el panel de mail.conectaai.cl:

| Nombre | Uso | Variables |
|--------|-----|-----------|
| `compra_realizada` | Confirmación al cliente | `{{nombre}}`, `{{orden}}`, `{{total}}` |
| `producto_enviado` | Aviso de despacho | `{{nombre}}`, `{{orden}}`, `{{courier}}`, `{{tracking}}`, `{{tracking_url}}` |
| `recuperar_password` | Reset de contraseña | `{{email}}`, `{{reset_link}}` |
| `alerta_admin_venta` | Alerta de nueva venta (al admin) | `{{cliente}}`, `{{email_cliente}}`, `{{telefono_cliente}}`, `{{orden}}`, `{{total}}` |
| `creacion_cuenta` | Bienvenida con credenciales | `{{nombre}}`, `{{email}}`, `{{password}}` |

## 6. Credenciales por defecto (cambiar en producción)

Usuario admin auto-creado al arrancar:
- **Usuario:** `admin`
- **Contraseña:** `voltashop2026`

⚠️ Cambiar inmediatamente desde `/profile` o directamente en la DB.

## 7. Comandos útiles

```bash
# Ver logs del backend
docker compose logs -f api

# Acceder a la DB directamente
docker compose exec db psql -U voltadmin -d voltashop_prod

# Reiniciar solo el backend
docker compose restart api

# Actualizar código sin borrar datos
docker compose up -d --build api web
```
