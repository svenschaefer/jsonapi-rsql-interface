const fs = require("fs");
const path = require("path");

const DEFAULT_HARNESS_DIR = "C:\\code\\jsonapi-rsql-interface-smoke-test";

function parseArgs(argv) {
  const out = {
    harnessDir: DEFAULT_HARNESS_DIR
  };
  for (let i = 0; i < argv.length; i += 1) {
    const token = String(argv[i] || "");
    const next = i + 1 < argv.length ? String(argv[i + 1]) : "";
    if (token === "--harness-dir" && next) {
      out.harnessDir = next;
      i += 1;
    }
  }
  return out;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeHarnessPackageJson(harnessDir) {
  const pkgPath = path.join(harnessDir, "package.json");
  const pkg = {
    name: "jsonapi-rsql-interface-smoke-test",
    version: "1.0.0",
    private: true,
    description: "External smoke harness for jsonapi-rsql-interface",
    scripts: {
      "smoke:prepublish": "node smoke-runner.js",
      "smoke:postpublish": "node smoke-runner.js"
    }
  };
  fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
}

function writeHarnessRunner(harnessDir) {
  const runnerPath = path.join(harnessDir, "smoke-runner.js");
  const content = `const { spawnSync } = require("child_process");

function getArg(flag) {
  const args = process.argv.slice(2);
  const idx = args.indexOf(flag);
  if (idx < 0 || idx + 1 >= args.length) return "";
  return String(args[idx + 1]);
}

function runInstall(spec) {
  if (!spec) throw new Error("Missing package install spec for smoke runner.");
  const isWin = process.platform === "win32";
  const cmd = isWin ? "cmd.exe" : "npm";
  const cmdArgs = isWin
    ? ["/d", "/s", "/c", \`npm install --no-save \${spec}\`]
    : ["install", "--no-save", spec];
  const result = spawnSync(cmd, cmdArgs, { stdio: "inherit", shell: false });
  if (result.error) throw new Error(\`Install command failed to start: \${result.error.message}\`);
  if (result.status !== 0) throw new Error(\`Install command failed with exit code \${result.status}\`);
}

function assertPackageContract(packageName) {
  const mod = require(packageName);
  if (!mod || typeof mod.compileRequest !== "function" || typeof mod.compileRequestSafe !== "function") {
    throw new Error("Package under test does not expose expected compile API.");
  }
  const input = {
    raw_query: "filter=status==active&sort=-status",
    policy: {
      version: "v1",
      fields: {
        status: {
          type: "enum",
          filterable: true,
          operators: ["==", "!="],
          enum_values: ["active", "disabled"]
        }
      },
      query_dimensions: {
        include_allowlist: [],
        sortable_fields: ["status"],
        fields_allowlist: { users: ["id", "status"] }
      },
      limits: {
        max_raw_query_length: 2048,
        max_decoded_query_length: 2048,
        max_param_count: 16,
        max_key_value_pairs: 32,
        max_parameter_value_length: 256,
        max_filter_literal_length: 256,
        max_include_paths: 4,
        max_include_path_length: 64,
        max_sort_keys: 4,
        max_sparse_fields: 16,
        max_ast_depth: 8,
        max_ast_nodes: 64,
        max_in_list_items: 20
      }
    },
    context: {
      tenant_context_present: true,
      security_predicate: {
        field: "tenant_id",
        operator: "==",
        bound_parameter_key: "tenant_scope"
      }
    }
  };
  const out = mod.compileRequestSafe(input);
  if (!out || out.ok !== true) {
    throw new Error("compileRequestSafe smoke check failed.");
  }
}

function main() {
  const phase = getArg("--phase");
  const version = getArg("--version");
  const packageName = getArg("--package");
  const packageSource = getArg("--package-source");
  if (!phase || !version || !packageName) {
    throw new Error("Missing required smoke runner args (--phase, --version, --package).");
  }
  const installSpec = phase === "pre" ? packageSource : \`\${packageName}@\${version}\`;
  runInstall(installSpec);
  assertPackageContract(packageName);
  process.stdout.write(JSON.stringify({ ok: true, phase, version, package: packageName }, null, 2) + "\\n");
}

main();
`;
  fs.writeFileSync(runnerPath, content, "utf8");
}

function run() {
  const options = parseArgs(process.argv.slice(2));
  const harnessDir = path.resolve(options.harnessDir);
  ensureDir(harnessDir);
  writeHarnessPackageJson(harnessDir);
  writeHarnessRunner(harnessDir);
}

if (require.main === module) {
  run();
}

module.exports = {
  DEFAULT_HARNESS_DIR,
  parseArgs,
  run
};
