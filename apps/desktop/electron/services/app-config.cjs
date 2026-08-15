const fs = require("node:fs");
const path = require("node:path");

function parseEnvironment(text) {
  const values = {};
  for (const sourceLine of String(text || "").split(/\r?\n/)) {
    const line = sourceLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
      if (match[2].trim().startsWith('"')) value = value.replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\\t/g, "\t").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    } else {
      value = value.replace(/\s+#.*$/, "").trim();
    }
    values[match[1]] = value;
  }
  return values;
}

function loadAppConfig(options = {}) {
  const appRoot = path.resolve(options.appRoot || path.join(__dirname, "..", ".."));
  const environment = options.environment || process.env;
  const development = options.development ?? Boolean(environment.VITE_DEV_SERVER_URL);
  let fileValues = {};
  if (development) {
    const environmentPath = path.join(appRoot, ".env");
    try { fileValues = parseEnvironment(fs.readFileSync(environmentPath, "utf8")); }
    catch (error) { if (error?.code !== "ENOENT") throw error; }
  }
  const githubClientId = String(environment.GITHUB_CLIENT_ID || fileValues.GITHUB_CLIENT_ID || options.embeddedGithubClientId || "").trim();
  return Object.freeze({ githubClientId: githubClientId || undefined });
}

module.exports = { loadAppConfig, parseEnvironment };
