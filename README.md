# Interactive Cyberattack Simulation

This is a code bundle for Interactive Cyberattack Simulation. The original project is available at https://www.figma.com/design/5Gb0LlP5BPuuzoSnVKyJdl/Interactive-Cyberattack-Simulation.

## Running the code

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.

# Developers Guide

This guide explains how to develop, extend, and build the Stochastic Methods Webpages project.

## Project Structure

The project is a React application built with Vite and Tailwind CSS.
- `src/App.tsx`: The main entry point handling routing and navigation.
- `src/components/`: Contains all page components and logic.
- `src/components/ui/`: Reusable UI components (buttons, sliders, etc.).

## How to Add a New Page

To add a new page (e.g., a new calculator or simulation), follow these steps:

### 1. Create the Component
Create a new `.tsx` file in `src/components/`. For example, `NewMethodCalculator.tsx`.

```tsx
import React from 'react';

export const NewMethodCalculator = () => {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <h2 className="text-2xl mb-4">New Method Calculator</h2>
      {/* Your content here */}
    </div>
  );
};
```

### 2. Register the Page in `App.tsx`

Open `src/App.tsx` and make the following changes:

**A. Update `PageType` definition**
Add your new page identifier to the `PageType` union type.
```typescript
type PageType = 'honeypot' | ... | 'new-method';
```

**B. Add to Navigation**
Add a new entry to the `navButtons` array. You'll need an icon from `lucide-react`.
```typescript
import { NewIcon } from 'lucide-react';

// ...

const navButtons = [
  // ... existing buttons
  { id: 'new-method' as const, label: 'New Method', icon: NewIcon },
];
```

**C. Add Conditional Rendering**
Add a conditional block to render your component when the page is selected. Place this before the final `return` statement.
```typescript
if (currentPage === 'new-method') {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {renderNavigation()}
        <NewMethodCalculator />
      </div>
    </div>
  );
}
```

## How to Make Edits

### Editing Existing Pages
1. Navigate to `src/components/`.
2. Find the component corresponding to the page (e.g., `BlackjackCalculator.tsx`).
3. Make your changes. The dev server (`npm run dev`) will HMR (Hot Module Replacement) automatically.

### Styling
This project uses Tailwind CSS. You can add utility classes directly to JSX elements.
- Global styles are in `src/index.css`.
- Theme colors rely heavily on `slate` (e.g., `bg-slate-800`, `text-slate-300`).

## Building for Production

To create a static production build:

```bash
npm run build
```

This generates a `build/` folder containing the optimized HTML, CSS, and JS files. These files can be deployed to any static hosting service.

## Deploying to GitHub Pages

This site is deployed using GitHub Pages. As a collaborator, follow these steps to redeploy the site:

### Step 1: Build the Project
Run the build command to generate the production files:
```bash
npm run build
```

This creates optimized files in the `build/` directory.

### Step 2: Commit and Push Changes
After building, commit all changes including the `build/` directory:
```bash
git add .
git commit -m "Deploy: Update site with latest changes"
git push origin main
```

### Step 3: Verify Deployment
GitHub Pages automatically serves the site from the repository. The site should be live at:
- https://patrickjcraig.github.io/probabilityplayground.github.io/

Changes may take a few minutes to appear. If the site doesn't update:
1. Check the repository settings under Settings > Pages to ensure GitHub Pages is enabled
2. Verify the source is set to deploy from the `main` branch (root or `/build` directory)
3. Check for any GitHub Actions workflows that might need to complete

### Quick Redeploy
For quick redeployments:
```bash
npm run build && git add . && git commit -m "Redeploy site" && git push
```

## Troubleshooting & Redeployment

If the site is not working or needs to be redeployed if something is broken:

### 1. Clean Re-install
Sometimes dependencies get out of sync or corrupted.
```bash
# Windows
rd /s /q node_modules
del package-lock.json
npm install
```

### 2. Force Rebuild
If changes aren't showing up, ensure you've rebuilt the project from scratch.
```bash
rd /s /q build
npm run build
```

### 3. Preview Locally
Before deploying, verify the built assets work locally to rule out server issues.
```bash
npx vite preview
```

### 4. Verify Build Output
Check the `build/` directory. It should contain an `index.html` and an `assets/` folder. Ensure these files are the ones you are uploading to your host.