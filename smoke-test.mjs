// Smoke test end-to-end del bridge, sin depender de ningún MCP externo por
// defecto. Requiere LM Studio corriendo con al menos un modelo (ver README).
//
// Uso:
//   node smoke-test.mjs              -> prueba lm_studio_list_models + lm_studio_generate
//   node smoke-test.mjs --agent NAME -> además prueba lm_studio_agent contra el
//                                       server NAME de ~/.lmstudio/mcp.json
//                                       (ej: node smoke-test.mjs --agent filesystem)
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const agentServerArg = process.argv.indexOf("--agent");
const agentServerName = agentServerArg !== -1 ? process.argv[agentServerArg + 1] : null;

const client = new Client({ name: "smoke-test", version: "0.0.1" });
const transport = new StdioClientTransport({
  command: "node",
  args: ["dist/index.js"],
  env: { ...process.env, LM_AGENT_DEBUG: "1" },
  stderr: "inherit",
});
await client.connect(transport);

console.log("=== tools disponibles ===");
const { tools } = await client.listTools();
console.log(tools.map((t) => t.name).join(", "));

console.log("\n=== lm_studio_list_models ===");
const modelsRes = await client.callTool({ name: "lm_studio_list_models", arguments: {} });
console.log(modelsRes.content.map((b) => b.text).join("\n"));

console.log("\n=== lm_studio_generate ===");
const genRes = await client.callTool({
  name: "lm_studio_generate",
  arguments: { prompt: "Decí solo la palabra OK, nada más.", max_tokens: 200 },
});
console.log(genRes.content.map((b) => b.text).join("\n"));
if (genRes.isError) {
  console.error("\nlm_studio_generate devolvió isError=true — revisá que LM Studio esté corriendo.");
  await client.close();
  process.exit(1);
}

if (agentServerName) {
  console.log(`\n=== lm_studio_agent (contra el server "${agentServerName}") ===`);
  const agentRes = await client.callTool(
    {
      name: "lm_studio_agent",
      arguments: {
        prompt: `Usá las tools disponibles del server "${agentServerName}" para hacer algo simple de prueba y contame el resultado en una oración.`,
        mcp_servers: [agentServerName],
        max_iterations: 5,
      },
    },
    undefined,
    { timeout: 180000, resetTimeoutOnProgress: true, maxTotalTimeout: 300000 },
  );
  console.log(JSON.stringify(agentRes, null, 2));
}

console.log("\n✔ smoke test OK");
await client.close();
process.exit(0);
