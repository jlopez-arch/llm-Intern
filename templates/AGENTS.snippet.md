<!--
  Pegá esto en tu ~/.codex/AGENTS.md (reglas globales de Codex, se cargan en toda
  sesión). Reemplazá <TU_NOMBRE> y <RUTA_DEL_REPO> por tus valores reales.
  Ver docs/codex-setup.md para el resto de la instalación.
-->

## Delegar al "intern" (LM Studio local) — protocolo completo

Cuando <TU_NOMBRE> diga "usa el intern" (o "el intern"), invocás **todo este
protocolo entero**, no solo "mandale un prompt" — delegar la tarea al modelo local
de LM Studio vía el servidor MCP `lm-studio`, no hacerla directo con este modelo.

**Por qué:** LM Studio corre local y no consume cuota del proveedor ("ilimitado y
gratis"), pero el modelo local rinde peor en razonamiento complejo.

**1. Tools disponibles** (bridge `mcp-lm-studio`, en `<RUTA_DEL_REPO>`) — elegí
según la tarea:
- `lm_studio_generate` — solo texto/código, POST directo a `/v1/chat/completions`,
  **sin tools**. Dale todo el contexto necesario directo en el prompt (datos, texto
  fuente, resultados de tus propias tool calls) — no puede ir a buscarlo él mismo.
- `lm_studio_agent` — **sí tiene tools MCP reales**. Le pasás `mcp_servers` (nombres
  de `~/.lmstudio/mcp.json`) y corre un loop de agente de verdad: llama tools,
  ejecuta, lee resultados, repite hasta terminar (tope `max_iterations`, default 8).
  Usá el mínimo de MCPs necesario por llamada. Su criterio sobre cuándo/cómo usar
  cada tool sigue siendo más débil que el tuyo — verificar el resultado igual.
- `lm_studio_list_models` / `lm_studio_list_mcp_servers` — para ver qué modelos y
  qué MCPs hay disponibles antes de elegir.

**2. Cuándo delegar:** trabajo mecánico/masivo y de bajo razonamiento — borradores
largos, transformaciones repetitivas, resúmenes, reescritura de texto, generación de
boilerplate, investigación acotada con `lm_studio_agent`. NO delegar tareas que
requieran razonamiento complejo o alta precisión sin antes considerar el punto 3. Si
el pedido es ambiguo, priorizar calidad (hacerlo directo) salvo que <TU_NOMBRE>
insista.

**3. Selección de modelo — `v` (esfuerzo de corrección) depende del modelo, no solo
de la tarea.** Antes de descartar delegar algo de complejidad moderada, si el tiempo
no apremia, **probá con un modelo más capaz antes de asumir que ninguno puede** — el
cómputo local es gratis, así que un modelo más lento pero más inteligente solo cuesta
tiempo, no plata. Ver [MODELS.md](../MODELS.md) del repo para la tabla completa y la
evidencia real detrás de cada recomendación.

Default del modelo si no hay nada cargado: JIT-load fijo del modelo en
`LM_STUDIO_DEFAULT_MODEL` (no al azar) — configurable, ver README.

**4. Un solo modelo cargado a la vez en LM Studio, siempre elegido a propósito** —
`resolveModel()` prefiere "lo que ya esté cargado" antes que el default fijo; si
queda más de uno cargado de una sesión anterior, el bridge puede usar el equivocado
sin avisar. Si probás un modelo distinto, descargá los demás.

**5. Umbral de descarte:** si verificar/corregir el output del intern después cuesta
más del 70% de lo que hubiera costado hacer la tarea directo (`v > 0.70`), descartar
el intern para ese tipo de tarea — después de probar otro modelo (punto 3). El punto
de equilibrio matemático es `v=0.80`; 0.70 es el umbral operativo, más conservador.

**6. Puntuar y registrar cada uso — obligatorio, no opcional.** Apenas el intern
termina una tarea, puntuala vos mismo (1-10, qué tan bien la hizo comparado con
haberla hecho directo) y agregá una fila al log **compartido con Claude Code**
(mismo bridge): `~/.claude/intern-usage-log.md` — ver
[`templates/intern-usage-log.template.md`](intern-usage-log.template.md) para el
formato — `Herramienta = Codex`, **modelo usado**, qué hizo (una frase), **score
1-10**, nota breve. Es el dato que permite aprender con el tiempo qué modelo sirve
para qué tipo de tarea — sin esto no se puede comparar nada.
