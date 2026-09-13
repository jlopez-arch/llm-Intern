# Modelos recomendados

Guía de arranque para elegir modelo local según el tipo de tarea. Llevá tu propio
registro de resultados con [`templates/intern-usage-log.template.md`](templates/intern-usage-log.template.md)
— los modelos y el hardware cambian, así que esta tabla es un punto de partida, no
una verdad fija.

## Nodo ASUR en producción (2026-07 → hardware real)

**El intern corre en el HP ProDesk 600 G1 SFF ("Info_Asur")**, no en una laptop ni
en un Mac. Este es el hardware real que sirve hoy:

- **CPU:** Intel i5-4590 (Haswell, 4C/4T) — tiene **AVX2 + AES-NI** (los servidores
  viejos de 2009 y el ProLiant X3430 NO los tienen; por eso la inferencia vive acá).
- **RAM:** 14 GB DDR3 corriendo a **1333 MHz** (mezcla de módulos 1600 + 2 ECC
  agregados → el mix fuerza el downclock). **Este es el cuello de botella real.**
- **SO:** Windows 10 Pro. Sin GPU dedicada → runtime **CPU `llama.cpp-win-x86_64-avx2`**
  (Vulkan crashea con la Intel HD integrada).
- **Red:** LAN `192.168.10.127:1234` / Tailscale `100.79.86.18:1234`. API
  OpenAI-compatible expuesta a toda la LAN (sin auth — ver nota de seguridad abajo).

**Velocidad medida (2026-07-28, gemma-3-4b, en caliente):** ~**3.4 tok/s** en estado
estable; cold-load del modelo ~40 s. Lento → **solo tareas asíncronas/batch**, nunca
interactivo urgente. Para subir tok/s: bajar cuantización a **Q4_K_M**, homogeneizar
RAM a 1600 MHz, y fijar **threads = 4** en LM Studio.

**Modelos que tiene descargados este nodo** (≠ la tabla MacBook de abajo, que es
referencia aspiracional — este equipo NO corre los 27B/30B+):

| Modelo | Tipo | Uso en el nodo ASUR |
|---|---|---|
| `google/gemma-3-4b` | Dense 4B, **VLM (visión)** | **Default.** Mecánica general + tareas con imágenes (OCR de fotos, cámaras Eleitech, etc.) |
| `google/gemma-3-1b` | Dense 1B | Transformaciones triviales ultra-rápidas, sin contenido factual |
| `qwen/qwen3-4b-thinking-2507` | Dense 4B razonador | Tareas con algo más de juicio, si el tiempo no apremia |
| `microsoft/phi-4-mini-reasoning` | Mini razonador | Alternativa de razonamiento acotado |
| `qwen/qwen3-vl-4b` | 4B VLM | Segunda opción de visión |
| `liquid/lfm2-1.2b` | Dense 1.2B | ❌ Alucina con contenido factual — solo texto mecánico puro |
| `text-embedding-nomic-embed-text-v1.5` | Embeddings | RAG / ingesta documental (no es modelo de chat) |

> ⚠️ **Seguridad:** LM Studio escucha en `0.0.0.0:1234` **sin autenticación**.
> Cualquiera en la LAN `192.168.10.0/24` puede consumir la API directo. Por Tailscale
> está protegido por ACL del tailnet; por LAN no. **Mitigación aplicada 2026-07-28**:
> el nodo está registrado en el gateway LiteLLM (`asur-serer`) con auth por
> `LITELLM_MASTER_KEY` — ver sección siguiente. El puerto 1234 directo sigue abierto
> sin auth (no se tocó el firewall del ProDesk); cerrarlo del todo requeriría acceso
> remoto a ese Windows, pendiente.

## Bridge con dos modos: directo a LM Studio, o vía gateway LiteLLM (2026-07-28)

El bridge (`src/index.ts`) soporta ahora un **`LM_STUDIO_API_KEY` opcional**: si está
seteado, se manda como `Authorization: Bearer` en cada llamada. Esto permite apuntar
`LM_STUDIO_BASE_URL` a un gateway OpenAI-compatible con auth (LiteLLM) en vez de
pegarle directo al puerto 1234 del ProDesk.

**Detalle técnico clave**: `lm_studio_list_models`/`resolveModel()` normalmente usan
`/api/v0/models`, una **API nativa de LM Studio** (da `state: loaded/not-loaded`) que
NO es parte del estándar OpenAI — un gateway como LiteLLM no la expone. El bridge
ahora hace **fallback automático** a `/v1/models` (estándar, sí soportado por
LiteLLM) cuando la nativa falla. Se pierde la detección de "modelo ya cargado en
memoria", pero todo lo demás (validación de `model` explícito, JIT-load, generación,
tool-calling) sigue funcionando igual.

**LiteLLM en `asur-serer` tiene los 7 modelos del ProDesk registrados con
`model_name` = ID nativo exacto de LM Studio** (`google/gemma-3-4b`,
`google/gemma-3-1b`, `qwen/qwen3-4b-thinking-2507`, `microsoft/phi-4-mini-reasoning`,
`qwen/qwen3-vl-4b`, `liquid/lfm2-1.2b`, `text-embedding-nomic-embed-text-v1.5`) — a
propósito, sin alias tipo `local-intern`, para que el mismo string de `model`
funcione yendo directo al ProDesk o vía gateway, sin mapeo. Cada uno tiene fallback a
`fb-mistral-small`/`fb-or-gemma` si el ProDesk está caído. Config real:
`/home/asur/litellm/config.yaml` en `asur-serer` (backups `.bak-20260728*`).

**Modo actual del bridge de esta laptop**: vía gateway
(`LM_STUDIO_BASE_URL=http://100.64.52.21:4000/v1` + `LM_STUDIO_API_KEY`), verificado
end-to-end con `smoke-test.mjs` (auth OK, fallback de listado OK, generación OK).
Ventaja: auditable/con auth, y si el ProDesk se cae hay fallback automático a
Mistral en vez de fallar. Cambio de código sin commitear en el repo local — pendiente
si se quiere pushear al fork.

> 🔜 **Transitorio:** este nodo es el arranque de inversión mínima hasta el **Beelink
> EQR5** (Ryzen 7 5825U, 32 GB DDR4, AVX2, ~sept-2026), que será el nodo de inferencia
> principal. No sobreinvertir en optimizar el ProDesk.

---

## Setup probado (referencia — MacBook, NO es el hardware ASUR)

MacBook Apple Silicon, LM Studio con runtime MLX. Todos los modelos de abajo están
descargados como cuantización 4-bit/5-bit MLX salvo que se indique lo contrario.
Esta tabla es **aspiracional/de referencia**: el nodo ASUR real (arriba) solo corre
los modelos ≤4B por RAM. Sirve como norte para cuando llegue el Beelink de 32 GB.

## Tabla de selección por tipo de tarea

| Tipo de tarea | Modelo | Por qué |
|---|---|---|
| Mecánica/un paso (CSV, renombrados, resúmenes, borradores) | `qwen3.6-35b-a3b` (default) | MoE rápido (~80 tok/s), alcanza para esto — no hace falta más |
| Código mecánico (patrones repetitivos, renombrados masivos, **archivos nuevos aislados con spec exacta**) | `qwen3-coder-30b` (pasar `model` explícito) | Especializado en código aunque sea de generación más vieja — un modelo especializado puede superar a uno general más nuevo en tareas de sintaxis/estructura |
| Complejidad moderada, tiempo no urgente (exploración con juicio real, edición multi-archivo no trivial) | `qwen3.6-27b` (dense) o `gemma-4-31b` (pasar `model` explícito) | Más inteligencia por token que el MoE rápido, a costa de velocidad — el cómputo local es gratis, así que la lentitud extra solo cuesta tiempo |
| Alta precisión/impacto real (bugs, vulnerabilidades, arquitectura, lógica con consecuencias reales) | Ninguno — hacerlo con el modelo "grande" (Claude/GPT) directo | El riesgo es de confiabilidad, no de tiempo; ningún modelo local da garantía suficiente todavía |

**Regla general:** si el tiempo no apremia, probá un modelo más capaz antes de asumir
que ninguno puede cruzar una tarea — vale la pena, porque solo cuesta tiempo, no
dinero (a diferencia del modelo grande que sí cobra por token).

**Regla operativa: un solo modelo cargado a la vez, siempre elegido a propósito.**
`resolveModel()` usa lo que ya esté cargado en memoria antes que el default fijo —
si dejás dos modelos cargados de sesiones distintas, el bridge puede terminar usando
el equivocado sin avisar. Si vas a probar un modelo puntual, cargalo explícito (o
pasalo por el parámetro `model`) y descargá los demás.

## Modelos probados

Todos estos pasaron por este setup en algún momento (no solo los recomendados de
arriba). Verificación empírica, no benchmarks de papers:

| Modelo | Tamaño/tipo | Veredicto |
|---|---|---|
| `qwen/qwen3.6-35b-a3b` | MoE ~35B (A3B activos) | ✅ Recomendado — default, rápido, alcanza para la mayoría de la delegación mecánica |
| `qwen/qwen3-coder-30b` | MoE 30B, code-tuned | ✅ Recomendado para código — pero **solo tareas acotadas** (archivo nuevo con spec clara). En edición multi-archivo grande se puede colgar sin converger. |
| `qwen/qwen3.6-27b` | Dense 27B | ✅ Recomendado para complejidad moderada — más lento que el MoE, más consistente en tareas que requieren más juicio |
| `qwen/qwen3-4b-2507` | Dense 4B | ⚠️ Usable para tareas triviales/hardware limitado — no esperar más que eso |
| `gemma-4-31b-it-mlx` / `gemma-4-31b-it-uncensored-mlx` | Dense 31B | ✅ Alternativa válida a `qwen3.6-27b` para complejidad moderada |
| `google/gemma-4-26b-a4b-qat` | MoE 26B (A4B activos), razonador | ⚠️ Con `max_tokens` chico puede devolver `content` vacío — gasta el presupuesto en `reasoning_content` antes de llegar a la respuesta. Subir `max_tokens` o desactivar el thinking (ver abajo). |
| `google/gemma-4-e2b` / `google/gemma-4-e4b` | Dense chico | ⚠️ Probados livianamente, sin veredicto firme — candidatos para tareas triviales |
| `liquid/lfm2.5-1.2b` | Dense 1.2B | ❌ Muy rápido pero alucina en preguntas que requieren conocimiento real (probado: inventó una definición incorrecta de "servidor MCP"). Solo para transformaciones de texto puramente mecánicas, sin contenido factual. |
| `text-embedding-nomic-embed-text-v1.5` | Embeddings | No aplica a `lm_studio_generate`/`lm_studio_agent` (no es un modelo de chat) |

## Cómo descargar estos modelos

Desde la app de LM Studio → pestaña Discover/buscar, o por CLI (`lms get`, si tenés
el LM Studio CLI instalado):

```bash
lms get qwen/qwen3.6-35b-a3b        # default — MoE rápido, alcanza para la mayoría
lms get qwen/qwen3-coder-30b        # código mecánico / archivos nuevos aislados
lms get qwen/qwen3.6-27b            # dense, más lento, más "inteligente por token"
lms get qwen/qwen3-4b-2507          # chico y rápido, para tareas triviales o hardware limitado
```

Elegí la cuantización según tu RAM disponible (4-bit para equipos con menos memoria
unificada, 8-bit/full si te sobra). En Apple Silicon, preferí siempre la variante MLX
sobre GGUF — corre notablemente más rápido en ese hardware.

## Desactivar el "thinking" (recomendado)

Los modelos Qwen3 razonan por defecto antes de responder, lo cual es lento y no
aporta nada para tareas mecánicas. LM Studio **ignora los flags de la API** para esto
(`enable_thinking`, `chat_template_kwargs` — limitación conocida de LM Studio, no de
este bridge). La única forma confiable es editar el Prompt Template del modelo en la
app — ver [`docs/lm-studio-setup.md`](docs/lm-studio-setup.md#desactivar-el-thinking).
