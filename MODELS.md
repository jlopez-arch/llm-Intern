# Modelos recomendados

Guía de arranque para elegir modelo local según el tipo de tarea. Llevá tu propio
registro de resultados con [`templates/intern-usage-log.template.md`](templates/intern-usage-log.template.md)
— los modelos y el hardware cambian, así que esta tabla es un punto de partida, no
una verdad fija.

## Setup probado (referencia)

MacBook Apple Silicon, LM Studio con runtime MLX. Todos los modelos de abajo están
descargados como cuantización 4-bit/5-bit MLX salvo que se indique lo contrario.

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
