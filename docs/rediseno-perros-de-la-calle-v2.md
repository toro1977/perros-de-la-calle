# Rediseño v2 — Correcciones y buenas prácticas

App Expo / React Native (TypeScript, expo-router, StyleSheet).
Continuación de `docs/rediseno-perros-de-la-calle.md`, que ya está aplicado.

**Contexto:** el rediseño visual salió bien. La paleta papel+tinta, el `StatusBadge`, los headers unificados, los skeletons del feed y el flujo de contacto ya están en su lugar. Este documento corrige lo que quedó pendiente y lo que apareció recién al ver la app corriendo en un dispositivo real.

**Reglas que se mantienen:** no agregar librerías de estilos. Todo color, tamaño y espaciado sale de los tokens en `src/constants/theme.ts`. Si algo no tiene token, se crea el token — no se hardcodea.

---

# P0 — Bugs que rompen funcionalidad

## 1. El link de WhatsApp está roto

**Archivos:** `src/app/(app)/post/[id].tsx`, `src/app/(auth)/register.tsx`, `src/stores/authStore.ts`

**El problema:** `buildWhatsAppUrl()` hace `phone.replace(/\D/g, '')` y arma `https://wa.me/{digits}`. Pero en el registro el teléfono solo se valida como "no vacío". Un usuario argentino escribe lo natural — `11 2345-6789` — y eso se convierte en `1123456789`. La API de `wa.me` **exige formato internacional E.164 sin símbolos**, así que WhatsApp lee ese `1` inicial como código de país de Estados Unidos. El link falla o abre un chat con un número inexistente.

Esto rompe silenciosamente la funcionalidad más importante de la app: el botón "Vi a este perro".

**Qué hacer:**

- Guardar el teléfono siempre en **formato E.164** (`+5491123456789`). Es el estándar de la industria para almacenar teléfonos y lo que esperan WhatsApp, Twilio y cualquier proveedor de SMS.
- En `register.tsx`, mostrar el prefijo `+54 9` fijo y visible en el campo, para que el usuario entienda que escribe solo el resto.
- Normalizar antes de guardar, contemplando los errores típicos de Argentina:
  - Quitar el `15` de los celulares (`11 15 2345 6789` → `+54 9 11 2345 6789`).
  - Quitar el `0` inicial del código de área (`0221` → `221`).
  - Agregar el `9` de celular si falta.
- Validar el largo resultante y **rechazar el registro** si no es un número válido, con un mensaje claro. Mejor frenar al usuario en el registro que descubrir el problema cuando alguien encontró su perro y no lo puede contactar.
- Crear un helper `src/utils/phone.ts` con `normalizeArPhone()` y su test.

**Verificación:** con un teléfono guardado, tocar "Vi a este perro" tiene que abrir WhatsApp con el chat correcto y el mensaje precargado.

## 2. Migración de teléfonos ya guardados

Si ya hay usuarios registrados con teléfonos en formato libre, hay que normalizarlos. Una migración de Supabase que aplique la misma lógica sobre `public.users.phone`, y que marque como `null` los que no se puedan normalizar con confianza (mejor un `null` explícito que un número que abre el chat equivocado).

---

# P1 — Problemas visibles en pantalla

## 3. La zona domina la card sin aportar nada

**Archivo:** `src/app/(app)/index.tsx`

**El problema:** el geocoding devuelve `"Esteban Echeverría, Provincia de Buenos Aires"`. Ese texto ocupa **dos líneas en negrita** y es el elemento de mayor peso visual de cada tarjeta. Pero es **idéntico en todas las cards**. El texto más prominente del feed no aporta información diferencial: es ruido con jerarquía de titular.

**Principio:** en una lista, el elemento con más peso tipográfico tiene que ser el que **distingue** un ítem de otro. Si todos dicen lo mismo, no merece ese peso.

**Qué hacer:**

- Recortar la zona a **la parte más específica** del geocoding (barrio o localidad), descartando provincia y país. En `src/services/location.ts`, quedarse con el componente más granular disponible.
- Forzar `numberOfLines={1}` en el título de la card. Una card no puede crecer de alto por un texto largo.
- Si la app crece a varias provincias, la provincia puede ir en la metadata secundaria (chica, gris), nunca en el titular.

## 4. "a 0 km" se ve roto

**Archivo:** `src/app/(app)/index.tsx` (y donde se formatee la distancia)

Nadie escribe "a 0 km". Es un valor sin redondear que parece un bug (y de hecho lo parece).

**Qué hacer:** crear `formatDistance()` en `src/utils/` con estas reglas:
- `< 100 m` → "acá nomás"
- `< 1 km` → "a 350 m"
- `1–10 km` → "a 2,4 km" (un decimal, **coma** decimal, que es lo correcto en castellano)
- `> 10 km` → "a 12 km" (sin decimales)

Si no hay ubicación disponible, **omitir la distancia** en vez de mostrar un placeholder.

## 5. Los chips de filtro se truncan

**Archivo:** `src/app/(app)/index.tsx`

**El problema:** en un iPhone real se lee **"Encontr..."**. Los cuatro chips tienen `flex: 1`, que los fuerza a un ancho igual sin importar el largo del texto.

**Qué hacer:**
- Sacar el `flex: 1`.
- Poner los chips en un `ScrollView` horizontal con `showsHorizontalScrollIndicator={false}`, que cada uno tome su ancho natural según el contenido.
- Es el patrón estándar de filtros en móvil (lo usan Airbnb, Instagram, Mercado Libre) y escala solo si mañana agregás un filtro más.
- **No** achicar los textos a "Encontr." — abreviar es tapar el síntoma. El layout tiene que adaptarse al contenido, no al revés.

## 6. El FAB tapa la última tarjeta

**Archivo:** `src/app/(app)/index.tsx`

`listContent` tiene `paddingBottom: Spacing.six` (64px), pero el FAB mide ~56px de alto y está a 24px del borde: ocupa unos **80px**. La última card queda pisada.

**Qué hacer:** subir el `paddingBottom` a ~100px. Regla general: el padding inferior de una lista tiene que ser mayor que la altura del elemento flotante más su separación del borde.

**Además:** el FAB está en `right: Spacing.two` (8px) mientras que todo el contenido usa `paddingHorizontal: Spacing.three` (16px). Alinearlo a 16px para que respete la grilla.

## 7. El botón "Publicar" queda cortado

**Archivo:** `src/app/(app)/new-post.tsx`

En la captura, "Publicar" aparece cortado al final del scroll.

**Qué hacer:** hacerlo **sticky abajo**, igual que ya está resuelto en `post/[id].tsx`. La acción principal de un formulario no debería requerir scroll para encontrarse. Fondo `surface`, borde superior sutil, y respetar el safe area inferior.

## 8. El selector de tipo salta al seleccionarse

**Archivo:** `src/app/(app)/new-post.tsx`

La opción seleccionada queda **más alta** que las otras dos, porque el borde pasa de `1px` a `2px` y empuja el layout.

**Qué hacer:** `borderWidth: 2` fijo en las tres opciones desde el arranque, y cambiar solo el **color** del borde (`transparent` o el color del borde neutro cuando no está seleccionada). Nunca cambiar el grosor del borde en un estado de selección.

**Principio general:** un cambio de estado no debe alterar las dimensiones del layout. Es una fuente clásica de saltos visuales.

## 9. "Callejero" es raza y estado al mismo tiempo

**Archivos:** `src/constants/dog-breeds.ts`, `src/app/(app)/new-post.tsx`

**El problema:** una card muestra badge verde **ENCONTRADO** y debajo, como raza, **"Callejero"**. Pero "Callejero" es también uno de los tres estados de la app. El mismo término significa dos cosas distintas en la misma pantalla.

**Qué hacer:**
- Sacar "Callejero" de la lista de razas y del placeholder del campo. "Mestizo" significa lo mismo sin pisar el vocabulario de estados.
- Regla de producto: **cada palabra tiene un solo significado en la interfaz.** Si un término ya nombra un estado, no puede nombrar también un atributo.

---

# P2 — Coherencia y calidad

## 10. La fecha se muestra cruda

**Archivo:** `src/app/(app)/post/[id].tsx`

`{post.event_date}` renderiza el ISO tal cual: `2026-07-13`. Formatearlo en castellano ("13 de julio de 2026") o como tiempo relativo, reutilizando `formatRelativeTime`.

**Nunca** mostrar un valor de base de datos sin formatear.

## 11. El detalle todavía dice "Cargando..."

**Archivo:** `src/app/(app)/post/[id].tsx`

El feed tiene skeletons, el detalle tiene texto pelado. Es inconsistente justo en la pantalla más importante.

Agregar un skeleton con la forma real de la pantalla (bloque de foto + líneas de texto), reusando `src/components/skeleton.tsx`.

**Principio:** los skeletons ganan a los spinners porque comunican la *estructura* de lo que viene, no solo que "algo está pasando".

## 12. Cerrar sesión es peligroso

**Archivo:** `src/app/(app)/index.tsx`

Cerrar sesión es un ícono suelto en el header, **visualmente idéntico** al toggle de mapa, y ejecuta con un solo toque sin confirmación. Un toque mal dado y el usuario se desloguea.

**Qué hacer:** pedir confirmación con un `Alert` antes de cerrar sesión. Idealmente, moverlo fuera del header principal (a un menú o una pantalla de perfil).

**Principio:** las acciones destructivas nunca comparten peso visual con las acciones de navegación, y nunca se ejecutan con un solo toque sin confirmar.

## 13. Accesibilidad

**Archivos:** todos los botones de solo ícono.

- Agregar `accessibilityLabel` y `accessibilityRole="button"` a los botones de mapa, cerrar sesión y volver. Sin esto, un lector de pantalla los anuncia como "botón" a secas.
- Verificar que todos los targets táctiles lleguen a **44×44pt** (mínimo de las Human Interface Guidelines de Apple). Los `iconButton` de 40×40 se quedan cortos: usar `hitSlop` (ya está en algunos) o subirlos a 44.
- Revisar el contraste del `textSecondary` (`#78716A` sobre `#FCFCFA`) contra el mínimo **4.5:1** de WCAG AA para texto normal.

## 14. Temperatura de color inconsistente entre temas

**Archivo:** `src/constants/theme.ts`

El tema claro es neutro y ligeramente frío (`#FCFCFA`, `#78716A`), pero el oscuro es **marrón cálido** (`#171310`, `#211C16`). Se sienten dos apps distintas.

Elegir una temperatura y sostenerla en ambos temas. Si la identidad es "papel y tinta", el oscuro debería ser un gris carbón neutro, no un marrón.

## 15. Peso hardcodeado que sobrevivió

**Archivo:** `src/app/(app)/index.tsx`

`cardZone: { fontWeight: '700' }` es un override inline. Existe `smallBold` pero falta el equivalente para el tamaño `default`.

Crear el tipo `defaultBold` en `themed-text.tsx` y usarlo. **Ningún peso ni tamaño tipográfico debe vivir fuera de `themed-text.tsx`.**

---

# Orden de trabajo sugerido

1. **P0 completo** (teléfono + migración). Es lo único que está roto de verdad.
2. **P1** en orden: zona, distancia, chips, FAB, botón publicar, selector de tipo, "Callejero".
3. **P2** al final.

Ir commiteando por bloque, no todo junto.

---

# Criterio de aceptación

- El botón "Vi a este perro" abre WhatsApp con el chat correcto, probado con un número real en formato local.
- Ninguna card crece de alto por textos largos; el título es siempre una línea.
- No aparece ningún texto truncado con "..." en un iPhone SE (la pantalla más angosta en uso).
- Ningún elemento flotante tapa contenido.
- Ningún cambio de estado altera las dimensiones del layout.
- No queda ningún valor de base de datos sin formatear en la UI.
- No queda ningún `fontSize`, `fontWeight` o color hardcodeado fuera de los tokens.
- Todos los botones de ícono tienen `accessibilityLabel`.
