# Teammate Database

This project lists team members and now includes an authenticated admin experience backed by a lightweight Node + Express API.

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
   > If the default npm registry is restricted in your environment, configure your registry access before running the install.
2. Start the development server:
   ```bash
   npm run dev
   ```
   The server defaults to port `3000` and serves both the static frontend and the REST API.

### Working in GitHub Codespaces

If you are following the setup steps from a Codespace, you land in the repository root automatically.

1. In the built-in terminal, run `pwd`. It should print `/workspaces/Teammate-Database`. If it does not, move there with:
   ```bash
   cd /workspaces/Teammate-Database
   ```
2. Check that your Codespace has the latest files from GitHub:
   ```bash
   git status
   git pull --ff-only
   ```
   - If Git reports "Already up to date" you are good to go.
   - If it reports that you are behind, the `git pull --ff-only` command downloads the missing files such as `package.json`, `server.js`, and the admin frontend.
3. Confirm the correct folder by listing its contents:
   ```bash
   ls
   ```
   You should see both `package.json` **and** `package-lock.json` in the output.

   > **If you only see `package-lock.json`**: that means the Codespace was created from an older snapshot of the repository before the Node backend was added. Stay in the terminal and run:
   > ```bash
   > git fetch origin
   > git reset --hard origin/main
   > ```
   > This refreshes your working tree so every tracked file (including `package.json`, `server.js`, and the admin UI) matches the latest code on GitHub. If you have your own commits in the Codespace, stash or push them before running the hard reset.
4. Once both files are present, continue with `npm install` and the remaining steps in this guide.

### What the “Create PR” button does

In the GitHub web UI and the Codespaces source control sidebar you will see a **Create PR** button. Pressing it opens a GitHub Pull Request for the commits you have made in your branch so that they can be reviewed and merged. It does **not** download new files or update your Codespace on its own—you still need to run `git pull` to receive updates that someone else pushed.

## API

All endpoints are prefixed with `/api`.

- `GET /api/teammates` – returns all teammates.
- `POST /api/teammates` – create a teammate (admin token required).
- `PUT /api/teammates/:slug` – update a teammate (admin token required).
- `DELETE /api/teammates/:slug` – delete a teammate (admin token required).

Protected routes expect the `x-admin-token` header. By default, the token is the value of the `ADMIN_TOKEN` environment variable (falls back to `changeme`).

### Authentication helper

`POST /api/auth/login` accepts a JSON body with `{ "password": "..." }` or `{ "token": "..." }` and returns `{ "token": "..." }` when the credentials are valid.

## Admin portal

Navigate to `admin.html` and sign in with the admin token. The admin console supports creating, updating, and deleting teammates, including file uploads for profile photos and fields for the extended teammate schema:

- `location`
- `bio`
- `specialties`
- `certifications`
- `languages`
- `hireDate`
- `funFact`
- `socialHandles`

## Data storage

Teammates are stored in `data/teammates.json`. Use `npm run migrate` to regenerate the file from the legacy `data/team.json` format if needed.
