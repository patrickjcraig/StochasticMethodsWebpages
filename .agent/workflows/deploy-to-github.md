---
description: Deploy the Vite application to GitHub Pages using GitHub Actions
---

This workflow automates the deployment of the application to GitHub Pages.

1. Create the workflows directory
// turbo
if (!(Test-Path ".github/workflows")) { New-Item -ItemType Directory -Path ".github/workflows" -Force }

2. Create the deployment configuration file
Create a new file at `.github/workflows/deploy.yml` with the following content:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./build

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

3. Commit the new workflow file
// turbo
git add .github/workflows/deploy.yml; git commit -m "Add GitHub Pages deployment workflow"

4. Push the changes to GitHub
// turbo
git push origin main

5. Configure GitHub Pages
Go to your repository settings on GitHub:
- Settings > Pages
- Under "Build and deployment" > Source, select "GitHub Actions"
