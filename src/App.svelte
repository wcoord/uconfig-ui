<!--
SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>
SPDX-FileCopyrightText: 2026 Zach Mandeville <webmaster@coolguy.website>

SPDX-License-Identifier: GPL-2.0-only
-->

<script>
  import ConfirmModal from './lib/components/ConfirmModal.svelte'
  import Router from 'svelte-spa-router';

  import Welcome from './routes/Welcome.svelte'
  import Login from './routes/Login.svelte'
  import Builder from './routes/Builder.svelte'
  import Device from './routes/Device.svelte'

  import AppMenu from './lib/components/AppMenu.svelte'

  import { view } from './lib/view.svelte.js'
  import { accordion_provide } from './lib/accordion.svelte.js'

  // Top-level cards (cards view) act as a single accordion.
  accordion_provide()


  // Menu (sidebar) layout on desktop, stacked cards on mobile.
  const wideMql = globalThis.matchMedia?.('(min-width: 768px)')
  let wide = $state(wideMql?.matches ?? true)
  wideMql?.addEventListener?.('change', (e) => (wide = e.matches))
  $effect(() => {
    view.mode = wide ? 'menu' : 'cards'
  })

  const routes = {
    '/welcome': Welcome,
    '/login': Login,
    '/builder': Builder,
    '/device': Device,
    '/': Welcome
  }
</script>


<div class="flex h-screen flex-col bg-zinc-100 text-zinc-900">
  <AppMenu />
  <Router {routes} />
  <ConfirmModal />
  <footer class='text-zinc-700 p-2 text-center text-xs italic'>
    <p>built from commit <span class='font-mono'>{__COMMIT_HASH__}</span></p>
  </footer>
</div>
