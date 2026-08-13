const { spawn } = require("node:child_process");
const http = require("node:http");
const path = require("node:path");

const appRoot = path.resolve(__dirname, "..");
const devServerUrl = "http://127.0.0.1:5173";
const viteEntry = path.join(appRoot, "node_modules", "vite", "bin", "vite.js");
const electronEntry = require("electron");

let viteProcess;
let electronProcess;
let shuttingDown = false;

function stopProcess(child) {
  if (child && child.exitCode === null && !child.killed) child.kill();
}

function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  stopProcess(electronProcess);
  stopProcess(viteProcess);
  setTimeout(() => process.exit(exitCode), 150).unref();
}

function serverIsReady() {
  return new Promise((resolve) => {
    const request = http.get(devServerUrl, (response) => {
      response.resume();
      resolve(response.statusCode >= 200 && response.statusCode < 500);
    });
    request.setTimeout(500, () => request.destroy());
    request.on("error", () => resolve(false));
  });
}

async function waitForVite() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (viteProcess.exitCode !== null) throw new Error(`Vite stopped before Zenith loaded (exit ${viteProcess.exitCode}).`);
    if (await serverIsReady()) return;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error("Timed out waiting for the Zenith development server.");
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

async function start() {
  viteProcess = spawn(process.execPath, [viteEntry, "--host", "127.0.0.1", "--strictPort"], {
    cwd: appRoot,
    stdio: "inherit",
  });
  viteProcess.once("error", (error) => {
    console.error(`Could not start Vite: ${error.message}`);
    shutdown(1);
  });

  await waitForVite();
  viteProcess.once("exit", (code) => {
    if (!shuttingDown) {
      console.error(`Zenith's development server stopped (exit ${code ?? "unknown"}).`);
      shutdown(code ?? 1);
    }
  });

  const electronEnvironment = { ...process.env, VITE_DEV_SERVER_URL: devServerUrl };
  delete electronEnvironment.ELECTRON_RUN_AS_NODE;
  electronProcess = spawn(electronEntry, ["."], {
    cwd: appRoot,
    env: electronEnvironment,
    stdio: "inherit",
  });
  electronProcess.once("error", (error) => {
    console.error(`Could not start Electron: ${error.message}`);
    shutdown(1);
  });
  electronProcess.once("exit", (code) => shutdown(code ?? 0));
}

start().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  shutdown(1);
});
