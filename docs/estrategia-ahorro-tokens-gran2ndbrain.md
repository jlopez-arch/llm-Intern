# Estrategia de ahorro de tokens + fase transitoria GRAN2ndBrain

> Escrito 2026-07-28. Escenario: **inversión mínima, ~2 meses**, aprovechando hardware
> en desuso mientras se arma el "GRAN2ndBrain" — la red de servicios de IA de ASUR
> (LAN oficina + servidores privados en casa vía Tailscale) que apoya toda la operación
> y se conecta a Odoo, SonOFF, Eleitech, consumo eléctrico, cámaras, etc.
> Meta de esta fase: **aprender, documentar y levantar necesidades** corriendo apps
> reales, gastando lo mínimo en tokens de Claude y en hardware.

## 1. Principio: cada tarea al nivel más barato que la resuelva bien

Orden de preferencia, de más barato a más caro:

```
LM Studio local (gratis)  →  Haiku  →  Sonnet  →  Opus
```

La regla no es "usar siempre lo barato", es **no usar Opus para lo que Haiku o el
intern resuelven igual**. Opus se reserva para donde el error cuesta caro.

### Ruteo por tipo de tarea

| Tarea | Dónde | Por qué |
|---|---|---|
| Transformaciones mecánicas, resúmenes, borradores largos, boilerplate, renombrados masivos, extracción de datos de formato fijo | **LM Studio (intern)** | Gratis. Async está bien (~3.4 tok/s). Ver protocolo del intern en `~/.claude/CLAUDE.md`. |
| OCR / lectura de imágenes de cámaras, fotos, PDFs escaneados | **LM Studio (gemma-3-4b / qwen3-vl-4b)** | Ambos son VLM con visión, corren local. |
| Preguntas simples, edición de 1 archivo con spec clara, formateo, clasificación | **Haiku** | Rápido y barato; alcanza de sobra. |
| Trabajo de varios archivos, código con algo de lógica, redacción con juicio | **Sonnet** | Balance costo/capacidad. El caballo de batalla. |
| Bugs con consecuencias, arquitectura, seguridad, decisiones irreversibles, deuda técnica delicada | **Opus** | Solo acá el error justifica el costo. |

**Cómo cambiar de modelo:** lo elige JC con `/model` en Claude Code (o el selector de
la app) — Claude no puede auto-bajarse de tier a mitad de sesión. Recomendación
práctica: **abrí la sesión en el tier que corresponde al trabajo del día.** Sesión de
tareas rutinarias → Haiku/Sonnet. Sesión de diseño/arquitectura → Opus. `/fast` en
Opus da salida más rápida sin bajar de modelo.

### Regla de oro para el intern
Antes de hacer una tarea mecánica directo con Claude, preguntá: *¿esto lo puede hacer
el intern y verificarlo me cuesta <70% de hacerlo yo?* Si sí → al intern. Documentado
en el protocolo del intern y en `MODELS.md`.

## 2. Usar LM Studio al máximo — casos concretos para ASUR

- **Ingesta documental / RAG** (pipeline pgvector ya existente): usar
  `text-embedding-nomic-embed-text-v1.5` del nodo para generar embeddings **gratis**
  en vez de pagar embeddings de API.
- **Resúmenes y primer-borrador** de informes (stock, cartera, mantención): el intern
  arma el borrador, Claude (Sonnet) solo pule. Baja el costo del grueso del texto.
- **Clasificación/triage** de tareas, notas y correos entrantes: gemma-3-4b etiqueta,
  Claude decide solo los ambiguos.
- **OCR de cámaras Eleitech / fotos de bodega**: los modelos VLM del nodo leen imágenes
  sin costo de API de visión.
- **Cron / batch nocturno**: como el nodo es lento pero gratis, las tareas pesadas no
  urgentes se programan de noche (informes, ingestas, resúmenes del día).

## 3. Integrar el nodo con el resto (GRAN2ndBrain)

- **LiteLLM gateway** (ya en la infra, pendiente #465 "intern→LiteLLM"): registrar el
  nodo como provider `openai/…` con `api_base=http://192.168.10.127:1234/v1`. Así un
  solo gateway rutea: tareas baratas → nodo local; caras → Anthropic/Mistral/OpenRouter
  con fallback. **Este es el próximo paso de mayor palanca.**
- **asur-server / ProLiant**: consumen el mismo `base_url` por LAN, o por Tailscale
  `100.79.86.18:1234` si es cross-site (activar subnet routing pendiente).
- **Casa ↔ oficina**: los servidores privados de casa (ProLiant como nodo hogar) se
  suman al tailnet; el GRAN2ndBrain los ve como parte de la misma malla.

## 4. Sugerencias adicionales para esta fase (inversión mínima)

1. **Instrumentar el gasto antes de optimizarlo.** Registrar cuántas tareas van al
   intern vs a cada tier de Claude (el `intern-usage-log.md` ya es la semilla). Sin
   datos no se sabe dónde se va la plata.
2. **Definир un "presupuesto de tier" por proyecto.** Ej.: 2ndBrain rutina → Haiku por
   default; solo escalar a Opus cuando una tarea lo pida explícitamente.
3. **Mover a cron/batch todo lo no interactivo.** El nodo lento es perfecto para trabajo
   nocturno gratis; libera tokens de Claude para lo interactivo del día.
4. **Prompt caching en las apps propias** (2ndBrain ya lo usa): reduce el costo de los
   prompts repetidos de sistema.
5. **No sobreinvertir en el ProDesk.** Es puente hasta el Beelink de 32 GB (~sept-2026).
   Optimización mínima (Q4, threads=4); el salto real de capacidad viene con el Beelink.
6. **Cerrar la brecha de seguridad del nodo** (API sin auth en la LAN) antes de conectarlo
   a más servicios — idealmente vía LiteLLM con key.
7. **Levantar necesidades documentándolas**: cada vez que una app choque con el límite
   del nodo (RAM, velocidad, un modelo que falta), anotarlo como requisito para
   dimensionar el Beelink y el GRAN2ndBrain — no como bloqueo.

## Referencias
- Hardware y modelos del nodo: [`MODELS.md`](../MODELS.md)
- Protocolo del intern: `~/.claude/CLAUDE.md` (sección "Delegar al intern")
- Bridge MCP: [`src/index.ts`](../src/index.ts)
