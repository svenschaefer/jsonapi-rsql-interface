const fs = require("fs");
const path = require("path");

function arg(args, name) {
  const i = args.indexOf(name);
  if (i < 0) return undefined;
  return args[i + 1];
}

function readUtf8(filePath, label) {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) throw new Error(`${label} does not exist: ${resolved}`);
  return fs.readFileSync(resolved, "utf8");
}

function writeUtf8(filePath, text) {
  const resolved = path.resolve(filePath);
  fs.writeFileSync(resolved, text, "utf8");
}

module.exports = {
  arg,
  readUtf8,
  writeUtf8
};
