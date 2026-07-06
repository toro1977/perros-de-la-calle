Perros de la calle — Discovery del MVP
Versión 0.3 · Discovery cerrado · Listo para modelo de datos y arquitectura




1. VISIÓN Y PROBLEMA


Qué resolvemos
   • Centralizar en un solo lugar geolocalizado los avisos de perros perdidos, encontrados y callejeros necesitados de rescate/adopción.
   • Conectar a quien busca a su perro, a quien encuentra un perro (perdido o de la calle), a refugios/rescatistas y a adoptantes.
   • No depende del marketplace de paseadores de Doggers ni de su base de usuarios — es una app para el público en general.


Insight central
   • Hoy los avisos de perdidos/encontrados y de rescate viven dispersos en grupos de WhatsApp y páginas de Facebook por barrio.
   • No hay un canal centralizado, buscable y geolocalizado — cada grupo es una isla, y la información se pierde o no llega a quien podría ayudar.


Por qué este proyecto, ahora
   • Nace como idea separada del roadmap de Doggers, evaluada y confirmada como producto propio (público distinto, no depende del marketplace de paseadores).
   • En la Provincia de Buenos Aires (GBA y el interior) hay una cantidad importante de perros en situación de calle — no es un problema solo de mascotas perdidas, sino también de rescate y adopción.




2. USUARIOS Y PERSONAS


Persona 1 — Dueño que perdió a su perro
   • Publica un aviso de búsqueda: foto, zona donde se perdió, datos de contacto.
   • Le preocupa que nadie vea el aviso a tiempo, o que se pierda entre otros posteos no relacionados (como pasa hoy en Facebook/WhatsApp).


Persona 2 — Persona que encuentra un perro
   • Encuentra un perro perdido (con dueño) o un perro de la calle (sin dueño aparente).
   • Quiere saber qué hacer: publicar que lo encontró, buscar si alguien lo está buscando, o contactar a un refugio si el perro necesita rescate.


Persona 3 — Refugio / rescatista
   • Gestiona perros de la calle que rescató.
   • Publica esos perros para darlos en adopción.
   • Recibe donaciones a través de la app, previa verificación.


Persona 4 — Adoptante
   • Busca perros disponibles para adoptar entre los publicados por refugios/rescatistas.




3. MERCADO PILOTO
   • Provincia de Buenos Aires completa: Gran Buenos Aires (zona norte, sur, este y oeste) + interior de la provincia.
   • Se eligió no acotar a una sola zona de GBA porque el interior de la provincia tiene un volumen importante de perros en situación de calle.




4. MODELO DE NEGOCIO
   • Donaciones a refugios/rescatistas dados de alta y verificados en la app, procesadas vía MercadoPago.
   • La app retiene una comisión del 5% sobre cada donación (cubre el costo de procesamiento de MercadoPago sin generar fricción con donantes/refugios); el resto se liquida al refugio.
   • Alianzas con veterinarias y refugios (posible convenio, visibilidad, u otro beneficio a definir).
   • No se cobra a dueños ni a quienes encuentran perros — publicar y buscar avisos es gratis.
   • Pendiente definir: mecánica exacta de liquidación al refugio (¿diaria, semanal? — ver el precedente de Doggers, que liquida manual en v1 por ADR-009).




5. DECISIONES CLAVE TOMADAS


Verificación de refugios/rescatistas
   • Revisión manual, mismo patrón que la verificación de paseadores en Doggers.
   • El refugio se registra y sube datos de respaldo (CUIT/personería si tiene, fotos, redes sociales); el founder/equipo aprueba antes de habilitarlo para publicar en adopción o recibir donaciones.
   • Sin SLA de revisión definido por ahora — se revisa a medida que entran solicitudes.


Moderación de avisos (perdido/encontrado/callejero)
   • Publicación inmediata, sin cola de revisión previa — la urgencia de un perro recién perdido no admite demoras.
   • Reporte comunitario: los usuarios pueden marcar un aviso como falso/duplicado; se revisa después de publicado.


Donaciones
   • Procesadas en la app vía MercadoPago.
   • La plataforma retiene el 5% de comisión; el resto se liquida al refugio verificado.


Matching entre avisos de "perdido" y "encontrado"
   • Híbrido: el sistema sugiere posibles matches automáticamente por cercanía geográfica y notifica por push a ambas partes.
   • Radio de búsqueda ajustable por el usuario (no fijo del sistema) — similar a un slider de distancia estilo apps de citas.
   • Sin límite de fecha: cualquier aviso activo se considera para las sugerencias, sin importar cuánto tiempo pasó.
   • El contacto y la confirmación final del match son manuales entre las partes (no hay resolución automática "dura").




6. ALCANCE DEL MVP

   Incluido en v1:
   • Publicar y buscar avisos de perdido/encontrado (foto, ubicación, contacto).
   • Publicar perros callejeros rescatados en adopción (refugios/rescatistas verificados).
   • Donaciones a refugios vía MercadoPago, con 5% de comisión de plataforma.
   • Sugerencias automáticas de match perdido↔encontrado con radio ajustable por el usuario, sin límite de fecha, + confirmación manual.
   • Cola de verificación manual de refugios (equivalente a la de paseadores en Doggers), sin SLA fijo en v1.
   • Reporte comunitario de avisos falsos/duplicados.


   Pendiente de definir (no bloquea el arranque del desarrollo, se resuelve en la etapa de arquitectura/construcción):
   • Mecánica exacta de liquidación de donaciones al refugio (diaria, semanal, manual como Doggers).




7. PRÓXIMOS PASOS
   • Definir modelo de datos (entidades: avisos, refugios, donaciones, usuarios, reportes).
   • Arrancar arquitectura técnica (equivalente a arquitectura-v0.1.md de Doggers) y roadmap de épicas.
