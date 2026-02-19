const fs = require("fs");
const path = require("path");

function ensureObject(value, sourcePath) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Config file must contain a JSON object: ${sourcePath}`);
  }
  return value;
}

function loadProjectConfig(options = {}) {
  const cwd = typeof options.cwd === "string" && options.cwd.length > 0 ? options.cwd : process.cwd();
  const configPath =
    typeof options.configPath === "string" && options.configPath.length > 0
      ? path.resolve(options.configPath)
      : path.resolve(cwd, "project.config.json");
  const requireExists = options.requireExists === true;

  if (!fs.existsSync(configPath)) {
    if (requireExists) {
      throw new Error(`Config file does not exist: ${configPath}`);
    }
    return { path: configPath, exists: false, config: {} };
  }

  const raw = fs.readFileSync(configPath, "utf8");
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    throw new Error(`Invalid JSON in config file ${configPath}: ${msg}`);
  }
  return { path: configPath, exists: true, config: ensureObject(parsed, configPath) };
}

module.exports = {
  loadProjectConfig
};
