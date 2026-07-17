<!--
  Copiá esto a ~/.claude/intern-usage-log.md (o la ruta que prefieras — actualizá
  las referencias en CLAUDE.snippet.md / AGENTS.snippet.md si la cambiás) para
  empezar tu propio registro.
-->

# Registro de uso del intern (LM Studio local)

Registro **compartido entre Claude Code y Codex** de cada delegación a LM Studio vía
MCP `lm-studio` (`lm_studio_generate` / `lm_studio_agent`) para aprender qué modelo
sirve para qué tipo de tarea — mismo bridge, mismo modelo, el dato acumulado sirve
para ambas herramientas juntas.

**Es un paso obligatorio del protocolo, en toda sesión que use el intern — no
opcional.** Apenas el intern termina una tarea, quien lo llamó (Claude Code o Codex)
la puntúa y agrega una fila. Toma 10 segundos; sin este dato no se puede aprender qué
modelo conviene para qué.

## Cómo puntuar (1-10)

Vos (el LLM que llamó al intern) juzgás qué tan bien hizo la tarea, comparado con
haberla hecho vos directo:

| Score | Significado |
|---|---|
| 9-10 | Se usó tal cual, sin tocar nada |
| 7-8 | Ajustes menores, el grueso quedó bien |
| 5-6 | Corrección significativa pero rescatable — sirvió de base |
| 3-4 | Revisión pesada, aportó poco |
| 1-2 | Se descartó / hubo que rehacer casi todo |

Fórmula de referencia (no hace falta calcularla a mano): `score ≈ round(10 × (1 − v))`,
donde `v` es la fracción del output que igual generarías vos — ver
[`MODELS.md`](../MODELS.md) para la regla de costo completa. **Score ≤ 3 ≈ el umbral
de descarte `v > 0.70`** — si algo puntúa 3 o menos, tratalo como candidato a "no
delegar este tipo de tarea" o "probar otro modelo".

## Registro

| Fecha | Herramienta | Modelo | Qué hizo (breve) | Score /10 | Nota breve |
|---|---|---|---|---|---|
