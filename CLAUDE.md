@AGENTS.md

# Perros de la calle — Contexto del proyecto

## Qué es
App para reportar y buscar perros perdidos y encontrados, y para que refugios publiquen perros en adopción. A diferencia de Doggers (marketplace de paseadores), esta app es para el público en general — no solo para usuarios de Doggers. Proyecto separado, con su propio repo, backend y roadmap.

## Stack
- Mobile + Web: Expo SDK 57 (React Native 0.86 + TypeScript, expo-router, react-native-web)
- Backend: Supabase (Auth + PostgreSQL + PostGIS + Storage + Edge Functions) — proyecto propio (ref `jvbtjowjnlwuicuuexhk`), separado del de Doggers/Jugapp
- Mapas: react-native-maps + Google Maps API
- Estado: Zustand
- Web: output `server` (no `static`) para que `/p/[id]` y `/pa/[id]` (landings públicas dinámicas) funcionen en EAS Hosting
- Build: EAS Build (dev client), projectId en `app.config.ts`. Bundle id `com.perrosdelacalle.app` (iOS/Android)

## Infraestructura
- GitHub (privado): `github.com/toro1977/perros-de-la-calle`, remote `origin`, branch `main`.
- Supabase: proyecto propio, ref `jvbtjowjnlwuicuuexhk`.
- Docs de referencia en `docs/`: `discovery-v0.3.md`, `arquitectura-v0.1.md`, `roadmap-v0.1.md` (6 fases / 11 épicas E01–E11), y los briefs de rediseño `rediseno-perros-de-la-calle.md` → `rediseno-perros-de-la-calle-v2.md` → `rediseno-v3.md` (el más nuevo; UX de navegación, estados, robustez — ya aplicado en su mayoría).

## Estado actual
(según `git log`, no según el roadmap original — este documento estaba desactualizado hasta el 2026-07-20)

- **E01 Setup, E02 modelo de datos, E03 auth**: hechos. Auth por email/contraseña, perfiles con foto, borrar cuenta (Edge Function `delete-account`, requisito de Apple).
- **E04 Publicar y buscar avisos**: hecho y con varias vueltas de pulido — fotos múltiples, ubicación manual vía picker + geocodificación inversa (Edge Function `reverse-geocode`, con localidad+partido+provincia), mapa en el detalle, teléfono normalizado a E.164 para que el link de WhatsApp ande, contacto vía RPC (`get_dog_post_contact_phone`), visor de fotos a pantalla completa con zoom/swipe.
- **Perros en adopción** (variante de E07, adelantada): CRUD completo con múltiples fotos, gestión propia desde "Mis avisos", edición, landing pública + compartir (`/pa/[id]`).
- **E06 verificación de refugio + donaciones "mostrar" (2026-07-28)**: implementado. El registro quedó plano (todos entran como `individual`, sin selector de rol) — ser rescatista es una **verificación aprobada**, no un tipo de cuenta. Desde el perfil se solicita verificación (`src/app/(app)/shelter-profile.tsx`: nombre, localidad, WhatsApp de contacto, redes, bio); el admin aprueba/rechaza a mano desde el dashboard de Supabase seteando `shelters.verification_status` (proceso documentado en `docs/verificacion-refugios.md` — no hay pantalla de admin todavía). Aprobado desbloquea: badge "Refugio verificado" (feed, detalle y landing pública), publicar en adopción (policy `adoption_dogs_insert_verified_shelter`), y mostrar datos de donación (alias/CVU/link de MercadoPago) en el detalle del aviso — la app **no procesa pagos**, solo exhibe esos datos. Un trigger (`shelters_protect_admin_columns`) bloquea a nivel de DB que un usuario se auto-apruebe llamando directo a la API; verificado en runtime que el intento queda neutralizado sin romper la edición normal del perfil de refugio.
  - De paso se encontraron y corrigieron dos bugs preexistentes: `list_adoption_dogs`/`get_adoption_dog` devolvían vacío para cualquiera que no fuera el dueño del refugio desde la migración `20260708000001` (el join a `shelters` quedó sin policy pública tras el cambio a la vista `shelters_public`) — el feed de adopción estaba roto para todo el mundo salvo cada refugio viendo lo suyo; y la landing pública `/pa/[id]` contactaba al teléfono personal del dueño de la cuenta en vez del WhatsApp del refugio.
- **E05 (sugerencias de match), E08 (donaciones vía MercadoPago con cobro real — la parte "mostrar" ya está), E09 (reportes), E10 (monitoring/Sentry)**: no empezados. Las tablas de E05 (`match_suggestions`) existen en la migración pero sin RPC/UI.
- **Diseño y navegación**: sistema de diseño propio (paleta terracota, `src/constants/theme.ts`, sentence case en toda la copy), con 3 rondas de rediseño documentadas en `docs/`. La barra de navegación inferior pasó por varias iteraciones (edge-to-edge estilo Instagram → 5 botones → Liquid Glass real en iOS 26 → pill estilo Tinder) y se asentó en un **estilo simple tipo WhatsApp** (`src/components/bottom-tab-bar.tsx`): Feed · Mis avisos · **[Publicar]** central elevado · Alertas · Perfil. "Mapa" no es un tab — es un toggle Lista/Mapa dentro del feed. El tab **"Alertas" es un placeholder** (ícono + punto de "novedades", sin pantalla con datos reales todavía — no tiene backend).
- **Tema — superficie elevada sobre fondo papel** (2026-07-21): `background` es un papel cálido (`#F2F0EA`), `surface` blanco puro — las cards flotan por diferencia de tono + sombra, sin borde (un borde con `overflow:'hidden'` + `borderRadius` genera una costura oscura donde la foto toca la esquina). Cualquier `ThemedView` anidado dentro de una card necesita `backgroundColor: theme.surface` explícito — por default hereda `theme.background` (el papel), y ese bug apareció repetido en varios componentes (cards del feed, cards de "Mis avisos", el location picker) antes de que quedara claro que había que revisarlo en todo el árbol, no solo donde se lo pidieron.
- **Card del feed**: botón de contacto por WhatsApp (`src/utils/whatsapp.ts`, reusado en `post/[id].tsx`). Ojo con `Link asChild` + `Pressable` con `style` de función — el `Slot` de expo-router mergea `style` como `{...slotStyle, ...childStyle}`, y si `childStyle` es una función el spread da `{}` y el estilo entero desaparece en silencio, sin error. El patrón seguro es trackear `pressed` a mano (`onPressIn`/`onPressOut`) y pasar siempre un objeto plano.
- **Reload en foco vs. pull-to-refresh**: `useFocusEffect` dispara refetch cada vez que una tab vuelve a tener foco (no solo en el mount inicial). Si ese refetch está atado al `refreshing` de un `FlatList`/`SectionList`, dispara el spinner nativo de pull-to-refresh en cada cambio de tab. Separar el estado: refetch silencioso en foco, estado de `refreshing` propio solo para el gesto manual de pull (ver `(tabs)/index.tsx` y `(tabs)/my-posts.tsx`).
- **`expo start --web` roto (server output, SSR)**: cualquier ruta devuelve 500 con `codegenNativeComponent is not a function`. Es `react-native-maps` (llama a `codegenNativeComponent`, no es compatible con el bundle de Node/SSR que usa el output `server`) — confirmado que es preexistente, no algo de una sesión puntual, reproduciendo el mismo error en un commit bien anterior. No probar features nuevas levantando el dev server web; usar el dispositivo/simulador nativo como siempre. No investigado a fondo si esto también afecta al build real de EAS Hosting (que sí necesita `/p/[id]` y `/pa/[id]` funcionando) — pendiente de confirmar.
- **Última actividad real de código:** 2026-07-28 (verificación de refugios + donaciones "mostrar" + badge). Antes de esta sesión, este archivo decía "2026-07-21" con el rediseño de card como último punto — confiar en `git log`, no en este documento, si vuelve a pasar.

## Reglas de trabajo
- El fundador es QA Lead, no programador. Explicar decisiones cuando sea necesario.
- Trabajar paso a paso. Confirmar antes de avanzar.
- Commits frecuentes con mensajes descriptivos en español.
- Código y comentarios en inglés, comunicación en español.
- No hay librerías de estilos nuevas — todo color/tamaño/espaciado sale de los tokens en `src/constants/theme.ts`. Sentence case en toda la copy de UI.
