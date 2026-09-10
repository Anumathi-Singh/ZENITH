const fs = require("node:fs/promises");
const path = require("node:path");

function storageError(message, code = "SECURE_STORAGE_ERROR") {
  return Object.assign(new Error(message), { code });
}

class SecureTokenStore {
  constructor(filePath, encryption) {
    this.filePath = filePath;
    this.encryption = encryption;
  }

  isAvailable() {
    try {
      return Boolean(this.encryption?.isEncryptionAvailable());
    } catch {
      return false;
    }
  }

  requireEncryption() {
    if (!this.isAvailable()) {
      throw storageError("Secure operating-system credential encryption is unavailable.", "SECURE_STORAGE_UNAVAILABLE");
    }
  }

  async load() {
    this.requireEncryption();
    let encrypted;
    try {
      encrypted = await fs.readFile(this.filePath);
    } catch (error) {
      if (error?.code === "ENOENT") return null;
      throw storageError("Zenith could not read the encrypted GitHub credential.");
    }
    try {
      const parsed = JSON.parse(this.encryption.decryptString(encrypted));
      if (!parsed || typeof parsed.accessToken !== "string" || !parsed.accessToken) throw new Error("Invalid credential payload.");
      return parsed;
    } catch {
      throw storageError("The saved GitHub credential could not be decrypted.", "SECURE_STORAGE_CORRUPT");
    }
  }

  async save(credentials) {
    this.requireEncryption();
    if (!credentials || typeof credentials.accessToken !== "string" || !credentials.accessToken) {
      throw storageError("A valid GitHub credential is required.", "INVALID_CREDENTIAL");
    }
    const directory = path.dirname(this.filePath);
    const temporary = `${this.filePath}.${process.pid}.tmp`;
    try {
      await fs.mkdir(directory, { recursive: true });
      const encrypted = this.encryption.encryptString(JSON.stringify(credentials));
      await fs.writeFile(temporary, encrypted, { mode: 0o600 });
      await fs.rename(temporary, this.filePath);
    } catch (error) {
      try { await fs.rm(temporary, { force: true }); } catch { /* best-effort temporary cleanup */ }
      if (error?.code === "SECURE_STORAGE_UNAVAILABLE") throw error;
      throw storageError("Zenith could not securely save the GitHub credential.");
    }
  }

  async clear() {
    try {
      await fs.rm(this.filePath, { force: true });
    } catch {
      throw storageError("Zenith could not remove the saved GitHub credential.");
    }
  }
}

class SecureValueStore {
  constructor(filePath, encryption, label = "credential") {
    this.filePath = filePath;
    this.encryption = encryption;
    this.label = label;
  }

  isAvailable() {
    try { return Boolean(this.encryption?.isEncryptionAvailable()); }
    catch { return false; }
  }

  requireEncryption() {
    if (!this.isAvailable()) throw storageError("Secure operating-system credential encryption is unavailable.", "SECURE_STORAGE_UNAVAILABLE");
  }

  async load() {
    this.requireEncryption();
    try {
      const encrypted = await fs.readFile(this.filePath);
      const value = this.encryption.decryptString(encrypted);
      if (!value) throw new Error("Empty credential.");
      return value;
    } catch (error) {
      if (error?.code === "ENOENT") return null;
      throw storageError(`The saved ${this.label} could not be decrypted.`, "SECURE_STORAGE_CORRUPT");
    }
  }

  async save(value) {
    this.requireEncryption();
    if (typeof value !== "string" || !value) throw storageError(`A valid ${this.label} is required.`, "INVALID_CREDENTIAL");
    const directory = path.dirname(this.filePath);
    const temporary = `${this.filePath}.${process.pid}.tmp`;
    try {
      await fs.mkdir(directory, { recursive: true });
      await fs.writeFile(temporary, this.encryption.encryptString(value), { mode: 0o600 });
      await fs.rename(temporary, this.filePath);
    } catch (error) {
      try { await fs.rm(temporary, { force: true }); } catch { /* best-effort cleanup */ }
      if (error?.code === "SECURE_STORAGE_UNAVAILABLE") throw error;
      throw storageError(`Zenith could not securely save the ${this.label}.`);
    }
  }

  async clear() {
    try { await fs.rm(this.filePath, { force: true }); }
    catch { throw storageError(`Zenith could not remove the saved ${this.label}.`); }
  }
}

module.exports = { SecureTokenStore, SecureValueStore, storageError };
