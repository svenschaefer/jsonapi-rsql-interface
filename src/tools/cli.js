const { compileRequestSafe } = require("../index");
const { validatePlan } = require("../validate");
const { arg, readUtf8, writeUtf8 } = require("./io");
const { loadProjectConfig } = require("./config");

function usage() {
  return [
    "Usage:",
    "  jsonapi-rsql-interface compile --in <path> [--out <path>] [--config <path>]",
    "  jsonapi-rsql-interface compile --query \"filter=status==active&sort=-created\" [--out <path>] [--config <path>]",
    "  jsonapi-rsql-interface validate-plan --in <path>"
  ].join("\n");
}

async function compileCommand(args) {
  const inPath = arg(args, "--in");
  const queryText = arg(args, "--query");
  const outPath = arg(args, "--out");
  const configPath = arg(args, "--config");

  const hasIn = typeof inPath === "string";
  const hasQuery = typeof queryText === "string";
  if (Number(hasIn) + Number(hasQuery) !== 1) {
    throw new Error("Exactly one of --in or --query is required.");
  }

  const { config } = loadProjectConfig({
    configPath,
    requireExists: typeof configPath === "string" && configPath.length > 0
  });

  let input;
  if (hasIn) {
    input = JSON.parse(readUtf8(inPath, "input file"));
  } else {
    input = {
      raw_query: queryText,
      policy: config.policy || { version: "v0", limits: {} },
      context: config.context || {
        tenant_context_present: true,
        security_predicate: { field: "tenant_id", operator: "==", bound_parameter_key: "tenant_scope" }
      }
    };
  }

  const result = compileRequestSafe(input);
  const payload = JSON.stringify(result, null, 2) + "\n";
  if (outPath) writeUtf8(outPath, payload);
  else process.stdout.write(payload);
}

function validatePlanCommand(args) {
  const inPath = arg(args, "--in");
  if (!inPath) throw new Error("validate-plan requires --in <path>");
  const raw = readUtf8(inPath, "input file");
  const doc = JSON.parse(raw);
  const plan = doc && doc.plan ? doc.plan : doc;
  validatePlan(plan);
  process.stdout.write("ok\n");
}

async function runCli(argv = process.argv.slice(2)) {
  const [cmd, ...args] = argv;
  if (!cmd || cmd === "--help" || cmd === "-h") {
    process.stdout.write(`${usage()}\n`);
    return;
  }

  if (cmd === "compile") return compileCommand(args);
  if (cmd === "validate-plan") return validatePlanCommand(args);

  throw new Error(`Unknown command: ${cmd}`);
}

module.exports = {
  runCli,
  usage,
  compileCommand,
  validatePlanCommand
};
