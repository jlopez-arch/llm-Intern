<!--
  Pegá esto en tu ~/.claude/CLAUDE.md (instrucciones globales, se cargan en toda
  sesión de Claude Code sin importar el proyecto). Reemplazá <TU_NOMBRE> y
  <RUTA_DEL_REPO> por tus valores reales. Ver docs/claude-code-setup.md para el
  resto de la instalación.
-->

## Delegar al "intern" (LM Studio local) — protocolo completo

**Por defecto, proactivo — no esperar a que lo pida.** Para cualquier tarea que
entre en la categoría del punto 2 (mecánica/masiva, bajo razonamiento), evaluar
primero si conviene mandarla al intern ANTES de hacerla directo, sin necesidad de
que <TU_NOMBRE> diga "usa el intern" cada vez. Si decidís hacerla directo en vez de
delegarla, decí en una línea por qué (ej. "esto es de alta precisión, lo hago yo").

Si <TU_NOMBRE> dice "usa el intern" explícitamente, es obligatorio invocar **todo
este protocolo entero**, no solo "mandale un prompt" — y **no es sinónimo de
subagentes** (el tool `Agent`, `Explore`, `general-purpose`, etc.): esos corren en
el modelo grande y consumen su cuota/tokens igual que hacerlo directo; el intern
corre 100% local y gratis en LM Studio, en un modelo distinto. Si usás subagentes en
lugar del intern (o viceversa) cuando te lo pidieron explícito, es un error —
esperá que te corrijan.

**1. Tools disponibles** (servidor MCP `lm-studio`, bridge en `<RUTA_DEL_REPO>`) —
elegí según la tarea:
- `lm_studio_generate` — solo texto/código, **sin tools**. Dale todo el contexto
  directo en el prompt (no puede ir a buscar nada él mismo).
- `lm_studio_agent` — **con tools MCP reales**. Le pasás `mcp_servers` (nombres de
  `~/.lmstudio/mcp.json`) y corre un loop de agente de verdad: llama tools, lee
  resultados, repite hasta terminar. Usá el mínimo de MCPs necesario por llamada.
- `lm_studio_list_models` / `lm_studio_list_mcp_servers` — para ver qué modelos y
  qué MCPs hay disponibles antes de elegir.

**2. Cuándo delegar (default, sin que lo pidan):** trabajo mecánico/masivo y de bajo
razonamiento — borradores largos, transformaciones repetitivas, resúmenes,
boilerplate, investigación acotada con `lm_studio_agent`. Para estos casos el
default es evaluar el intern primero, no hacerlo directo. Solo saltar el intern y
hacerlo vos si: (a) es alta precisión/impacto real (bugs, vulnerabilidades,
arquitectura — ver [MODELS.md](../MODELS.md)), o (b) es genuinamente ambiguo/urgente
y no hay margen para iterar con el intern.

**3. Selección de modelo** — ver [MODELS.md](../MODELS.md) del repo para la tabla
completa y la evidencia real detrás de cada recomendación. Regla general: si el
tiempo no apremia, probá un modelo más capaz antes de asumir que ninguno puede,
porque el cómputo local es gratis y solo cuesta tiempo.

**4. Un solo modelo cargado a la vez en LM Studio, siempre elegido a propósito** —
`resolveModel()` prefiere "lo que ya esté cargado" antes que el default fijo; si
queda más de uno cargado de otra sesión, el bridge puede usar el equivocado sin
avisar. Si probás un modelo distinto, descargá los demás.

**5. Umbral de descarte:** si verificar/corregir su output después cuesta más del
70% de lo que hubiera costado hacer la tarea directo (`v > 0.70`), descartar el
intern para ese tipo de tarea — después de probar otro modelo (punto 3).

**6. Puntuar y registrar cada uso — obligatorio, no opcional.** Apenas el intern
termina una tarea, la puntuás vos mismo (1-10, qué tan bien la hizo comparado con
haberla hecho directo) y agregás una fila al log compartido Claude Code + Codex:
`~/.claude/intern-usage-log.md` — ver
[`templates/intern-usage-log.template.md`](intern-usage-log.template.md) para el
formato — herramienta, **modelo usado**, qué hizo (una frase), **score 1-10**, nota
breve. Es el dato que permite aprender con el tiempo qué modelo sirve para qué tipo
de tarea — sin esto no se puede comparar nada.
