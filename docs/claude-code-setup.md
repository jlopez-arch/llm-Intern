# Setup en Claude Code

Asume que ya hiciste el setup de [LM Studio](lm-studio-setup.md) y clonaste este repo.

## 1. Instalar dependencias y compilar

```bash
cd llm-Intern
npm install
npm run build
```

## 2. Registrar el servidor MCP

A nivel usuario (disponible en todos tus repos, no solo en uno):

```bash
claude mcp add --scope user lm-studio -- node "$(pwd)/dist/index.js"
```

Confirmá que quedó conectado:

```bash
claude mcp list
```

Debería mostrar `lm-studio: ... - ✔ Connected`. Si acabás de registrarlo con una
sesión de Claude Code ya abierta, hace falta reiniciar esa sesión para que cargue
las tools nuevas (`lm_studio_generate`, `lm_studio_agent`, `lm_studio_list_models`,
`lm_studio_list_mcp_servers`).

## 3. Instalar el Skill (opcional pero recomendado)

Copiá `.claude/skills/intern/` de este repo a `~/.claude/skills/intern/` (nivel
usuario, disponible en todos los proyectos) o a `.claude/skills/intern/` dentro de
un proyecto puntual:

```bash
mkdir -p ~/.claude/skills
cp -r .claude/skills/intern ~/.claude/skills/intern
```

Esto te da `/intern` como invocación explícita. Para que la delegación funcione
también quieras se lo pidas, no solo cuando invoques el skill, seguí el paso 4.

## 4. Agregar el protocolo a tu CLAUDE.md global

El Skill cubre la invocación explícita (`/intern ...`), pero para que decir **"usa
el intern"** en una conversación normal dispare la delegación sin que tengas que
invocar el skill a mano, pegá el contenido de
[`templates/CLAUDE.snippet.md`](../templates/CLAUDE.snippet.md) en tu
`~/.claude/CLAUDE.md` (instrucciones globales, se cargan en toda sesión).

Editá el placeholder `<RUTA_DEL_REPO>` en el snippet por la ruta real donde clonaste
este repo.

**Por qué en dos lugares (memoria de que esto pasó una vez):** si el protocolo vive
solo en la memoria de un proyecto puntual, sesiones de Claude Code en otros repos no
lo cargan y "intern" queda ambiguo — puede interpretarse como "delegar a un
subagente" (`Agent`/`Explore`, que corren en Claude y sí consumen tokens) en vez de
"delegar al MCP `lm-studio`" (gratis, local). Ponerlo en `~/.claude/CLAUDE.md`
(global) evita esa ambigüedad en cualquier proyecto.

## 5. Verificar

```bash
node smoke-test.mjs
```

Si ves `✔ smoke test OK`, el bridge funciona. Para probar `lm_studio_agent` con un
MCP real, primero armá tu `~/.lmstudio/mcp.json` (ver
[lm-studio-setup.md](lm-studio-setup.md#mcps-para-lm_studio_agent)) y corré:

```bash
node smoke-test.mjs --agent filesystem
```
