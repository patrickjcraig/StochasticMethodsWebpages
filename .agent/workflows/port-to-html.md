---
description: Build the React application to static HTML/CSS/JS files
---

This workflow builds the project for production, generating static assets in the `build` directory.

1. Install dependencies to ensure environment is ready
// turbo
npm install

2. Build the project to generate static HTML
// turbo
npm run build

3. List the build output to verify generation
dir build

4. (Optional) Run a local server to preview the static site
npx vite preview
