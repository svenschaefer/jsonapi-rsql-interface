const fs = require("fs");
const path = require("path");

const DEFAULT_HARNESS_DIR = "C:\\code\\jsonapi-rsql-interface-smoke-test";

function parseArgs(argv) {
  const out = {
    phase: "pre",
    version: "",
    timestamp: "",
    harnessDir: DEFAULT_HARNESS_DIR
  };
  for (let i = 0; i < argv.length; i += 1) {
    const token = String(argv[i] || "");
    const next = i + 1 < argv.length ? String(argv[i + 1]) : "";
    if (token === "--phase" && next) {
      out.phase = next;
      i += 1;
      continue;
    }
    if (token === "--version" && next) {
      out.version = next;
      i += 1;
      continue;
    }
    if (token === "--timestamp" && next) {
      out.timestamp = next;
      i += 1;
      continue;
    }
    if (token === "--harness-dir" && next) {
      out.harnessDir = next;
      i += 1;
    }
  }
  return out;
}

function createRunTimestamp(date = new Date()) {
  const pad2 = (n) => String(n).padStart(2, "0");
  return [
    String(date.getUTCFullYear()),
    pad2(date.getUTCMonth() + 1),
    pad2(date.getUTCDate()),
    "T",
    pad2(date.getUTCHours()),
    pad2(date.getUTCMinutes()),
    pad2(date.getUTCSeconds()),
    "Z"
  ].join("");
}

function isTimestamp(value) {
  return /^[0-9]{8}T[0-9]{6}Z$/.test(String(value || ""));
}

function getScopedHarnessDir(baseDir, timestamp, phase, version) {
  const rootDir = path.resolve(baseDir);
  const scopedName = `${timestamp}-${phase}-${version}`;
  if (path.basename(rootDir) === scopedName) {
    return rootDir;
  }
  return path.join(rootDir, scopedName);
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
  const content = `const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

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

function resolveEntrypointRelativePath(pkgJson) {
  if (typeof pkgJson.exports === "string" && pkgJson.exports.length > 0) {
    return pkgJson.exports;
  }
  if (pkgJson.exports && typeof pkgJson.exports === "object") {
    const rootExport = pkgJson.exports["."];
    if (typeof rootExport === "string" && rootExport.length > 0) {
      return rootExport;
    }
    if (rootExport && typeof rootExport === "object") {
      if (typeof rootExport.require === "string" && rootExport.require.length > 0) {
        return rootExport.require;
      }
      if (typeof rootExport.default === "string" && rootExport.default.length > 0) {
        return rootExport.default;
      }
    }
  }
  if (typeof pkgJson.main === "string" && pkgJson.main.length > 0) {
    return pkgJson.main;
  }
  throw new Error("Installed package does not declare resolvable exports/main entrypoint.");
}

function inspectInstalledArtifact(packageName) {
  const packageDir = path.join(process.cwd(), "node_modules", packageName);
  if (!fs.existsSync(packageDir) || !fs.statSync(packageDir).isDirectory()) {
    throw new Error(\`Installed package directory not found: \${packageDir}\`);
  }
  const packageJsonPath = path.join(packageDir, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(\`Installed package.json not found: \${packageJsonPath}\`);
  }
  let pkgJson;
  try {
    pkgJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  } catch (err) {
    throw new Error(\`Installed package.json is not valid JSON: \${packageJsonPath}\`);
  }
  const entrypointRelative = resolveEntrypointRelativePath(pkgJson);
  const resolvedEntrypoint = path.resolve(packageDir, entrypointRelative);
  if (!fs.existsSync(resolvedEntrypoint)) {
    throw new Error(\`Resolved package entrypoint does not exist: \${resolvedEntrypoint}\`);
  }
  const expectedPrefix = path.resolve(process.cwd(), "node_modules") + path.sep;
  const resolvedPackageDir = path.resolve(packageDir);
  if (!resolvedPackageDir.startsWith(expectedPrefix)) {
    throw new Error(\`Resolved package directory escaped harness node_modules: \${resolvedPackageDir}\`);
  }
  return {
    packageDir: resolvedPackageDir,
    resolvedEntrypoint
  };
}

function assertEnvelopeShape(out, label) {
  if (!out || typeof out !== "object" || typeof out.ok !== "boolean") {
    throw new Error(\`\${label} did not return a valid envelope with boolean ok.\`);
  }
  if (out.ok === true) {
    const hasQueryPlan = "query_plan" in out && out.query_plan && typeof out.query_plan === "object";
    const hasPlan = "plan" in out && out.plan && typeof out.plan === "object";
    if (!hasQueryPlan && !hasPlan) {
      throw new Error(\`\${label} ok=true envelope is missing plan/query_plan.\`);
    }
  }
  if (out.ok === false && (!Array.isArray(out.errors) || out.errors.length === 0)) {
    throw new Error(\`\${label} ok=false envelope is missing non-empty errors array.\`);
  }
}

function assertAdapterContract(packageName) {
  const mod = require(packageName);
  const required = [
    "compileWhere",
    "compileOrderBy",
    "compileLimitOffset",
    "compileSecurityPredicate",
    "compileSelect",
    "assembleSelectSql"
  ];
  for (const key of required) {
    if (!mod || typeof mod[key] !== "function") {
      throw new Error(\`Adapter package under test does not expose expected function: \${key}\`);
    }
  }

  const plan = {
    kind: "query_plan",
    filter: {
      clauses: [
        {
          field: "status",
          operator: "==",
          values: ["active"],
          wildcard: null
        }
      ]
    },
    sort: ["-id"],
    page: { size: 10, number: 1 },
    include: [],
    normalized_query: {
      "fields[users]": ["id", "status"]
    },
    security: {
      predicate: {
        field: "tenant_id",
        operator: "==",
        bound_parameter_key: "tenant_scope"
      }
    }
  };
  const mapping = {
    dialect_profile: "postgresql-v1-core",
    resource: {
      table: "users",
      type: "users"
    },
    fields: {
      id: { kind: "column", column: "id" },
      status: { kind: "column", column: "status" },
      tenant_id: { kind: "column", column: "tenant_id" }
    }
  };

  const select = mod.compileSelect(plan, mapping);
  const where = mod.compileWhere(plan, mapping);
  const security = mod.compileSecurityPredicate(plan, mapping, { tenant_scope: "tenant-a" });
  const orderBy = mod.compileOrderBy(plan, mapping);
  const limitOffset = mod.compileLimitOffset(plan, mapping);
  const assembled = mod.assembleSelectSql(
    {
      table: mod.getTableSql(mapping),
      select,
      where,
      security,
      orderBy,
      limitOffset
    },
    mapping
  );
  if (!assembled || typeof assembled.text !== "string" || !Array.isArray(assembled.values)) {
    throw new Error("Adapter smoke compile/assemble result is invalid.");
  }
  if (assembled.values.length !== 4) {
    throw new Error("Adapter smoke compile/assemble produced unexpected values length.");
  }
}

function assertPackageContract(packageName) {
  if (packageName === "@jsonapi-rsql/pg") {
    assertAdapterContract(packageName);
    return;
  }
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
  assertEnvelopeShape(out, "compileRequestSafe(happy_path)");
  if (out.ok !== true) {
    throw new Error("compileRequestSafe smoke check failed.");
  }
  const sentinelNegative = mod.compileRequestSafe(null);
  assertEnvelopeShape(sentinelNegative, "compileRequestSafe(sentinel_negative)");
  if (sentinelNegative.ok !== false) {
    throw new Error("compileRequestSafe sentinel negative check did not return ok=false.");
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
  if (phase === "pre" && !packageSource) {
    throw new Error("Pre-publish smoke requires --package-source.");
  }
  if (phase === "pre") {
    if (!fs.existsSync(packageSource)) {
      throw new Error(\`Pre-publish package source does not exist: \${packageSource}\`);
    }
    const stat = fs.statSync(packageSource);
    if (!stat.isFile()) {
      throw new Error(\`Pre-publish package source must be a file: \${packageSource}\`);
    }
  }
  const installedFrom = phase === "pre" ? packageSource : \`\${packageName}@\${version}\`;
  runInstall(installedFrom);
  const artifactInfo = inspectInstalledArtifact(packageName);
  assertPackageContract(packageName);
  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        phase,
        version,
        package: packageName,
        installed_from: installedFrom,
        resolved_package_dir: artifactInfo.packageDir,
        resolved_entrypoint: artifactInfo.resolvedEntrypoint
      },
      null,
      2
    ) + "\\n"
  );
}

main();
`;
  fs.writeFileSync(runnerPath, content, "utf8");
}

function run() {
  const options = parseArgs(process.argv.slice(2));
  if (options.phase !== "pre" && options.phase !== "post") {
    throw new Error("Invalid --phase. Use 'pre' or 'post'.");
  }
  if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(options.version)) {
    throw new Error("Invalid --version. Use semantic version without leading 'v' (for example 1.0.0).");
  }
  const timestamp = options.timestamp ? String(options.timestamp).trim() : createRunTimestamp();
  if (!isTimestamp(timestamp)) {
    throw new Error("Invalid --timestamp. Use UTC basic format YYYYMMDDTHHMMSSZ.");
  }
  const harnessDir = getScopedHarnessDir(options.harnessDir, timestamp, options.phase, options.version);
  ensureDir(harnessDir);
  writeHarnessPackageJson(harnessDir);
  writeHarnessRunner(harnessDir);
}

if (require.main === module) {
  run();
}

module.exports = {
  DEFAULT_HARNESS_DIR,
  createRunTimestamp,
  isTimestamp,
  getScopedHarnessDir,
  parseArgs,
  run
};
