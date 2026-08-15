# GitHub authentication setup

Zenith uses GitHub OAuth **Device Flow** for its desktop connection. GitHub's current authorization-code flow requires a client secret even when PKCE is enabled. A packaged Electron application cannot keep that secret confidential, so Zenith does not embed one and does not use a redirect callback or local OAuth server.

## Configure the OAuth app

1. In GitHub, open **Settings → Developer settings → OAuth Apps → New OAuth App**.
2. Give the app a name such as `Zenith Desktop` and set its homepage URL.
3. GitHub's form requires an authorization callback URL even though Device Flow does not use it. Set a clearly unused loopback URL such as `http://127.0.0.1/zenith-unused-callback`.
4. Open the created OAuth app's settings and enable **Device Flow**.
5. Copy the OAuth app's **Client ID**. Do not copy or package a client secret.

Set the client ID before starting Zenith:

```powershell
$env:GITHUB_CLIENT_ID="your_client_id"
npm.cmd run desktop:dev
```

Command Prompt equivalent:

```bat
set GITHUB_CLIENT_ID=your_client_id
npm run desktop:dev
```

After **Continue with GitHub**, Zenith requests a one-time device code, opens `https://github.com/login/device` in the system browser, and polls GitHub from the Electron main process. The device code is shown in the existing GitHub dialog. Denial, expiration, cancellation, and concurrent-flow errors leave Zenith signed out.

## Permission scope

Zenith requests the OAuth `repo` scope. GitHub OAuth Apps require `repo` for the Phase 2 features that list private repositories, create private repositories, and push private repository content. Zenith does not request email, organization administration, repository deletion, workflow, gist, or package scopes.

The OAuth `repo` scope is broader than ideal because GitHub OAuth Apps do not offer fine-grained repository permissions. A future production migration to a GitHub App would allow narrower, repository-selected permissions.

## Credential storage and Git transport

The access token stays in the Electron main process. It is encrypted with Electron `safeStorage` and the encrypted bytes are persisted under Electron's per-user `userData/auth` directory. Sign-in is refused if OS-backed encryption is unavailable. The token is never returned through preload, stored in localStorage, logged, written into `.git/config`, or embedded in a remote URL.

For an authenticated HTTPS clone or the initial publish push, Zenith supplies the token to Git through a temporary-process environment and a token-free askpass helper stored in `userData/auth`. The helper file contains no credential. SSH remotes continue to use the user's existing SSH agent and keys.
