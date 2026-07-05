@AGENTS.md

# Perros de la calle — Contexto del proyecto

## Qué es
App para reportar y buscar perros perdidos y encontrados. A diferencia de Doggers (marketplace de paseadores), esta app es para el público en general — no solo para usuarios de Doggers. Es un proyecto separado, con su propio repo, backend y roadmap.

## Stack
- Mobile: React Native + TypeScript + Expo (Expo Router, SDK 57)
- Backend: Supabase (Auth + PostgreSQL + PostGIS + Storage) — proyecto propio, separado del de Doggers
- Panel admin / mapas / pagos: sin definir todavía

## Estado actual
Proyecto recién creado (2026-07-05), scaffold inicial de Expo sin features implementadas. Todavía no existe:
- Modelo de negocio / monetización (a definir)
- Modelo de datos (avisos de perdido/encontrado, ubicación, fotos, contacto)
- Proyecto de Supabase (pendiente de crear)

## Reglas de trabajo
- El fundador es QA Lead, no programador. Explicar decisiones cuando sea necesario.
- Trabajar paso a paso. Confirmar antes de avanzar.
- Commits frecuentes con mensajes descriptivos en español.
- Código y comentarios en inglés, comunicación en español.
