const { spawn } = require("node:child_process");

class ProcessExecutionError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "ProcessExecutionError";
    this.code = details.code || "PROCESS_FAILED";
    this.exitCode = details.exitCode ?? null;
    this.stdout = details.stdout || "";
    this.stderr = details.stderr || "";
  }
}

function runProcess(executable, args, options = {}) {
  const timeoutMs = options.timeoutMs ?? 30_000;
  const maxOutputBytes = options.maxOutputBytes ?? 8 * 1024 * 1024;

  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    let settled = false;
    let timer;
    const signal = options.signal;
    const child = spawn(executable, args, {
      cwd: options.cwd,
      env: options.env || process.env,
      shell: false,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    const onAbort = () => {
      try { child.kill(); } catch { /* process has already exited */ }
      finish(() => reject(new ProcessExecutionError("Process was cancelled.", { code: "PROCESS_CANCELLED", stdout, stderr })));
    };

    const finish = (callback) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      callback();
    };

    const append = (current, chunk) => {
      const next = current + chunk.toString("utf8");
      if (Buffer.byteLength(next, "utf8") > maxOutputBytes) {
        try { child.kill(); } catch { /* process has already exited */ }
        finish(() => reject(new ProcessExecutionError("Process output exceeded the allowed limit.", { code: "PROCESS_OUTPUT_LIMIT", stdout, stderr })));
        return current;
      }
      return next;
    };

    child.stdout.on("data", (chunk) => { stdout = append(stdout, chunk); options.onStdout?.(chunk.toString("utf8")); });
    child.stderr.on("data", (chunk) => { stderr = append(stderr, chunk); options.onStderr?.(chunk.toString("utf8")); });
    child.on("error", (error) => finish(() => reject(new ProcessExecutionError(error.message, { code: error.code === "ENOENT" ? "EXECUTABLE_NOT_FOUND" : "PROCESS_START_FAILED", stdout, stderr }))));
    child.on("close", (exitCode, signal) => finish(() => resolve({ exitCode: exitCode ?? -1, signal, stdout, stderr })));

    timer = setTimeout(() => {
      try { child.kill(); } catch { /* process has already exited */ }
      finish(() => reject(new ProcessExecutionError(`Process timed out after ${timeoutMs}ms.`, { code: "PROCESS_TIMEOUT", stdout, stderr })));
    }, timeoutMs);
    if (signal?.aborted) onAbort();
    else signal?.addEventListener("abort", onAbort, { once: true });
  });
}

module.exports = { ProcessExecutionError, runProcess };
