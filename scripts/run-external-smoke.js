const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const DEFAULT_HARNESS_DIR = "C:\\code\\jsonapi-rsql-interface-smoke-test";
const DEFAULT_PACKAGE_NAME = "jsonapi-rsql-interface";
const DEFAULT_HARNESS_PACKAGE = "jsonapi-rsql-interface-smoke-test";

function parseArgs(argv) {
  const out = {
    phase: "",
    version: "",
    timestamp: "",
    harnessDir: DEFAULT_HARNESS_DIR,
    packageName: DEFAULT_PACKAGE_NAME,
    harnessPackage: DEFAULT_HARNESS_PACKAGE,
    packageSource: ""
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
      continue;
    }
    if (token === "--package-name" && next) {
      out.packageName = next;
      i += 1;
      continue;
    }
    if (token === "--harness-package" && next) {
      out.harnessPackage = next;
      i += 1;
      continue;
    }
    if (token === "--package-source" && next) {
      out.packageSource = next;
      i += 1;
    }
  }
  return out;
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

function resolveLatestScopedHarnessDir(baseDir, phase, version) {
  const rootDir = path.resolve(baseDir);
  if (!fs.existsSync(rootDir)) {
    throw new Error(`Smoke harness root directory does not exist: ${rootDir}`);
  }
  const suffix = `-${phase}-${version}`;
  const candidates = fs
    .readdirSync(rootDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.endsWith(suffix))
    .map((entry) => entry.name)
    .sort();
  if (candidates.length === 0) {
    throw new Error(
      `No scoped harness directory found under ${rootDir} for phase/version ${phase}/${version}. Provide --timestamp or run prepare/bootstrap first.`
    );
  }
  return path.join(rootDir, candidates[candidates.length - 1]);
}

function resolveHarnessExecutionDir(options) {
  const rootDir = options.timestamp
    ? getScopedHarnessDir(options.harnessDir, options.timestamp, options.phase, options.version)
    : resolveLatestScopedHarnessDir(options.harnessDir, options.phase, options.version);
  if (!fs.existsSync(rootDir)) {
    throw new Error(`Smoke harness directory does not exist: ${rootDir}`);
  }

  const directPkg = path.join(rootDir, "package.json");
  if (fs.existsSync(directPkg)) {
    return rootDir;
  }

  const installedDir = path.join(rootDir, "node_modules", options.harnessPackage);
  const installedPkg = path.join(installedDir, "package.json");
  if (fs.existsSync(installedPkg)) {
    return installedDir;
  }

  throw new Error(
    [
      "Smoke harness package.json not found.",
      `Checked root: ${directPkg}`,
      `Checked installed artifact: ${installedPkg}`,
      "Expected behavior: harness is available as installed package at execution time."
    ].join(" ")
  );
}

function validateOptions(options) {
  if (options.phase !== "pre" && options.phase !== "post") {
    throw new Error("Invalid --phase. Use 'pre' or 'post'.");
  }
  if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(options.version)) {
    throw new Error("Invalid --version. Use semantic version without leading 'v' (for example 1.0.0).");
  }
  if (options.timestamp && !isTimestamp(options.timestamp)) {
    throw new Error("Invalid --timestamp. Use UTC basic format YYYYMMDDTHHMMSSZ.");
  }
  if (options.phase === "pre" && !(options.packageSource && String(options.packageSource).trim())) {
    throw new Error("Pre-publish smoke requires --package-source pointing to local artifact.");
  }
  const harnessDir = resolveHarnessExecutionDir(options);
  return {
    ...options,
    harnessDir,
    timestamp: options.timestamp ? String(options.timestamp).trim() : "",
    packageSource: options.packageSource ? String(options.packageSource).trim() : ""
  };
}

function buildRunCommand(options) {
  const script = options.phase === "pre" ? "smoke:prepublish" : "smoke:postpublish";
  const sourceArg =
    options.packageSource && options.packageSource.length > 0
      ? ` --package-source ${options.packageSource}`
      : "";
  const command = `npm run ${script} -- --version ${options.version} --package ${options.packageName} --phase ${options.phase}${sourceArg}`;
  if (process.platform === "win32") {
    return {
      cmd: "cmd.exe",
      args: ["/d", "/s", "/c", command]
    };
  }
  return {
    cmd: "npm",
    args: [
      "run",
      script,
      "--",
      "--version",
      options.version,
      "--package",
      options.packageName,
      "--phase",
      options.phase,
      ...(options.packageSource && options.packageSource.length > 0
        ? ["--package-source", options.packageSource]
        : [])
    ]
  };
}

function run() {
  const parsed = parseArgs(process.argv.slice(2));
  const options = validateOptions(parsed);
  const spec = buildRunCommand(options);

  const result = spawnSync(spec.cmd, spec.args, {
    cwd: options.harnessDir,
    stdio: "inherit",
    shell: false
  });

  if (result.error) {
    throw new Error(`External smoke command failed to start: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`External smoke command failed with exit code ${result.status}.`);
  }
}

if (require.main === module) {
  run();
}

module.exports = {
  DEFAULT_HARNESS_DIR,
  DEFAULT_PACKAGE_NAME,
  DEFAULT_HARNESS_PACKAGE,
  parseArgs,
  isTimestamp,
  getScopedHarnessDir,
  resolveLatestScopedHarnessDir,
  resolveHarnessExecutionDir,
  validateOptions,
  buildRunCommand,
  run
};
