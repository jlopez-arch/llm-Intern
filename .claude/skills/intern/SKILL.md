---
name: intern
description: Delega trabajo mecánico/masivo y de bajo razonamiento a un modelo LLM local en LM Studio (vía MCP lm-studio), en vez de gastar cuota del modelo grande. Usar cuando el usuario dice "usa el intern"/"el intern", o proactivamente para tareas mecánicas de bajo riesgo (borradores largos, resúmenes, transformaciones repetitivas, boilerplate) antes de hacerlas directo.
---

# Intern (LM Studio local)

Delegar la tarea al modelo local de LM Studio vía el servidor MCP `lm-studio`, en vez
de hacerla directo. LM Studio corre 100% local y no consume cuota del modelo grande
("ilimitado y gratis"), pero rinde peor en razonamiento complejo — este skill existe
para decidir bien CUÁNDO delegar y CON QUÉ modelo, no solo cómo llamar la tool.

**"El intern" no es sinónimo de subagentes** (el tool `Agent`/`Explore`/
`general-purpose`, etc.): esos corren en el modelo grande y consumen su cuota igual
que hacerlo directo. El intern es el MCP `lm-studio` — un modelo distinto, gratis,
local.

## 1. Tools disponibles

Elegí según si la tarea necesita herramientas reales:

- **`lm_studio_generate`** — solo texto/código, POST directo al modelo, **sin
  tools**. Dale todo el contexto necesario en el prompt (datos, texto fuente,
  resultados de tus propias tool calls) — no puede ir a buscar nada él mismo.
- **`lm_studio_agent`** — **con tools MCP reales**. Le pasás `mcp_servers` (nombres
  de `~/.lmstudio/mcp.json`, listalos con `lm_studio_list_mcp_servers` antes) y
  corre un loop de agente real: llama tools, lee resultados, repite hasta terminar
  (tope `max_iterations`, default 8). Usá el mínimo de MCPs necesario — cada uno
  agrega tools al contexto del modelo.
- **`lm_studio_list_models`** — qué modelos hay y cuál está cargado ahora.
- **`lm_studio_list_mcp_servers`** — qué MCPs puede usar `lm_studio_agent`.

## 2. Cuándo delegar

Trabajo mecánico/masivo y de bajo razonamiento: borradores largos, transformaciones
repetitivas, resúmenes, reescritura de texto, boilerplate, investigación acotada con
`lm_studio_agent`.

**No delegar sin más** (evaluar el modelo primero, ver sección 3, antes de descartar):
tareas de razonamiento complejo o alta precisión. Reservar "nunca delegar" para lo
genuinamente de alto impacto — bugs, vulnerabilidades, arquitectura, decisiones con
consecuencia real. Ahí el riesgo es de confiabilidad, no de tiempo, y ningún modelo
local da la garantía que da el modelo grande.

Si el pedido de delegar es ambiguo, priorizar calidad (hacerlo directo) salvo que el
usuario insista.

## 3. Selección de modelo

Ver `MODELS.md` en la raíz de este repo para la tabla completa y evidencia real de
qué modelo sirvió para qué tipo de tarea. Regla general: si el tiempo no apremia,
probar un modelo más capaz antes de asumir que ninguno puede — el cómputo local es
gratis, así que la lentitud extra solo cuesta tiempo.

**Un solo modelo cargado a la vez, siempre elegido a propósito.** `resolveModel()`
prefiere lo que ya esté cargado en memoria; si dejás más de uno cargado de otra
sesión, el bridge puede usar el equivocado sin avisar. Si vas a probar un modelo
puntual, cargalo explícito (parámetro `model`) y descargá los demás.

## 4. Umbral de descarte

Si verificar/corregir el output del intern después cuesta más del 70% de lo que
hubiera costado hacer la tarea directo, descartar el intern para ese tipo de tarea —
después de probar otro modelo (sección 3).

## 5. Registrar el uso (obligatorio)

Apenas el intern termina, puntualo vos mismo (1-10, comparado con haberlo hecho
directo) y agregá una fila a `~/.claude/intern-usage-log.md` (formato en
`templates/intern-usage-log.template.md` de este repo). Es el dato que permite
aprender con el tiempo qué modelo sirve para qué tipo de tarea.
