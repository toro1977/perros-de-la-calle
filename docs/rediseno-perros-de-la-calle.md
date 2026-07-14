# Rediseño — Perros de la calle

App Expo / React Native (TypeScript, expo-router, StyleSheet, sin librería de estilos).
Repo: `toro1977/perros-de-la-calle`

---

## Contexto

La app funciona y está bien estructurada: hay tokens de diseño reales (`src/constants/theme.ts`), componentes temáticos (`ThemedText`, `ThemedView`, `Button`, `TextField`) y dark mode. **No hay que reescribir la arquitectura.** El problema es que la ejecución visual se ve genérica y hay incoherencia entre pantallas.

**Regla general: conservar y extender el sistema de tokens, no reemplazarlo.** Nada de agregar librerías de estilos nuevas.

---

## Dirección de diseño

Ancla creativa: **el cartel de "SE BUSCA" pegado en el poste.** Es el artefacto real del problema que la app resuelve.

De ahí salen tres principios:

1. **La foto del perro es la protagonista.** Es lo que hace que alguien reconozca al animal. Grande, siempre.
2. **El estado se lee al instante.** Perdido / Encontrado / Callejero, cada uno con su color, fuerte y sin ambigüedad.
3. **Tipografía con peso y contraste.** Algo tiene que gritar y algo tiene que susurrar.

---

## 1. Paleta — `src/constants/theme.ts`

**Problema:** la paleta actual (crema `#FBFAF7` + terracota `#C6551F`) es el look por defecto más común de UI generada por IA. Se ve visto mil veces.

**Cambio:** paleta papel + tinta, y que **el color del estado sea el acento real** de la app.

```ts
// light
background:        '#FCFCFA'   // papel, casi blanco
backgroundElement: '#F4F3EF'
surface:           '#FFFFFF'   // cards
border:            '#E5E3DD'
text:              '#1A1815'   // tinta, casi negro
textSecondary:     '#78716A'

// acentos = estados
danger:  '#E63912'  // Perdido    (rojo urgente)
success: '#2E9E5B'  // Encontrado (verde)
warning: '#E8920C'  // Callejero  (ámbar)

// + mantener las variantes *Soft para fondos suaves
// + mantener el equivalente en dark mode
```

El acento primario de la app (botones, links) pasa a ser **tinta `#1A1815`**, y el rojo `#E63912` se reserva para acciones urgentes (FAB de publicar, estado perdido). Así el rojo mantiene su carga de urgencia en vez de gastarse en todos lados.

---

## 2. Tipografía — `src/components/themed-text.tsx`

**Problemas:**
- Casi todo vive entre `fontWeight` 500–600 → jerarquía chata, nada resalta.
- Hay `fontSize` hardcodeados que rompen el sistema (ej: el título del feed usa `fontSize: 24` inline cuando el token `title` es 30).

**Cambios:**
- Ampliar el rango de pesos: títulos en `800`, cuerpo en `400–500`, metadata en `500`. Que haya contraste real.
- Agregar un tipo `kicker`: 11px, weight 800, `letterSpacing: 1.5`, uppercase — para las etiquetas chiquitas de contexto.
- Títulos con `letterSpacing` negativo (`-0.5` a `-1`) y `lineHeight` ajustado para que se vean compactos y con carácter.
- **Eliminar todos los `fontSize` inline de las pantallas.** Todo tiene que salir de un token.

---

## 3. Feed — `src/app/(app)/index.tsx`

**Problema:** las cards son tipo "lista de contactos" — thumbnail de 60×60 al costado con texto al lado. La foto del perro, que es lo más importante, está desperdiciada.

**Rediseño de la card:**
- Foto **grande arriba**, de ancho completo, ~190px de alto, `contentFit="cover"`.
- **Badge de estado sobre la foto** (arriba a la izquierda): fondo sólido del color del estado, texto blanco, uppercase, weight 800, con sombra suave. Es el "sello" del cartel.
- **Timestamp sobre la foto** (arriba a la derecha): "hace 2 h", fondo semitransparente oscuro.
- Debajo de la foto: **zona** grande y en negrita, y una línea de metadata secundaria (distancia · raza/color) separada por un punto.
- Card con `borderRadius` grande (~18), fondo `surface`, borde sutil y sombra suave.
- **Separación entre cards: 16px** (hoy es 8px, están apretadas).

**Header:**
- Un `kicker` arriba ("Cerca tuyo · Buenos Aires") y el título "Perros de la calle" grande, apilado en dos líneas, weight ~850.

**Chips de filtro:**
- Radio chico (10), borde 1.5px. El chip activo va en **tinta (`#1A1815`) con texto blanco**, no en terracota.

**FAB "Publicar":**
- Flotante abajo a la derecha, pill, fondo rojo `#E63912`, con sombra marcada. Es la acción principal de la app y tiene que verse.

**Además:** reemplazar el "Cargando..." en texto pelado por **skeletons** con la forma de las cards. Y el estado vacío debería invitar a actuar, no solo informar.

---

## 4. ⚠️ Detalle del post — `src/app/(app)/post/[id].tsx`

**Este es un hueco de producto, no solo de diseño.**

Hoy, si el usuario **no** es el que publicó, no tiene **ninguna acción disponible**. El único botón es "Marcar como resuelto" y solo lo ve el dueño. Osea: alguien reconoce a un perro perdido y **no tiene forma de avisar**. Es la funcionalidad más importante que falta.

**Agregar:**
- Botón primario **"Vi a este perro"** / **"Contactar"**, visible para cualquiera que no sea el autor.
- Definir el canal de contacto (WhatsApp, mensaje interno, o mostrar el contacto del autor) — decisión de producto pendiente.

**Diseño de la pantalla:**
- Foto hero a sangre completa arriba, con gradiente oscuro abajo para que se lea el texto encima.
- Badge de estado grande y sólido.
- Botón de acción **fijo abajo** (sticky), no perdido al final del scroll.

---

## 5. Publicar aviso — `src/app/(app)/new-post.tsx`

**Problema:** los tres tipos (Perdido / Encontrado / Callejero) se seleccionan **todos con el mismo color terracota**. Se pierde la señal visual que sí existe en el feed.

**Cambios:**
- Cada opción usa **su propio color** al seleccionarse: Perdido → rojo, Encontrado → verde, Callejero → ámbar. Coherente con el feed.
- El selector de foto (hoy 180px, gris, discreto) tiene que ser **el protagonista del formulario**: más alto, con borde punteado y un mensaje claro tipo "Sacá o elegí una foto — es lo que más ayuda a encontrarlo".
- Validaciones con mensajes útiles, no genéricos.

---

## 6. Navegación / Layouts — `src/app/(app)/_layout.tsx`

**Problema (probablemente la mayor causa del "se ve horrible"):** el feed tiene `headerShown: false` y un header custom lindo, pero `new-post` y `post/[id]` usan la **barra nativa gris por defecto** con títulos planos. La app salta de estilo entre pantallas: una se ve cuidada y las otras se ven "sin diseñar".

**Cambio:** unificar. Aplicar `headerShown: false` en todas y construir headers custom coherentes (o configurar el header nativo con los tokens: fondo, tipografía, peso y color de la paleta nueva). Lo importante es que **las cuatro pantallas se sientan de la misma app.**

---

## 7. Componentes base

**`Button`** — agregar variante `danger` (fondo `#E63912`) para acciones urgentes. Revisar que los pesos tipográficos salgan del sistema.

**`TextField`** — el borde de foco pasa de terracota a **tinta**. Radio y padding coherentes con las cards nuevas.

**Nuevo: `StatusBadge`** — crear un componente único para el badge de estado, con dos variantes: `solid` (sobre foto) y `soft` (sobre fondo claro). Hoy la lógica de estados está **duplicada en tres archivos** (`index.tsx`, `[id].tsx`, `new-post.tsx`), cada uno con su propio `TYPE_META`. Unificar en un solo lugar.

---

## Orden sugerido de trabajo

1. ✅ Tokens (`theme.ts`) + tipografía (`themed-text.tsx`) — la base, todo lo demás depende de esto.
2. ✅ Componente `StatusBadge` + limpiar los `TYPE_META` duplicados.
3. ✅ Feed (la pantalla que más se ve).
4. ✅ Unificar headers en los layouts.
5. ✅ Detalle del post + **el botón "Vi a este perro"** (la deuda funcional). Canal elegido: WhatsApp. Requirió: campo teléfono obligatorio en el registro, y una migración de Supabase (`get_dog_post` ahora expone `contact_phone` vía `security definer`, ya aplicada al proyecto). Cuentas creadas antes de este cambio no tienen teléfono cargado — no hay pantalla de editar perfil todavía, así que el botón muestra un mensaje en vez de romper.
6. ✅ Publicar aviso.
7. ✅ Skeletons y estados vacíos.
8. ⚠️ Pulido/microinteracciones — parcial. Haptics sí quedó (`Button`/FAB/chips/cards) y el skeleton con pulso animado también. **La animación de spring (`Animated.createAnimatedComponent(Pressable)`) se sacó**: rompía el render del botón en algunos casos (el "Crear cuenta" de registro no aparecía). Si se retoma en el futuro, probar con `react-native-reanimated` (ya instalado) en vez de la API `Animated` clásica de RN. Tab bar custom queda pendiente, no es prioridad.

**Pendiente real:** nada de las secciones 1-8 queda sin tocar. Falta: una pantalla de **editar perfil** (para que cuentas viejas puedan cargar el teléfono), y probar en el dispositivo que el flujo de contacto funcione de punta a punta.

### Agregado post-rediseño (fuera del alcance original del doc)
- Fotos múltiples por aviso (hasta 4), con redimensionado automático antes de subir.
- Autocomplete de razas (portado de doggers, con "Callejero" agregado).
- Selector de ubicación manual en "Publicar aviso" — antes forzaba la ubicación GPS actual; ahora se puede elegir la zona en un mapa (patrón "pin fijo, movés el mapa"), para el caso de publicar un aviso estando lejos de donde se vio al perro.

---

## 8. Pulido / microinteracciones — referencia: jugapp

**Contexto:** comparamos el código de `perros-de-la-calle` contra `jugapp` (app hermana, mismo stack) para entender por qué esta se siente "tosca" al lado de esa.

**Hallazgo clave: no es un problema de tokens.** La paleta y la tipografía de `perros-de-la-calle` ya son más completas que las de jugapp (soft-colors por estado, `Spacing`/`Radius` centralizados, `themed-text.tsx` con `lineHeight` explícito — jugapp ni siquiera tiene un sistema de tipos, usa `fontSize`/`fontWeight` sueltos en cada componente). La diferencia de "pulido" está en la **capa de ejecución e interacción**, donde jugapp invierte y acá no:

1. **Botones sin animación de press.** Jugapp anima con `Animated.spring` (se achica levemente al tocar, `toValue: 0.97`, `bounciness: 6`). Acá `Button` solo cambia opacidad.
2. **Sin haptic feedback.** Jugapp vibra suave en cada tap importante (`expo-haptics`, función centralizada `tapHaptic()`). Acá la librería está instalada pero no se usa en ningún lado.
3. **Sin skeletons de carga.** Jugapp muestra placeholders animados (pulso de opacidad) con la forma real de la card mientras carga. Acá no hay ningún componente `Skeleton` (esto ya estaba anotado como pendiente en la sección 3).
4. **Sin sombras.** Jugapp las usa en solo 3 lugares clave — tab bar, botón FAB central, toast — con `shadowOpacity` muy bajo (0.06–0.25), efecto sutil. Acá no se usa `shadow*`/`elevation` en ningún componente de UI.
5. **Tab bar nativa plana** en vez de una barra custom flotante con el botón principal ("crear"/"publicar") sobresaliendo por encima del resto (`marginTop` negativo), que es lo que hace jugapp.
6. **Chips de filtro menos "vivos".** Jugapp pasa de borde sutil a **color sólido lleno** al activarse (`c.primary` + texto blanco). Confirmar que el rediseño de la sección 3 (feed) ya contempla esto — sí lo contempla, mantenerlo.
7. **Estados vacíos genéricos.** Jugapp usa emoji grande + copy contextual según el filtro activo, en vez de un mensaje plano.
8. **Sin `maxWidth` responsive centrado.** Jugapp limita el ancho de contenido en pantallas grandes (420–560px centrado) para no verse estirado en tablets/web. `perros-de-la-calle` ya tiene `MaxContentWidth = 800` en los tokens — revisar que se esté aplicando en todas las pantallas, no solo en algunas.

**Qué agregar (no reemplaza nada de las secciones 1-7, es una capa adicional):**
- Spring + haptics en `Button` (y en cualquier `Pressable` de acción primaria: FAB, chips, cards del feed).
- Componente `Skeleton` reutilizable + `PostCardSkeleton` con la forma de la card nueva.
- Sombras sutiles solo en elementos flotantes: FAB de publicar, badge de estado sobre foto, header sticky.
- Evaluar más adelante (no es prioridad inmediata): tab bar custom con FAB integrado, si la navegación de la app crece a más de 2-3 secciones.

**Orden sugerido:** esto se hace *después* de los tokens y el feed (secciones 1-4), porque las microinteracciones se aplican sobre componentes que van a cambiar de forma en esas secciones (`Button`, cards). Hacerlo antes sería doble trabajo.

---

## Criterio de aceptación

- No queda **ningún** `fontSize` ni color hardcodeado fuera de los tokens.
- Las 4 pantallas se ven como parte de la misma app (headers coherentes).
- La foto del perro es el elemento más grande en feed y detalle.
- El estado se identifica de un vistazo, sin leer.
- Alguien que no publicó el aviso **puede hacer algo** al ver un perro.
- Dark mode sigue funcionando en todo.
