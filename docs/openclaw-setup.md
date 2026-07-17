# Setup en OpenClaw (u otro framework de agentes local)

Asume que ya hiciste el setup de [LM Studio](lm-studio-setup.md) y clonaste este repo.
Esta guía es más genérica que las de Claude Code/Codex porque cada framework de
agentes local tiene su propio formato de config — adaptá los nombres de campo a lo
que use el tuyo.

## Patrón 1: delegación por tool (igual que Claude Code/Codex)

Si tu framework consume MCP servers (la mayoría de los agenticos locales lo hacen),
registrá el bridge igual que en los otros dos: agregalo a su config de MCP servers
(normalmente un objeto `mcpServers` — mismo formato que `~/.lmstudio/mcp.json`):

```json
{
  "mcpServers": {
    "lm-studio": {
      "command": "node",
      "args": ["<RUTA_DEL_REPO>/dist/index.js"]
    }
  }
}
```

Y agregá el protocolo de delegación (cuándo usar el intern, selección de modelo,
umbral de descarte) a las instrucciones globales de tu agente principal — el
equivalente de `AGENTS.md`/`CLAUDE.md` para tu framework. Base:
[`templates/openclaw.snippet.md`](../templates/openclaw.snippet.md).

## Patrón 2: LM Studio como provider directo (si tu framework lo soporta)

Algunos frameworks de agentes dejan configurar un endpoint OpenAI-compatible local
como **provider de modelo**, no solo como tool — en ese caso el agente corre
*directamente* sobre el modelo local (no pasa por este bridge ni por sus tools).
Apuntá esa config a `http://localhost:1234/v1` (o tu `LM_STUDIO_BASE_URL`).

Esto habilita un patrón distinto al de "delegación puntual" de Claude Code/Codex:
**intern-first** — el modelo local hace el primer intento de la tarea completa, y el
agente supervisor (modelo grande) solo revisa, corrige lo necesario, y cierra. Es lo
inverso de "el modelo grande hace todo y delega lo mecánico" — tiene sentido cuando
el framework ya está pensado para correr agentes autónomos de bajo costo por
defecto, con supervisión humana o de un modelo mejor como red de seguridad, no al
revés.

**Ojo:** en este patrón NO aplican automáticamente las tools `lm_studio_generate` /
`lm_studio_agent` de este bridge (el agente ya está corriendo sobre LM Studio
directamente) — la regla de "un modelo cargado a la vez, elegido a propósito" de
[MODELS.md](../MODELS.md) importa todavía más acá, porque un swap de modelo a mitad
de una tarea autónoma es más disruptivo que en una delegación puntual.

## Verificar

```bash
node smoke-test.mjs
```

Y confirmá desde tu framework que puede ver las tools del server `lm-studio` (o, si
usaste el Patrón 2, que responde al endpoint OpenAI-compatible directo).
