Perros de la calle — Arquitectura del MVP
Versión 0.1 · Acompaña al Discovery v0.3 · Borrador, pendiente de confirmación del founder




ÍNDICE
   1. Resumen ejecutivo
   2. Arquitectura general
   3. Modelo de datos (ERD)
   4. Contratos de API
   5. Flujos críticos
   6. ADRs — Decisiones técnicas
   7. Operaciones y calidad
   8. Próximos pasos




────────────────────────────────────────
1. RESUMEN EJECUTIVO
────────────────────────────────────────


Stack técnico (en una página)
   • App móvil: React Native + TypeScript + Expo (mismo stack que Doggers, iOS + Android).
   • Backend: Supabase (Auth + PostgreSQL + Storage + Realtime + Edge Functions) — proyecto propio, separado del de Doggers.
   • Base de datos: PostgreSQL + PostGIS (geo, para ubicación de avisos y búsqueda por cercanía).
   • Pagos: MercadoPago SDK (solo para donaciones).
   • Verificación de identidad: ninguna en v1 — verificación de refugios 100% manual (ver ADR-003).
   • Mapas: Google Maps SDK (mostrar avisos en mapa).
   • Notificaciones push: Expo Notifications (sugerencias de match, avisos cercanos).
   • Panel admin: diferido en v1 — queries SQL manuales directo en Supabase (ver ADR-007), igual que hizo Doggers antes de construir su panel.
   • CI/CD: GitHub Actions + EAS Build (a configurar).
   • Monitoring: Sentry + logs Supabase (a configurar).


Modelo operativo del primer tramo
   • Construcción solo, con Claude Code.
   • Mercado piloto: Provincia de Buenos Aires completa (GBA + interior).
   • El founder resuelve verificación de refugios y reportes manualmente vía queries SQL o dashboard de Supabase, hasta que el volumen justifique un panel admin propio.
   • Lo más manual posible, mismo criterio que Doggers.


Estado del proyecto al cierre de esta fase
   • Discovery: cerrado (v0.3).
   • Arquitectura: este documento, pendiente de confirmación.
   • Ya existe: scaffold de Expo, repo git, proyecto de Supabase creado (`perros-de-la-calle`, ref `jvbtjowjnlwuicuuexhk`).
   • Próximo paso: confirmar este documento → roadmap de épicas → modelo de datos en Supabase.




────────────────────────────────────────
2. ARQUITECTURA GENERAL
────────────────────────────────────────


Descripción del sistema

Perros de la calle es una app móvil conectada a Supabase como backend-as-a-service, igual que Doggers pero con proyecto de Supabase propio (no comparten datos). El backend se comunica con MercadoPago (donaciones) y Google Maps (visualización de avisos). No hay verificación de identidad de terceros (Truora) en v1 — la verificación de refugios es manual.


Capas del sistema

Capa 1 — Clientes
   • App móvil (React Native + Expo): usada por dueños, personas que encuentran perros, refugios/rescatistas y adoptantes.
   • (Futuro, no v1) Panel admin web: si el volumen de verificaciones/reportes lo justifica.

Capa 2 — Backend (Supabase)
   • Auth: gestión de usuarios y sesiones (unifica todos los roles).
   • PostgreSQL: base de datos relacional.
   • PostGIS: extensión para queries geográficos (búsqueda de avisos cercanos, sugerencias de match).
   • Storage: fotos de avisos y de perros en adopción.
   • Edge Functions: lógica de negocio (sugerencias de match, donaciones, verificación de refugios).

Capa 3 — Servicios externos
   • MercadoPago: procesamiento de donaciones.
   • Google Maps: mapas, visualización geográfica de avisos.
   • Expo Notifications: push de sugerencias de match y avisos cercanos.


Diagrama (Mermaid syntax)
[Para visualizarlo: copiar el bloque siguiente y pegarlo en https://mermaid.live]


flowchart TD
    A[App móvil React Native] --> B[Supabase Backend]
    B --> DB[(PostgreSQL + PostGIS)]
    B --> ST[(Supabase Storage)]
    B --> MP[MercadoPago]
    B --> GM[Google Maps]
    B --> EP[Expo Push]




────────────────────────────────────────
3. MODELO DE DATOS (ERD)
────────────────────────────────────────


Inventario de entidades (9 total)

Personas:
   • USUARIO, REFUGIO, ADMIN_USER.

Avisos y adopción:
   • AVISO, PERRO_ADOPCION, SUGERENCIA_MATCH.

Comunidad y moderación:
   • REPORTE.

Financieras:
   • DONACION.

Operativas:
   • NOTIFICACION_PUSH.


Decisiones de diseño del modelo
   • USUARIO unifica auth para todos los roles (dueño, quien encuentra, adoptante, refugio, admin) — mismo patrón que Doggers.
   • REFUGIO y ADMIN_USER extienden USUARIO (relación 1 a 1 opcional), igual que DUENO/PASEADOR/ADMIN_USER en Doggers.
   • AVISO es una tabla única polimórfica con campo `tipo` (perdido / encontrado / callejero) en vez de 3 tablas separadas — comparten casi todos los campos (foto, ubicación, descripción, estado).
   • No existe una tabla PERRO persistente: los datos del perro (nombre si se conoce, raza, foto) viven embebidos en AVISO y en PERRO_ADOPCION, porque no hay un perfil de mascota que se reutilice entre publicaciones (a diferencia de Doggers, donde el mismo perro pasea muchas veces).
   • PERRO_ADOPCION separado de AVISO: pertenece a un REFUGIO verificado, tiene su propio ciclo de estado (disponible / en_proceso / adoptado) distinto al de un aviso (activo / resuelto / cerrado).
   • SUGERENCIA_MATCH conecta dos AVISO (uno tipo perdido, uno tipo encontrado) — se genera automáticamente al crear un aviso nuevo, buscando candidatos cercanos sin límite de fecha (ver Flujo 5.1).
   • REPORTE es polimórfico: puede apuntar a un AVISO o a un PERRO_ADOPCION (uno de los dos, no ambos).
   • DONACION registra monto, comisión (5%) y estado, referenciando el pago de MercadoPago — mismo patrón que PAGO en Doggers.
   • Todos los estados clave son enums explícitos.
   • Implícito en todas: created_at, updated_at, deleted_at.


Diagrama (Mermaid syntax)
[Para visualizarlo: copiar el bloque siguiente y pegarlo en https://mermaid.live]


erDiagram
    USUARIO ||--o| REFUGIO : "es"
    USUARIO ||--o| ADMIN_USER : "es"
    USUARIO ||--o{ AVISO : "publica"
    USUARIO ||--o{ REPORTE : "reporta"
    USUARIO ||--o{ DONACION : "dona"
    USUARIO ||--o{ NOTIFICACION_PUSH : "recibe"
    REFUGIO ||--o{ PERRO_ADOPCION : "publica"
    REFUGIO ||--o{ DONACION : "recibe"
    AVISO ||--o{ REPORTE : "recibe"
    AVISO ||--o{ SUGERENCIA_MATCH : "es_candidato_de"
    PERRO_ADOPCION ||--o{ REPORTE : "recibe"
    ADMIN_USER ||--o{ REFUGIO : "verifica"
    ADMIN_USER ||--o{ REPORTE : "resuelve"




────────────────────────────────────────
4. CONTRATOS DE API
────────────────────────────────────────


Convenciones
   • Autenticación: JWT de Supabase Auth en header Authorization.
   • Formato: JSON.
   • Muchos endpoints se resuelven directo con el SDK de Supabase desde el cliente, protegidos por Row Level Security (RLS). Los listados abajo son los que requieren lógica de negocio custom (Edge Functions).


Resumen por dominio (~20 endpoints)

Dominio: Auth (nativo de Supabase Auth)
   • registro, login, logout, refresh.

Dominio: Perfil de refugio (Edge Functions)
   • registrar-refugio, subir-documentos, mi-perfil, estado-verificacion.
   • Total: ~4 endpoints.

Dominio: Avisos (Edge Functions con PostGIS)
   • crear, listar-cercanos (por zona/tipo/radio), detalle, marcar-resuelto.
   • Total: ~4 endpoints.

Dominio: Sugerencias de match (Edge Functions)
   • listar-para-aviso, confirmar, descartar.
   • Total: ~3 endpoints.

Dominio: Adopción (mix Supabase básico + Edge Functions)
   • publicar-perro, listar, detalle, marcar-adoptado.
   • Total: ~4 endpoints.

Dominio: Reportes (Edge Functions)
   • crear-reporte, listar-pendientes (admin), resolver (admin).
   • Total: ~3 endpoints.

Dominio: Donaciones (Edge Functions críticas)
   • crear-donacion (checkout MP), webhook MP, historial-por-refugio.
   • Total: ~3 endpoints.

Dominio: Notificaciones (Edge Functions)
   • registrar-token, listar, marcar-leida.
   • Total: ~3 endpoints.

Dominio: Panel admin manual (v1: queries SQL directas, no endpoints — ver ADR-007)




────────────────────────────────────────
5. FLUJOS CRÍTICOS
────────────────────────────────────────


5.1 — PUBLICAR AVISO + SUGERENCIAS DE MATCH


Diagrama (Mermaid sequenceDiagram)
[Para visualizarlo: copiar el bloque siguiente y pegarlo en https://mermaid.live]


sequenceDiagram
    autonumber
    participant U as App Usuario
    participant B as Backend
    participant D as DB + PostGIS
    participant O as App Otro Usuario
    U->>B: POST /avisos (tipo, foto, ubicación)
    B->>D: INSERT aviso
    Note over B: si tipo=perdido, buscar tipo=encontrado (y viceversa)
    B->>D: ST_DWithin sobre avisos del tipo opuesto, sin filtro de fecha
    D-->>B: candidatos ordenados por distancia
    B->>D: INSERT sugerencia_match (una por candidato)
    B->>O: push "posible match encontrado"
    O->>B: GET /sugerencias-match/{aviso_id}
    B-->>O: lista de candidatos con distancia
    Note over O: revisa y contacta manualmente si le parece un match


Notas críticas
   • Radio de búsqueda es un parámetro que ajusta el usuario al ver sugerencias (no hardcoded), pero la primera pasada de candidatos al crear el aviso usa un radio amplio por defecto para no perder posibles matches.
   • Sin límite de fecha: cualquier aviso activo del tipo opuesto es candidato.
   • El match nunca se resuelve automático — solo se sugiere. El contacto y la confirmación son manuales entre las partes (WhatsApp/teléfono del aviso).


5.2 — DONACIÓN A REFUGIO


Diagrama (Mermaid sequenceDiagram)
[Para visualizarlo: copiar el bloque siguiente y pegarlo en https://mermaid.live]


sequenceDiagram
    autonumber
    participant D as App Donante
    participant B as Backend
    participant M as MercadoPago
    participant BD as DB
    participant R as Refugio
    D->>B: POST /donaciones (refugio_id, monto)
    B->>M: crear preferencia de pago
    M-->>B: checkout URL
    B-->>D: redirige a checkout MP
    D->>M: completa pago
    M->>B: POST /webhooks/mercadopago
    B->>BD: INSERT donacion (monto, comisión 5%, estado=aprobado)
    B->>R: push "recibiste una donación"
    Note over B,BD: liquidación al refugio: manual en v1 (igual que ADR-009 de Doggers)


Notas críticas
   • Webhook de MP siempre procesado con firma validada.
   • Comisión del 5% se calcula y guarda en el momento de registrar la donación, no al liquidar.
   • Mecánica exacta de liquidación (cuándo y cómo se le paga al refugio) queda pendiente de definir — en v1 probablemente manual, igual que hace Doggers con los paseadores (ADR-009 de Doggers).


5.3 — VERIFICACIÓN DE REFUGIO


Diagrama (Mermaid sequenceDiagram)
[Para visualizarlo: copiar el bloque siguiente y pegarlo en https://mermaid.live]


sequenceDiagram
    autonumber
    participant R as App Refugio
    participant B as Backend
    participant D as DB
    participant F as Founder (manual)
    R->>B: POST /registrar-refugio (datos + documentos)
    B->>D: INSERT refugio (estado=pendiente)
    Note over F: sin SLA fijo en v1 — se revisa según entran solicitudes
    F->>D: SQL manual: revisa documentos, aprueba o rechaza
    D-->>R: push "tu refugio fue aprobado/rechazado"
    Note over R: si aprobado, ya puede publicar en adopción y recibir donaciones


Notas críticas
   • Sin Truora ni verificación automática — 100% manual (ADR-003).
   • Sin SLA de revisión comprometido en v1.
   • Hasta que exista un panel admin, la revisión se hace con queries SQL directas en Supabase (mismo approach documentado en `doggers-manual-admin-queries` para Doggers antes de su E11).


5.4 — REPORTE DE AVISO FALSO/DUPLICADO


Diagrama (Mermaid sequenceDiagram)
[Para visualizarlo: copiar el bloque siguiente y pegarlo en https://mermaid.live]


sequenceDiagram
    autonumber
    participant U as App Usuario
    participant B as Backend
    participant D as DB
    participant F as Founder (manual)
    U->>B: POST /reportes (aviso_id o perro_adopcion_id, motivo)
    B->>D: INSERT reporte (estado=pendiente)
    Note over F: revisión manual, sin SLA fijo
    F->>D: SQL manual: revisa y decide (ocultar aviso / descartar reporte)
    B-->>U: (opcional) confirmación de que se revisó


Notas críticas
   • Publicación siempre inmediata (sin cola previa) — el reporte es el único mecanismo de moderación en v1.
   • No hay umbral automático de "N reportes = ocultar" en v1; toda decisión es manual.




────────────────────────────────────────
6. ADRs — DECISIONES TÉCNICAS
────────────────────────────────────────


Formato condensado: Qué, Por qué, Alternativas descartadas, Implicancias.




ADR-001 — Stack móvil: React Native + TypeScript + Expo (reuso de Doggers)
   Qué: mismo stack que Doggers.
   Por qué: el founder ya conoce este stack y su tooling; cero curva de aprendizaje nueva.
   Alternativas descartadas: evaluar otro proveedor de backend/stack (ver conversación previa) — descartado porque no justifica el costo de aprendizaje para el beneficio marginal.
   Implicancias: mismas convenciones de código, mismo cliente Supabase (`src/services/supabase.ts`), mismas herramientas de CI/CD disponibles.


ADR-002 — Backend: proyecto de Supabase propio, separado del de Doggers
   Qué: Supabase project `perros-de-la-calle` (ref `jvbtjowjnlwuicuuexhk`), independiente del de `doggers`.
   Por qué: son productos distintos, con datos, usuarios y ciclo de vida separados — mezclar tablas en el mismo proyecto generaría acoplamiento innecesario.
   Alternativas descartadas: reusar el proyecto de Supabase de Doggers con tablas prefijadas — descartado, mezcla datos de dos productos distintos.
   Implicancias: cuenta ya tiene 2 proyectos activos gratis (límite de Supabase); se pausó `doggers` para liberar cupo al crear este. Si ambos necesitan estar activos simultáneamente, hay que pasar uno a plan Pro (~USD 25/mes).


ADR-003 — Sin verificación automática de identidad (Truora) para refugios en v1
   Qué: verificación de refugios 100% manual, sin proveedor externo.
   Por qué: el volumen esperado en v1 es bajo, y el costo/complejidad de integrar un proveedor de verificación no se justifica todavía. La revisión manual (documentos + redes sociales) es suficiente para arrancar.
   Alternativas descartadas: Truora (mismo proveedor que Doggers) — descartado por costo por verificación y complejidad de integración para un volumen inicial bajo.
   Implicancias: el founder es el cuello de botella de aprobación. Sin SLA comprometido en v1 (decisión de discovery). Revisar si migrar a Truora cuando el volumen de refugios crezca.


ADR-004 — AVISO como tabla polimórfica única (perdido/encontrado/callejero)
   Qué: una sola tabla AVISO con campo `tipo` en vez de 3 tablas separadas.
   Por qué: los 3 tipos comparten casi todos los campos (foto, ubicación, descripción, fecha, estado, usuario). Separarlos en 3 tablas duplicaría columnas y complicaría las queries de matching (que necesitan comparar entre tipos).
   Alternativas descartadas: 3 tablas separadas (AVISO_PERDIDO, AVISO_ENCONTRADO, AVISO_CALLEJERO) — descartado por duplicación y por complicar el join necesario para sugerencias de match.
   Implicancias: queries y RLS deben filtrar siempre por `tipo`. Los campos específicos de "callejero" (si los hay) quedan nullable para los otros tipos.


ADR-005 — Sugerencias de match: generadas al crear el aviso (Edge Function), no por job periódico
   Qué: al insertar un AVISO nuevo, una Edge Function busca candidatos del tipo opuesto y genera SUGERENCIA_MATCH inmediatamente.
   Por qué: la inmediatez importa — cuanto antes se sugiera un posible match, más rápido se puede recuperar al perro. Un job periódico (ej. cada hora) introduce demora innecesaria.
   Alternativas descartadas: job periódico (cron) que recorre avisos activos — descartado por la demora que introduce y porque el volumen esperado en v1 no justifica optimizar con batch processing.
   Implicancias: cada creación de aviso dispara una query PostGIS contra todos los avisos activos del tipo opuesto. A escala grande esto podría requerir revisión, pero es aceptable para v1.


ADR-006 — Donaciones: MercadoPago con comisión fija de 5%, liquidación manual en v1
   Qué: se cobra vía MercadoPago, se calcula 5% de comisión al momento de la donación, y se liquida al refugio manualmente (mecánica exacta pendiente de definir).
   Por qué: MercadoPago es el procesador ya validado en Doggers para Argentina. La liquidación manual sigue el mismo precedente que Doggers (ADR-009 de Doggers), que evita construir infraestructura de liquidación automática antes de tener volumen real.
   Alternativas descartadas: liquidación automática diaria (como Doggers planea en teoría) — descartado por ahora porque agrega complejidad sin volumen que la justifique.
   Implicancias: el founder necesita un proceso manual (aunque sea una planilla o queries) para trackear qué se le debe a cada refugio y pagarlo. Se documentará junto con el modelo de datos.


ADR-007 — Panel admin: diferido, queries SQL manuales en v1
   Qué: sin panel admin web en v1. La verificación de refugios y resolución de reportes se hace con queries SQL directas en el dashboard de Supabase.
   Por qué: el volumen esperado en v1 es bajo (un founder, pocas solicitudes), y Doggers mismo operó así (ver `doggers-manual-admin-queries`) antes de justificar construir su panel (E11). No tiene sentido construir un panel antes de validar que el producto tiene tracción.
   Alternativas descartadas: panel admin Next.js desde el día uno (como en Doggers) — descartado porque en Doggers ese panel se construyó recién en la épica E11, después de meses de operar manual.
   Implicancias: el founder necesita queries documentadas y accesibles para las operaciones más comunes (aprobar refugio, resolver reporte). Se documentarán cuando se cree el modelo de datos, igual que se hizo para Doggers.


ADR-008 — Radio de búsqueda de match ajustable por el usuario (client-side)
   Qué: el radio de búsqueda de sugerencias de match no está fijo en el backend; el usuario lo ajusta desde la app (slider), y ese valor se pasa como parámetro a la query.
   Por qué: decisión de discovery — el founder lo comparó con el slider de distancia de apps de citas, y prefiere darle control al usuario en vez de imponer un valor fijo.
   Alternativas descartadas: radio fijo del sistema (5km o 15km) — descartado en discovery a favor del control del usuario.
   Implicancias: la query de sugerencias necesita aceptar el radio como parámetro. El radio inicial al crear el aviso (antes de que el usuario ajuste nada) usa un valor por defecto amplio para no perder candidatos.




────────────────────────────────────────
7. OPERACIONES Y CALIDAD
────────────────────────────────────────


Criterios guía: automatización máxima, free tier, cero servidor que mantener, baja fricción para un founder solo — mismos criterios que Doggers.


OPS-001 — Testing strategy
   • Unit tests con Vitest para lógica de negocio en Edge Functions (matching, cálculo de comisión).
   • QA manual del founder para casos de uso clave antes de cada release.
   • E2E (Maestro) diferido hasta tener los flujos core estables — no es v1-blocking dado el tamaño del equipo.


OPS-002 — Monitoring y alertas
   • Sentry para errores en cliente y Edge Functions (free tier).
   • Logs nativos de Supabase.
   • Alertas a email del founder en v1.


OPS-003 — CI/CD
   • GitHub Actions + EAS Build, mismo patrón que Doggers.
   • Supabase CLI para migraciones versionadas en el repo.


OPS-004 — Manejo de secretos
   • Mismo patrón que Doggers: nunca commitear secrets, `.env.example` en el repo, GitHub/EAS Secrets para CI/CD y build.


OPS-005 — Backups
   • Backups automáticos diarios de Supabase (retención free tier: 7 días).


Resumen de costos operativos v1
   • $0 USD/mes en el inicio (todo en free tier).
   • Variable: MercadoPago cobra su propia comisión de procesamiento sobre las donaciones (además del 5% de la plataforma).




────────────────────────────────────────
8. PRÓXIMOS PASOS
────────────────────────────────────────


Fase A — Confirmar este documento con el founder.

Fase B — Modelo de datos en Supabase
   • Crear las 9 tablas, RLS, índices (incluido PostGIS).

Fase C — Roadmap de épicas
   • Definir orden de construcción (equivalente a roadmap-v0.1.md de Doggers).

Fase D — Construcción del MVP
   • Sprints iterativos, releases internas frecuentes.




— Documento vivo. Pendiente de confirmación del founder antes de pasar a modelo de datos. —
