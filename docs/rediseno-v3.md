# Rediseño v3 — Navegación, estados y detalles

App Expo / React Native (TypeScript, expo-router, StyleSheet).
Continúa `docs/rediseno-perros-de-la-calle.md` y `docs/rediseno-v2-correcciones.md`, ya aplicados.

**Estado actual:** la app está sólida. Este brief afina navegación, manejo de estados y un par de detalles de robustez. No hay bugs que rompan funcionalidad acá — es todo mejora de UX.

**Reglas que se mantienen:** sin librerías de estilos nuevas. Todo color/tamaño/espaciado sale de los tokens en `src/constants/theme.ts`. Sentence case en toda la copy de UI.

---

# Sección A — Barra de navegación inferior

**Leer esta sección entera antes de tocar nada.** Los cuatro cambios de acá modifican el mismo componente (`src/components/bottom-tab-bar.tsx`) y la composición de slots. Hay que pensarlos juntos, no uno por uno, o la barra queda incoherente.

**Composición actual (5 slots iguales):** Feed · Mapa · Publicar · Avisos · Perfil.

**Composición objetivo:** Feed · Alertas · **[Publicar]** · Mis avisos · Perfil — con "Publicar" destacado en el centro, "Mapa" fuera de la barra, y "Avisos" renombrado. Detalle abajo.

## A1. Sacar "Mapa" de la barra → toggle Lista/Mapa en el feed

**Por qué:** "Mapa" no es un destino, es un modo de vista sobre la misma pantalla y la misma data. Tenerlo como tab al lado de "Feed" mezcla dos modelos mentales: cuatro slots son "lugares" y uno es un "interruptor". El usuario toca Mapa y no navega a ningún lado.

**Qué hacer:**
- Quitar el slot "Mapa" del tab bar.
- Poner un control segmentado **Lista / Mapa** dentro del feed (`src/app/(app)/index.tsx`), arriba de la lista, cerca de los filtros. El `viewMode` ya vive en `feedViewStore` — es solo mover quién lo togglea.
- El segmented control es el patrón estándar para "misma data, dos representaciones" (lo usan Mapas, Airbnb, inmobiliarias).

## A2. Destacar "Publicar" como acción principal

**Por qué:** publicar es la acción de la que depende toda la app — sin publicaciones no hay nada que buscar. Hoy se ve idéntica a "Perfil". La jerarquía visual no refleja la importancia real.

**Qué hacer:**
- "Publicar" va en el **centro** de la barra, visualmente elevado y con el color de acento: círculo relleno en `theme.accent`, ícono `add` en `theme.onAccent`, un poco más grande que el resto y levemente sobresalido hacia arriba.
- Los otros tabs se mantienen como están (ícono + label, estilo texto).
- Es el patrón "botón de crear central" de Instagram / X / TikTok, justificado por la misma razón: es la acción que el producto quiere maximizar.
- **Nota de simetría:** con "Publicar" al centro, la barra se lee mejor con un número impar de slots (2 + botón central + 2). Por eso el objetivo suma "Mis avisos" a la barra (ver A5) — para cerrar la simetría 2·1·2. Si preferís no sumarlo, dejá 2 tabs a un lado y 1 al otro, pero la simetría se resiente.

## A3. Renombrar el tab "Avisos" (notificaciones)

**Por qué — colisión de vocabulario:** en toda la app un post **es** un "aviso" (`Publicar aviso`, `Mis avisos`, "no hay avisos"). Pero el tab de notificaciones también se llama "Avisos". El mismo término nombra el contenido central y las notificaciones. El usuario que toca "Avisos" esperando publicaciones encuentra notificaciones.

**Qué hacer:**
- Renombrar el tab y el título de pantalla a **"Alertas"** (o "Novedades", elegí uno y sé consistente).
- Regla: un término, un significado. "Aviso" queda reservado exclusivamente para los posts.
- Archivos: `src/components/bottom-tab-bar.tsx` (label) y `src/app/(app)/notifications.tsx` (header). Ojo con A4 abajo, que puede sacar este slot del todo.

## A4. Los tabs sin backend no van en la barra todavía

**Por qué:** "Notificaciones" es una pantalla vacía a propósito (no hay tabla ni push aún). Un tab que lleva a la nada gasta un slot y defrauda al usuario que lo toca.

**Qué hacer — elegí una:**
- **Opción recomendada:** sacar el slot de la barra hasta que la feature exista. Esto además libera espacio y hace más limpia la simetría del centro. Si tomás esta opción, A3 queda en suspenso (no hay tab que renombrar) — pero dejá el rename anotado para cuando la feature vuelva, y asegurate de que "Alertas" sea el nombre desde el día uno.
- **Alternativa:** mantener el tab pero con un indicador claro de estado "pronto" (un punto o una etiqueta discreta), nunca simulando que funciona.

**Coordinación A3 + A4:** decidí primero A4. Si sacás el tab, aplicás el nombre "Alertas" recién cuando la pantalla tenga backend. Si lo dejás, aplicás A3 ahora.

## A5. (Derivado de A2) Sumar "Mis avisos" a la barra

`src/app/(app)/my-posts.tsx` ya existe pero se llega a él indirectamente. Promoverlo a la barra cierra la simetría del botón central y le da al usuario acceso directo a sus propias publicaciones (algo que va a querer hacer seguido: marcar como resuelto, revisar respuestas). Opcional, pero es lo que hace que A2 quede prolijo.

**Barra final sugerida:** Feed · Mis avisos · **[Publicar]** · Alertas/(vacío) · Perfil. Ajustá según lo que decidas en A4.

---

# Sección B — Estado de error del feed

**Archivos:** `src/stores/dogPostsStore.ts`, `src/app/(app)/index.tsx`

**El problema:** `fetchPosts` tiene `try/finally` sin `catch`. Si se cae la red o falla Supabase, el error se traga en silencio, `posts` queda `[]`, y el feed muestra el empty state normal: *"Todavía no hay avisos por acá. Sé el primero en publicarlo."*

Es decir: cuando **falla la conexión**, le decimos al usuario que **no hay perros reportados**. Son cosas opuestas mostradas idénticas. Alguien podría no reportar un perro creyendo que la app anda y está vacía.

**Qué hacer:**
- Agregar un estado `error` al store (además de `isLoading` y `posts`). Capturar el fallo en un `catch` y setearlo.
- En el feed, distinguir **tres** estados, no dos:
  - **Cargando** → skeletons (ya está).
  - **Error** → estado propio: ícono de sin conexión (`cloud-offline-outline`), mensaje honesto ("No pudimos cargar los avisos"), y un botón **"Reintentar"** que vuelve a llamar `reload`.
  - **Vacío real** (cargó bien, no hay datos) → el empty state actual.
- El botón "Reintentar" es clave: sin salida, un error es un callejón sin salida.

**Principio:** cargando ≠ vacío ≠ error. Colapsar los tres en una sola vista es una marca de app amateur. Separarlos, de app en la que se confía.

---

# Sección C — Toggle de filtros ambiguo

**Archivo:** `src/app/(app)/index.tsx`

**El problema:** tocar un chip de filtro que ya está activo lo deselecciona y vuelve a "Todos". Pero ya existe un chip "Todos" explícito. Hay dos formas de hacer lo mismo, y una es invisible (el usuario tiene que descubrir que el chip activo "se apaga").

**Qué hacer:**
- Tocar un chip activo **no hace nada** (se mantiene). Cambiar de filtro es tocar otro chip. Resetear es tocar "Todos".
- Un solo camino por acción. Es el comportamiento de segmented filter que la gente ya conoce.
- Concretamente: sacar el `setFilter(active ? undefined : f.value)` y dejar `setFilter(f.value)`.

---

# Sección D — Fallback para fotos que no cargan

**Archivo:** `src/app/(app)/index.tsx` (y el detalle, `post/[id].tsx`)

**El problema:** en el feed, `<Image source={{ uri: item.photo_urls[0] }} />` asume que la URL existe y carga. Si `photo_urls` viene vacío, o la URL está rota, o la subida falló, queda un hueco. Y la foto es el elemento más importante de la card.

**Qué hacer:**
- Estado de fallback: si no hay URL o la carga falla (`onError` de expo-image), mostrar un placeholder — silueta de perro (`paw` o `image-outline`) centrada sobre `theme.backgroundElement`, no un hueco en blanco.
- Aprovechar el `placeholder` de expo-image para el estado de carga (un blur o color sólido) en vez del salto de vacío-a-imagen.
- Mismo criterio en el detalle.

**Principio:** toda imagen remota puede fallar. Una UI robusta diseña el estado roto, no asume el estado feliz.

---

# Orden de trabajo

1. **Sección A completa, de una** (es un solo componente + el feed). Decidí A4 primero, después el resto.
2. Sección B (error del feed).
3. Secciones C y D (rápidas).

Commitear la Sección A como un bloque, B por separado, C+D juntas.

---

# Criterios de aceptación

- La barra tiene "Publicar" destacado al centro y ningún slot que lleve a una pantalla vacía sin señalizar.
- "Aviso" en la UI se refiere siempre y solo a los posts.
- Cambiar entre Lista y Mapa se hace desde el feed, no desde la barra.
- Cortando la red y abriendo el feed, aparece un estado de error con "Reintentar" — nunca el mensaje de "sé el primero en publicar".
- Ningún chip de filtro se apaga al tocarlo; "Todos" es el único reset.
- Una card con `photo_urls` vacío muestra un placeholder, no un hueco.
