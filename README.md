# llm-Intern

Servidor MCP que expone un modelo local de [LM Studio](https://lmstudio.ai/) como
tools de **Claude Code** y **Codex** — "el intern": delegación de trabajo mecánico o
masivo a un modelo que corre gratis en tu propia máquina, para no gastar cuota del
modelo grande en tareas que no la necesitan.

No es un reemplazo del modelo grande. Es un ayudante barato para lo mecánico, con
reglas claras de cuándo conviene usarlo y cuándo no.

## Por qué

El modelo grande (Claude, GPT) cobra por token y razona mejor. El modelo local
(LM Studio) es gratis e ilimitado, pero rinde peor en razonamiento complejo. Este
repo no es solo el bridge técnico — es también el **protocolo de decisión** (cuándo
delegar, con qué modelo, cómo medir si valió la pena) que fuimos afinando con uso
real, no en teoría. Ver [`MODELS.md`](MODELS.md) para la evidencia.

## Qué incluye

- **`src/index.ts`** — el servidor MCP (Node/TypeScript). Cuatro tools:
  - `lm_studio_generate` — texto/código sin herramientas, todo el contexto va en el prompt.
  - `lm_studio_agent` — el modelo local con acceso real a tus otros MCPs (`~/.lmstudio/mcp.json`), loop de agente completo.
  - `lm_studio_list_models` — qué hay descargado/cargado en LM Studio.
  - `lm_studio_list_mcp_servers` — qué MCPs puede usar `lm_studio_agent`.
- **`.claude/skills/intern/`** — Skill de Claude Code (`/intern`) con el protocolo completo.
- **`templates/`** — snippets para pegar en tu `~/.claude/CLAUDE.md` y `~/.codex/AGENTS.md` (delegación automática, sin invocar el skill a mano), más un `mcp.json` de ejemplo y una plantilla de log de uso.
- **`MODELS.md`** — qué modelos usar para qué, con datos reales de uso (no solo benchmarks).
- **`docs/`** — guías de instalación paso a paso por herramienta.

## Quickstart

Prerrequisito: [LM Studio](https://lmstudio.ai/) instalado, con al menos un modelo
descargado y el servidor local activo (`http://localhost:1234`). Ver
[`docs/lm-studio-setup.md`](docs/lm-studio-setup.md).

```bash
git clone https://github.com/fvanlookeren-bit/llm-Intern.git
cd llm-Intern
./install.sh
```

El instalador compila el bridge y, si tenés el CLI `claude`, te ofrece registrarlo.
Para Codex, o para el resto del setup (Skill, snippets de CLAUDE.md/AGENTS.md), ver:

- [`docs/claude-code-setup.md`](docs/claude-code-setup.md)
- [`docs/codex-setup.md`](docs/codex-setup.md)

Verificar que todo funciona:

```bash
node smoke-test.mjs
```

## Cómo se usa

Una vez instalado, en cualquier sesión de Claude Code o Codex:

> "Usá el intern para resumir estos 40 archivos de log."

El modelo grande delega la tarea al MCP `lm-studio`, que corre local contra LM
Studio. Con las instrucciones de `templates/CLAUDE.snippet.md` /
`templates/AGENTS.snippet.md` instaladas, la delegación también pasa
**proactivamente** para tareas mecánicas obvias, sin que lo pidas cada vez.

## Configuración

Variables de entorno opcionales (todas tienen default):

| Variable | Default | Qué hace |
|---|---|---|
| `LM_STUDIO_BASE_URL` | `http://localhost:1234/v1` | Endpoint OpenAI-compatible de LM Studio |
| `LM_STUDIO_DEFAULT_MODEL` | `qwen/qwen3.6-35b-a3b` | Modelo que se JIT-carga si no hay ninguno ya cargado |

## Limitaciones conocidas (de LM Studio, no de este bridge)

- **Desactivar el "thinking" vía API no es confiable** — hay que editar el Prompt
  Template del modelo en la app. Ver [`docs/lm-studio-setup.md`](docs/lm-studio-setup.md#desactivar-el-thinking).
- `lm_studio_agent` razona peor que el modelo grande sobre cuándo/cómo usar cada
  tool — verificá el resultado, no lo asumas correcto.

## Licencia

MIT — ver [`LICENSE`](LICENSE).
