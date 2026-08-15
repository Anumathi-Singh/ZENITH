const fsp = require("node:fs/promises");

const BINARY_EXTENSIONS = new Set(["7z", "avi", "bin", "bmp", "class", "dll", "doc", "docx", "eot", "exe", "gif", "gz", "ico", "jar", "jpeg", "jpg", "mov", "mp3", "mp4", "pdf", "png", "ppt", "pptx", "so", "tar", "ttf", "webm", "webp", "woff", "woff2", "xls", "xlsx", "zip"]);
const MAX_TEXT_BYTES = 2 * 1024 * 1024;
function searchError(message, code = "SEARCH_ERROR") { return Object.assign(new Error(message), { code }); }
function patterns(value) { return (Array.isArray(value) ? value : String(value || "").split(",")).map((item) => item.trim().replace(/\\/g, "/")).filter(Boolean); }
function globRegex(glob) {
  let expression = "";
  for (let index = 0; index < glob.length; index += 1) {
    const character = glob[index];
    if (character === "*" && glob[index + 1] === "*") { expression += ".*"; index += 1; }
    else if (character === "*") expression += "[^/]*";
    else if (character === "?") expression += "[^/]";
    else expression += character.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
  }
  return new RegExp(glob.includes("/") ? `^${expression}$` : `(?:^|/)${expression}$`, "i");
}
function matchesFilters(relativePath, include, exclude) {
  const includes = patterns(include).map(globRegex); const excludes = patterns(exclude).map(globRegex);
  return (!includes.length || includes.some((matcher) => matcher.test(relativePath))) && !excludes.some((matcher) => matcher.test(relativePath));
}
function wordCharacter(value) { return Boolean(value && /[\p{L}\p{N}_]/u.test(value)); }
function wholeWordAt(line, start, end) { return !wordCharacter(line[start - 1]) && !wordCharacter(line[end]); }
function lineMatches(line, options) {
  const found = [];
  if (options.regex) {
    let matcher;
    try { matcher = new RegExp(options.query, options.caseSensitive ? "g" : "gi"); }
    catch { throw searchError("Enter a valid regular expression.", "INVALID_SEARCH_PATTERN"); }
    let match;
    while ((match = matcher.exec(line))) {
      const end = match.index + match[0].length;
      if ((!options.wholeWord || wholeWordAt(line, match.index, end)) && match[0].length) found.push({ start: match.index, end });
      if (!match[0].length) matcher.lastIndex += 1;
    }
  } else {
    const source = options.caseSensitive ? line : line.toLowerCase();
    const needle = options.caseSensitive ? options.query : options.query.toLowerCase();
    let cursor = 0;
    while (needle && (cursor = source.indexOf(needle, cursor)) >= 0) {
      const end = cursor + needle.length;
      if (!options.wholeWord || wholeWordAt(line, cursor, end)) found.push({ start: cursor, end });
      cursor = Math.max(end, cursor + 1);
    }
  }
  return found;
}
function previewLine(line, ranges) {
  const maximum = 320;
  if (line.length <= maximum) return { preview: line, matches: ranges };
  const offset = Math.max(0, Math.min(ranges[0].start - 80, line.length - maximum));
  return { preview: `${offset ? "…" : ""}${line.slice(offset, offset + maximum)}${offset + maximum < line.length ? "…" : ""}`, matches: ranges.filter((range) => range.end >= offset && range.start <= offset + maximum).map((range) => ({ start: range.start - offset + (offset ? 1 : 0), end: range.end - offset + (offset ? 1 : 0) })) };
}

class SearchService {
  constructor(index, options = {}) { this.index = index; this.active = new Map(); this.onProgress = options.onProgress || (() => {}); }
  begin(searchId) { const id = String(searchId || "").trim(); if (!id) throw searchError("A search ID is required.", "INVALID_SEARCH"); this.cancel(id); const controller = new AbortController(); this.active.set(id, controller); return { id, controller }; }
  finish(id, controller) { if (this.active.get(id) === controller) this.active.delete(id); }
  cancel(searchId) { const controller = this.active.get(searchId); if (!controller) return false; controller.abort(); this.active.delete(searchId); return true; }
  dispose() { for (const id of [...this.active.keys()]) this.cancel(id); }
  async files(options = {}) {
    const { id, controller } = this.begin(options.searchId);
    try { if (controller.signal.aborted) throw searchError("Search cancelled.", "SEARCH_CANCELLED"); return this.index.findFiles(options.query, { limit: options.limit }); }
    finally { this.finish(id, controller); }
  }
  async text(options = {}) {
    const query = String(options.query || "");
    if (!query) return [];
    if (options.regex) { try { new RegExp(query); } catch { throw searchError("Enter a valid regular expression.", "INVALID_SEARCH_PATTERN"); } }
    const { id, controller } = this.begin(options.searchId);
    const files = this.index.listFiles().filter((file) => !BINARY_EXTENSIONS.has(file.extension) && matchesFilters(file.relativePath, options.include, options.exclude));
    if (!this.index.getState().rootPath) { this.finish(id, controller); throw searchError("Open a folder to search files.", "NO_WORKSPACE"); }
    const maximum = Math.min(Math.max(Number(options.limit) || 500, 1), 2000);
    const results = []; let cursor = 0; let processed = 0;
    const worker = async () => {
      while (!controller.signal.aborted && results.length < maximum) {
        const file = files[cursor++]; if (!file) return;
        try {
          const info = await fsp.stat(file.path); if (!info.isFile() || info.size > MAX_TEXT_BYTES) continue;
          const buffer = await fsp.readFile(file.path); if (buffer.subarray(0, 8192).includes(0)) continue;
          const lines = buffer.toString("utf8").split(/\r?\n/);
          for (let lineIndex = 0; lineIndex < lines.length && results.length < maximum; lineIndex += 1) {
            if (controller.signal.aborted) break;
            const ranges = lineMatches(lines[lineIndex], { query, caseSensitive: Boolean(options.caseSensitive), wholeWord: Boolean(options.wholeWord), regex: Boolean(options.regex) });
            if (!ranges.length) continue;
            const shown = previewLine(lines[lineIndex], ranges);
            results.push({ path: file.path, relativePath: file.relativePath, line: lineIndex + 1, column: ranges[0].start + 1, preview: shown.preview, matches: shown.matches });
          }
        } catch (error) { if (!["EACCES", "EPERM", "ENOENT"].includes(error?.code)) throw error; }
        finally { processed += 1; if (processed % 40 === 0 || processed === files.length) this.onProgress({ searchId: id, processedFiles: processed, totalFiles: files.length }); }
      }
    };
    try {
      await Promise.all(Array.from({ length: Math.min(6, Math.max(files.length, 1)) }, worker)).catch((error) => { controller.abort(); throw error; });
      if (controller.signal.aborted) throw searchError("Search cancelled.", "SEARCH_CANCELLED");
      return results.sort((left, right) => left.relativePath.localeCompare(right.relativePath) || left.line - right.line);
    } finally { this.finish(id, controller); }
  }
}

module.exports = { BINARY_EXTENSIONS, MAX_TEXT_BYTES, SearchService, globRegex, lineMatches, matchesFilters, searchError };
