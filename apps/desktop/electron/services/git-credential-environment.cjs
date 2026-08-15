const fs = require("node:fs/promises");
const path = require("node:path");

class GitCredentialEnvironment {
  constructor(directory) {
    this.directory = directory;
    this.helperPath = null;
  }

  async ensureHelper() {
    if (this.helperPath) return this.helperPath;
    await fs.mkdir(this.directory, { recursive: true });
    if (process.platform === "win32") {
      this.helperPath = path.join(this.directory, "zenith-git-askpass.cmd");
      const source = "@echo off\r\necho %~1 | %SystemRoot%\\System32\\findstr.exe /I \"username\" >nul\r\nif not errorlevel 1 (echo x-access-token& exit /b 0)\r\necho %ZENITH_GITHUB_TOKEN%\r\n";
      await fs.writeFile(this.helperPath, source, { mode: 0o700 });
    } else {
      this.helperPath = path.join(this.directory, "zenith-git-askpass.sh");
      const source = "#!/bin/sh\ncase \"$1\" in *sername*) printf '%s\\n' 'x-access-token' ;; *) printf '%s\\n' \"$ZENITH_GITHUB_TOKEN\" ;; esac\n";
      await fs.writeFile(this.helperPath, source, { mode: 0o700 });
      await fs.chmod(this.helperPath, 0o700);
    }
    return this.helperPath;
  }

  async forToken(token) {
    if (typeof token !== "string" || !token) return {};
    const helperPath = await this.ensureHelper();
    return {
      GIT_ASKPASS: helperPath,
      SSH_ASKPASS: helperPath,
      GIT_TERMINAL_PROMPT: "0",
      ZENITH_GITHUB_TOKEN: token,
    };
  }
}

module.exports = { GitCredentialEnvironment };
