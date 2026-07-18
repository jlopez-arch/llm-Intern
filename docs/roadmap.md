# Roadmap: concurrencia multi-sesión

**Estado: sin implementar — spec de diseño.** Detectado 2026-07-17: LM Studio estaba
apagado en medio de una tarea de alta precisión (output para producción de un
cliente) → se aplicó el fallback correcto del protocolo (hacerlo directo, no forzar
el intern). Pero el caso más común de fricción no es "LM Studio apagado", es
**varias sesiones de Claude Code/Codex abiertas a la vez, todas con el intern
registrado**, pisándose entre sí.

## El problema

Cada sesión que registra el MCP `lm-studio` (`claude mcp add` / `[mcp_servers.lm-studio]`
en Codex) lanza su **propio proceso** `node dist/index.js`. Esos procesos no
comparten memoria ni estado entre sí — lo único que comparten es el server HTTP de
LM Studio (`localhost:1234`) y el modelo(s) que tenga cargado en RAM.

Dos síntomas de esto, ya vistos:

1. **Contención de modelo:** `resolveModel()` (`src/index.ts`) usa "lo que ya esté
   cargado" cuando no le pasan `model` explícito. Si la sesión A dejó cargado
   `qwen3.6-35b-a3b` y la sesión B pide una tarea de código pasando `model:
   "qwen3-coder-30b"` explícito, hoy el bridge dispara el swap sin chequear si A
   está en medio de algo — ya causó un caso registrado en el log de uso (edición
   TSX que se colgó, parcialmente por esto).
2. **Sin control de concurrencia:** si N sesiones llaman `lm_studio_generate` /
   `lm_studio_agent` casi al mismo tiempo, no hay ningún límite ni cola en el
   bridge — cada proceso dispara su POST a LM Studio apenas se lo piden. No está
   verificado qué hace LM Studio bajo esa carga (¿encola?, ¿degrada?, ¿tira error?)
   — pendiente de probar antes de diseñar la solución final.

## Qué se pide

1. **Cap de concurrencia (~4 simultáneas):** si hay más de una sesión activa, que el
   sistema soporte hasta ~4 llamadas concurrentes al intern sin pisarse — vía cola o
   límite, no dejando que cada sesión dispare sin coordinación.
2. **Reuso de modelo entre sesiones:** antes de forzar un swap, evaluar la
   factibilidad de usar el modelo que ya está cargado (aunque no sea el pedido
   explícito) para el job actual, en vez de desalojarlo — sobre todo si eso puede
   estar rompiendo el trabajo de otra sesión.

## Por qué no es trivial

Los procesos del bridge no comparten memoria — un `Map` o semáforo en memoria
(`src/index.ts`) solo protegería llamadas *dentro del mismo proceso*, es decir,
dentro de una sola sesión. Para coordinar entre sesiones distintas hace falta un
mecanismo fuera del proceso. Opciones a evaluar (ninguna implementada todavía):

- **Lock/semáforo por archivo** en `~/.lmstudio/` (ej. `~/.lmstudio/.bridge-lock`) —
  cada proceso del bridge lee/escribe ahí para coordinarse. Simple, pero hay que
  manejar bien locks huérfanos (proceso que muere sin liberar).
- **Servicio de coordinación separado** (un proceso único, tipo daemon, que todos
  los bridges consultan) — más robusto, más complejo de instalar/mantener.
- **Delegar la cola a LM Studio mismo**, si expone algún límite de concurrencia
  configurable server-side — más simple si existe, pero no confirmado (ver
  "Pendiente de verificar" abajo).

Para el reuso de modelo, hace falta además una noción de "¿alcanza el modelo que ya
está cargado para este tipo de tarea?" — no binaria "es el mismo o no". Un punto de
partida razonable: usar las categorías de [`MODELS.md`](../MODELS.md) (mecánico
simple / código / complejidad moderada) como niveles, y solo forzar swap si el
modelo cargado es de un nivel *inferior* al que la tarea necesita, no cualquier vez
que no coincida exacto con el `model` pedido.

## Prior art

La integración con OpenClaw (ver [`docs/openclaw-setup.md`](openclaw-setup.md)) tiene
un problema hermano: ahí un "guard" verifica que el modelo correcto esté cargado
antes de correr una tarea de agente, chequea contexto/paralelismo, y evita cambiar de
modelo con una tarea activa salvo que se fuerce explícitamente. No está portado a
este bridge todavía, pero es la referencia más cercana a "reuso de modelo con
chequeo de factibilidad" que ya funciona en la práctica — vale la pena mirarlo antes
de diseñar desde cero.

## Pendiente de verificar antes de implementar

- Comportamiento real de LM Studio con requests concurrentes contra el mismo modelo
  cargado (¿serializa?, ¿corre en paralelo de verdad?, ¿hay algún límite/config
  expuesto en la app o en `/api/v0/models`?).
- Si LM Studio soporta más de un modelo cargado en simultáneo de forma estable bajo
  carga (ya se vio que sí carga 2 a la vez en uso normal, no probado bajo llamadas
  concurrentes de varias sesiones).
- Costo/latencia real de un lock por archivo vs. dejarlo sin coordinar y medir si el
  problema en la práctica es tan frecuente como para justificar la complejidad.

## No-objetivo

Esto no reemplaza la regla operativa actual ("un solo modelo cargado a la vez,
siempre elegido a propósito" — ver [`MODELS.md`](../MODELS.md)) para uso de una sola
sesión. Es específicamente para el caso de varias sesiones concurrentes.
