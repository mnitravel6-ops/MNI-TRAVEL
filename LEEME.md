# MNI Travel — sitio con pago de abono por Flow

## Estructura
- `public/` → el sitio (index.html, términos, privacidad, gracias, pago-fallido)
- `netlify/functions/` → las funciones que hablan con Flow (se publican solas con el sitio)
- `netlify.toml` → le dice a Netlify dónde está cada cosa

## Variables de entorno (Netlify → Site configuration → Environment variables)
| Variable | Valor |
|---|---|
| `FLOW_API_KEY` | API Key de Flow (¡solo en Netlify, nunca en el chat ni en GitHub!) |
| `FLOW_SECRET_KEY` | Secret Key de Flow |
| `FLOW_API_URL` | Pruebas: `https://sandbox.flow.cl/api` · Real: `https://www.flow.cl/api` |
| `ABONO_PORCENTAJE` | Opcional. Por defecto 30. Si lo cambias, cambia también `ABONO_PORCENTAJE` en `public/index.html` |

Flow sandbox y Flow real son cuentas distintas, con claves distintas.

## Pasos
1. Subir esta carpeta a un repositorio nuevo de GitHub (privado).
2. En Netlify: Add new project → Import an existing project → GitHub → elegir el repositorio.
3. Cargar las variables de entorno (con las claves del sandbox) y hacer un nuevo deploy.
4. Hacer una reserva de prueba y pagar en el sandbox de Flow.
5. Revisar en Netlify → Forms → `reserva-pagada` que llegó la reserva. Activar ahí el aviso por correo.
6. Para cobrar de verdad: cambiar las 3 variables de Flow a las claves reales y `FLOW_API_URL` a `https://www.flow.cl/api`.
