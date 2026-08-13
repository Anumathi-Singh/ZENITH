function backendOk(data) {
  return { ok: true, data };
}

function backendError(error, fallbackCode = "BACKEND_ERROR") {
  const code = typeof error?.code === "string" ? error.code : fallbackCode;
  const message = error instanceof Error ? error.message : String(error || "The operation failed.");
  return { ok: false, error: { code, message } };
}

async function asBackendResult(operation, fallbackCode) {
  try {
    return backendOk(await operation());
  } catch (error) {
    return backendError(error, fallbackCode);
  }
}

module.exports = { asBackendResult, backendError, backendOk };
