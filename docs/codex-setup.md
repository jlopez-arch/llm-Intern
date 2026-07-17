# Setup en Codex

Asume que ya hiciste el setup de [LM Studio](lm-studio-setup.md) y clonaste este repo.

## 1. Instalar dependencias y compilar

```bash
cd llm-Intern
npm install
npm run build
```

## 2. Registrar el servidor MCP

Codex lee su config de MCP servers en `~/.codex/config.toml`. Agregá una entrada:

```toml
[mcp_servers.lm-studio]
command = "node"
args = ["<RUTA_DEL_REPO>/dist/index.js"]
```

Reemplazá `<RUTA_DEL_REPO>` por la ruta real donde clonaste este repo. Reiniciá
Codex (o la sesión activa) para que tome la config nueva.

## 3. Agregar el protocolo a tu AGENTS.md global

Codex lee `~/.codex/AGENTS.md` en cada sesión (a diferencia de Claude Code, que
además de instrucciones globales tiene un sistema de memoria por proyecto). Pegá el
contenido de [`templates/AGENTS.snippet.md`](../templates/AGENTS.snippet.md) ahí,
reemplazando el placeholder `<RUTA_DEL_REPO>` por la ruta real del repo.

Esto es lo que hace que decir **"usa el intern"** dispare todo el protocolo
(qué tool usar, cuándo delegar, selección de modelo, registro de uso) en vez de que
Codex lo interprete como "delegar a un helper genérico".

## 4. Verificar

```bash
node smoke-test.mjs
```

Si ves `✔ smoke test OK`, el bridge funciona. Codex y Claude Code pueden compartir
el mismo `~/.claude/intern-usage-log.md` (ver
[`templates/intern-usage-log.template.md`](../templates/intern-usage-log.template.md))
si querés que el aprendizaje de qué modelo sirve para qué tarea sea conjunto entre
ambas herramientas — el bridge y el modelo local son los mismos para las dos.
