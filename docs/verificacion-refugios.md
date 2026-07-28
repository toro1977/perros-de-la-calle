# Verificación de refugios/rescatistas — proceso manual (v1)

No hay pantalla de admin todavía. La aprobación/rechazo se hace a mano desde el dashboard de Supabase.

## Cómo aprobar o rechazar una solicitud

1. Entrar al dashboard de Supabase del proyecto (`jvbtjowjnlwuicuuexhk`) → **Table Editor** → tabla `shelters`.
2. Buscar la fila con `verification_status = 'pending'`.
3. Revisar a ojo: `shelter_name`, `locality`, `social_links` (abrir el link/handle de Instagram o Facebook), `bio`.
4. **Para aprobar:**
   - `verification_status` → `approved`
   - `reviewed_at` → `now()`
   - `reviewed_by` → el `id` del admin en `admin_users` (hoy solo existe si se insertó manualmente esa fila — ver nota abajo)
5. **Para rechazar:** `verification_status` → `rejected`. El usuario ve el estado en el perfil y puede volver a enviar la solicitud (que la resetea a `pending`).

## Qué desbloquea la aprobación

- Badge "Refugio verificado" en sus avisos de adopción (feed y detalle).
- Sus datos de donación (alias / CVU / link de MercadoPago, si los cargó) se muestran en el detalle de sus avisos.
- Puede publicar perros en adopción — la policy `adoption_dogs_insert_verified_shelter` exige `verification_status = 'approved'`.

## Por qué esto es seguro

Un trigger en `public.shelters` (`shelters_protect_admin_columns`, migración `20260728000003`) bloquea a nivel de base de datos que un usuario común pueda setear `verification_status` a `approved`/`rejected`, o tocar `reviewed_by`/`reviewed_at`/`verification_documents`/`cuit`, llamando directamente a la API — sin pasar por este proceso manual. Solo puede resetear su propia fila a `pending` (pedir o repetir la solicitud). El trigger no interviene cuando la conexión no pasa por PostgREST (dashboard, SQL Editor), así que el proceso de arriba no se ve afectado.

## Nota sobre `admin_users`

`shelters.reviewed_by` referencia `admin_users(id)`, y esa tabla no tiene una policy de insert desde el cliente — hay que insertar la fila del admin a mano en el dashboard (SQL Editor) la primera vez:

```sql
insert into public.admin_users (id) values ('<uuid del usuario admin en auth.users>');
```
