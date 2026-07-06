Perros de la calle — Roadmap de Construcción
Versión 0.1 · Complementa Discovery v0.3 y Arquitectura v0.1


ENFOQUE
   • Tracking: Linear (free tier), mismo equipo que Doggers o proyecto nuevo — a decidir.
   • Estimación: T-shirt sizes (S/M/L/XL), sin fechas absolutas.
   • Ritmo: sin compromiso fijo; reajustar con data real tras las primeras épicas.
   • Filosofía: cada épica entrega valor y se testea de forma independiente. El orden desbloquea las épicas siguientes.

Referencia de tamaños:
S = pocos días | M = ~1-2 semanas | L = ~2-3 semanas | XL = ~3-4+ semanas
(Estimaciones relativas, no compromisos de fecha.)




PHASE 1 — FOUNDATIONS

E01 · Setup técnico inicial — S
   Repo git (ya creado), proyecto de Supabase (ya creado), Expo init (ya hecho), falta: GitHub Actions básico, branch protections, cliente Supabase (ya agregado en `src/services/supabase.ts`).

E02 · Modelo de datos en Supabase — M
   Las 9 tablas del ERD (USUARIO, REFUGIO, ADMIN_USER, AVISO, PERRO_ADOPCION, SUGERENCIA_MATCH, REPORTE, DONACION, NOTIFICACION_PUSH), RLS, migraciones versionadas, índices PostGIS.

E03 · Auth + perfiles base — M
   Supabase Auth, tabla USUARIO con roles, login/registro básico, extensión a REFUGIO y ADMIN_USER.


PHASE 2 — NÚCLEO DE AVISOS

E04 · Publicar y buscar avisos — L
   Crear aviso (tipo perdido/encontrado/callejero, foto, ubicación, descripción), listar cercanos con mapa (Google Maps), detalle, marcar resuelto.

E05 · Sugerencias de match — M
   Edge Function que genera sugerencias al crear un aviso (ST_DWithin, sin filtro de fecha), listado de sugerencias con radio ajustable por el usuario, push de notificación (Expo Notifications), confirmar/descartar.


PHASE 3 — REFUGIOS Y ADOPCIÓN

E06 · Onboarding y verificación de refugio — M
   Registro de refugio, subida de documentos de respaldo, cola de verificación manual (queries SQL, sin panel ni SLA fijo en v1).

E07 · Publicación de perros en adopción — M
   CRUD de PERRO_ADOPCION (solo refugios verificados), listado y detalle para adoptantes, marcar adoptado.


PHASE 4 — MONETIZACIÓN

E08 · Donaciones vía MercadoPago — L
   Checkout de donación, webhook de MP, cálculo y registro de comisión (5%), historial por refugio. Liquidación al refugio: proceso manual (definir mecánica exacta durante la épica, precedente ADR-009 de Doggers).


PHASE 5 — CONFIANZA Y MODERACIÓN

E09 · Reportes de avisos falsos/duplicados — S
   Crear reporte sobre un AVISO o PERRO_ADOPCION, cola de revisión manual (queries SQL, sin panel ni SLA fijo).


PHASE 6 — PRE-LANZAMIENTO

E10 · Monitoring — S
   Setup Sentry, alertas básicas a email del founder, logs de Supabase.

E11 · Polish + T&C + QA manual pre-launch — M
   Términos y condiciones (asesoramiento legal), pulido de UX, QA manual de los flujos críticos, soft launch.




DEPENDENCIAS CLAVE
   • E01 → E02 → E03 (foundations en cadena).
   • E03 desbloquea E04 y E06 (necesitás auth para publicar avisos o registrar un refugio).
   • E04 → E05 (necesitás avisos existentes para poder sugerir matches).
   • E06 → E07 (necesitás un refugio verificado para publicar perros en adopción).
   • E06 → E08 (necesitás un refugio verificado para poder recibir donaciones).
   • E04 + E07 → E09 (el reporte aplica tanto a avisos como a perros en adopción).
   • E05 + E08 + E09 → E10 + E11 (pre-launch necesita el producto funcionando end-to-end).


Diagrama (Mermaid flowchart) — pegar en https://mermaid.live

flowchart TD
    subgraph P1[Phase 1 Foundations]
        E01[E01 Setup S] --> E02[E02 Datos M] --> E03[E03 Auth M]
    end
    subgraph P2[Phase 2 Nucleo avisos]
        E04[E04 Avisos L] --> E05[E05 Matching M]
    end
    subgraph P3[Phase 3 Refugios]
        E06[E06 Verif refugio M]
        E07[E07 Adopcion M]
    end
    subgraph P4[Phase 4 Monetizacion]
        E08[E08 Donaciones L]
    end
    subgraph P5[Phase 5 Confianza]
        E09[E09 Reportes S]
    end
    subgraph P6[Phase 6 Pre-launch]
        E10[E10 Monitoring S]
        E11[E11 Polish M]
    end
    E03 --> E04
    E03 --> E06
    E04 --> E05
    E06 --> E07
    E06 --> E08
    E04 --> E09
    E07 --> E09
    E05 --> E10
    E08 --> E10
    E09 --> E10
    E10 --> E11


RESUMEN
   • 6 phases, 11 épicas.
   • Distribución: 3 L, 6 M, 2 S.
   • Próximo paso: cargar las épicas en Linear, o seguir con E01 (cerrar el setup técnico pendiente) directamente.


— Documento vivo. Actualizar a medida que se completan épicas. —
