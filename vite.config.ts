import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function resolvePagesBase(): string {
  const repositorySlug = process.env.GITHUB_REPOSITORY?.split('/')[1];

  // Local development or non-GitHub CI: use root
  if (!repositorySlug || process.env.GITHUB_ACTIONS !== 'true') {
    return '/';
  }

  // User/org .github.io repos deploy to root
  if (repositorySlug.endsWith('.github.io')) {
    return '/';
  }

  // Project repos deploy to /<repo-name>/
  return `/${repositorySlug}/`;
}

export default defineConfig({
  base: resolvePagesBase(),
  plugins: [react(), tailwindcss()],
});
