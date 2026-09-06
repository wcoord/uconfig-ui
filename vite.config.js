// SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>
// SPDX-FileCopyrightText: 2026 Zach Mandeville <webmaster@coolguy.website>
//
// SPDX-License-Identifier: GPL-2.0-only

import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import { execSync } from 'child_process';

const commitHash = execSync('git rev-parse --short HEAD').toString().trim();

export default defineConfig({
  plugins: [svelte(), tailwindcss()],
  define: {
    __COMMIT_HASH__: JSON.stringify(commitHash)
  },
  base: './',
  server: { host: true },
  preview: { host: true }
})
