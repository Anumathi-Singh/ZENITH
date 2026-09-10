function structuredError(message) { return Object.assign(new Error(message), { code: "AI_INVALID_STRUCTURED_OUTPUT" }); }
function parseStructured(text, validate) {
  let value;
  try { value = JSON.parse(String(text || "")); }
  catch { throw structuredError("The AI provider returned malformed structured output."); }
  if (validate && !validate(value)) throw structuredError("The AI provider returned an invalid structured result.");
  return value;
}
function stringArray(value, maximum = 20) { return Array.isArray(value) && value.length <= maximum && value.every((item) => typeof item === "string" && item.length <= 2000); }
function validatePlan(value) { return Boolean(value && typeof value.summary === "string" && stringArray(value.steps, 12) && stringArray(value.relevantFiles, 20) && stringArray(value.searchTerms, 12)); }
function validateCode(value) { return Boolean(value && typeof value.summary === "string" && Array.isArray(value.edits) && value.edits.length <= 20 && value.edits.every((edit) => edit && ["modify", "create"].includes(edit.operation) && typeof edit.path === "string" && typeof edit.content === "string" && edit.content.length <= 500_000 && typeof edit.reason === "string")); }
function validateReview(value) { return Boolean(value && typeof value.approved === "boolean" && typeof value.summary === "string" && stringArray(value.issues, 20)); }
function validateTests(value) { return Boolean(value && stringArray(value.commandIds, 10) && typeof value.summary === "string"); }
function validateDocs(value) { return Boolean(value && typeof value.needed === "boolean" && typeof value.summary === "string"); }
module.exports = { parseStructured, stringArray, structuredError, validateCode, validateDocs, validatePlan, validateReview, validateTests };
