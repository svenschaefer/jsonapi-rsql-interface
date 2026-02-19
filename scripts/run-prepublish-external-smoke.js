const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

function getNpmCommand() {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

function parseArgs(argv) {
  const root = path.resolve(__dirname, "..");
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const out = {
    version: String(pkg.version || ""),
    packageName: String(pkg.name || "jsonapi-rsql-interface"),
    timestamp: "",
    harnessDir: "C:\\code\\jsonapi-rsql-interface-smoke-test",
    harnessPackage: "jsonapi-rsql-interface-smoke-test",
    workspace: ""
  };
  for (let i = 0; i < argv.length; i += 1) {
    const token = String(argv[i] || "");
    const next = i + 1 < argv.length ? String(argv[i + 1]) : "";
    if (token === "--version" && next) {
      out.version = next;
      i += 1;
      continue;
    }
    if (token === "--package-name" && next) {
      out.packageName = next;
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
    if (token === "--harness-package" && next) {
      out.harnessPackage = next;
      i += 1;
      continue;
    }
    if (token === "--workspace" && next) {
      out.workspace = next;
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

function runCommand(cmd, args, cwd) {
  const result = spawnSync(cmd, args, {
    cwd,
    encoding: "utf8",
    stdio: "pipe",
    shell: false
  });
  if (result.error) {
    throw new Error(`Command failed to start: ${cmd} ${args.join(" ")} :: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(
      `Command failed (${result.status}): ${cmd} ${args.join(" ")}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`
    );
  }
  return result.stdout;
}

function runNpm(args, cwd) {
  if (process.platform === "win32") {
    const command = `npm ${args.join(" ")}`;
    return runCommand("cmd.exe", ["/d", "/s", "/c", command], cwd);
  }
  return runCommand(getNpmCommand(), args, cwd);
}

function run() {
  const options = parseArgs(process.argv.slice(2));
  const runTimestamp = options.timestamp ? String(options.timestamp).trim() : createRunTimestamp();
  if (!isTimestamp(runTimestamp)) {
    throw new Error("Invalid --timestamp. Use UTC basic format YYYYMMDDTHHMMSSZ.");
  }
  const repoRoot = path.resolve(__dirname, "..");

  runCommand(
    process.execPath,
    [
      path.join(repoRoot, "scripts", "bootstrap-external-smoke-harness.js"),
      "--phase",
      "pre",
      "--version",
      options.version,
      "--timestamp",
      runTimestamp,
      "--harness-dir",
      options.harnessDir
    ],
    repoRoot
  );

  const packArgs = ["pack", "--json"];
  if (options.workspace && String(options.workspace).trim().length > 0) {
    packArgs.push("--workspace", String(options.workspace).trim());
  }
  const packOut = runNpm(packArgs, repoRoot);
  const packPayload = JSON.parse(packOut);
  const artifactName = Array.isArray(packPayload) && packPayload[0] ? packPayload[0].filename : "";
  if (!artifactName) {
    throw new Error("Unable to resolve packed artifact filename from npm pack output.");
  }
  const artifactPath = path.join(repoRoot, artifactName);

  const smokeArgs = [
    path.join(repoRoot, "scripts", "run-external-smoke.js"),
    "--phase",
    "pre",
    "--version",
    options.version,
    "--timestamp",
    runTimestamp,
    "--package-source",
    artifactPath,
    "--harness-dir",
    options.harnessDir,
    "--harness-package",
    options.harnessPackage,
    "--package-name",
    options.packageName
  ];

  const smoke = spawnSync(process.execPath, smokeArgs, {
    cwd: repoRoot,
    stdio: "inherit",
    shell: false
  });
  if (smoke.error) {
    throw new Error(`Pre-publish smoke command failed to start: ${smoke.error.message}`);
  }
  if (smoke.status !== 0) {
    throw new Error(`Pre-publish smoke failed with exit code ${smoke.status}.`);
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        ok: true,
        phase: "pre",
        version: options.version,
        timestamp: runTimestamp,
        package: options.packageName,
        artifact: artifactPath,
        harness_dir: path.join(path.resolve(options.harnessDir), `${runTimestamp}-pre-${options.version}`)
      },
      null,
      2
    )}\n`
  );
}

if (require.main === module) {
  run();
}

module.exports = {
  getNpmCommand,
  createRunTimestamp,
  isTimestamp,
  parseArgs,
  run
};
