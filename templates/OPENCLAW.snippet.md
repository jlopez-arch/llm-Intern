<!--
  Base para las instrucciones globales de tu agente principal en OpenClaw (u otro
  framework de agentes local) — el equivalente de AGENTS.md/CLAUDE.md ahí. Adaptá
  <TU_NOMBRE> y <RUTA_DEL_REPO>. Ver docs/openclaw-setup.md para los dos patrones
  de integración (delegación por tool vs. provider directo).
-->

## Delegar al "intern" (LM Studio local) — protocolo completo

Cuando <TU_NOMBRE> diga "usa el intern" (o "el intern"), delegás la tarea al modelo
local de LM Studio en vez de hacerla vos directo — corre gratis en la máquina, pero
rinde peor en razonamiento complejo.

**Si tu agente corre con delegación por tool** (MCP `lm-studio`, bridge en
`<RUTA_DEL_REPO>`): usá `lm_studio_generate` (texto/código sin tools, todo el
contexto va en el prompt) o `lm_studio_agent` (con tools MCP reales, vía
`mcp_servers`). Ver [`README.md`](../README.md) del repo para el detalle de cada
tool.

**Si tu agente corre "intern-first"** (LM Studio como provider directo, no por
tool): el modelo local hace el primer intento completo de la tarea; vos (el agente
supervisor) solo revisás, corregís lo necesario, y cerrás — no rehacés desde cero
salvo que el resultado no sea rescatable.

**Selección de modelo y cuándo delegar:** ver [MODELS.md](../MODELS.md) del repo —
misma tabla y misma regla de umbral (`v > 0.70` de esfuerzo de corrección → descartar
para ese tipo de tarea) sea cual sea el patrón de integración.

**Un solo modelo cargado a la vez, siempre elegido a propósito.** Si tu agente
corre tareas autónomas largas sobre el modelo local (patrón intern-first), un swap
de modelo a mitad de tarea es más disruptivo que en una delegación puntual — vale la
pena verificar/bloquear cambios de modelo mientras haya una tarea activa si tu
framework lo permite.

**Registrar el uso:** apenas termina una tarea delegada, puntuala (1-10, comparado
con haberla hecho vos directo) en el log compartido — ver
[`templates/intern-usage-log.template.md`](intern-usage-log.template.md).
