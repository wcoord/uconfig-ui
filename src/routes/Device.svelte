<!--
SPDX-FileCopyrightText: 2026 Zach Mandeville <webmaster@coolguy.website>

SPDX-License-Identifier: GPL-2.0-only
-->

<script>
  import { push }         from 'svelte-spa-router'

  import { view }         from '../lib/view.svelte.js'
  import { capabilities } from '../lib/capabilities.svelte.js'
  import { t }            from '../lib/i18n.svelte.js'
  import { settings }     from '../lib/settings.svelte.js'
  import DeviceCards      from '../lib/components/DeviceCards.svelte';
  import NetworkPage      from '../lib/components/NetworkPage.svelte'
  import SystemPage       from '../lib/components/SystemPage.svelte'
  import StatePage        from '../lib/components/StatePage.svelte'


  let devicePage = $state('network') // 'network' | 'state' | 'system'
</script>

<header class="flex-shrink-0 border-b border-zinc-200 bg-surface/90 backdrop-blur">
  <div class="relative mx-auto max-w-5xl px-4 py-3 text-center">
    <h1 class="text-base font-semibold tracking-tight">{capabilities.data?.capabilities?.model ?? t('Device')}</h1>
    <p class="text-xs text-zinc-500">{settings.host}</p>
  </div>
</header>
{#if view.mode === 'cards'}
  <main class="flex-1 overflow-y-auto">
    <DeviceCards onConfigure={() => push('#/builder/') } />
  </main>
{:else}
  <div class="mx-auto flex w-full max-w-5xl flex-1 gap-4 overflow-hidden px-4">
    <aside class="w-44 flex-shrink-0 overflow-y-auto py-6">
      <nav class="flex h-full flex-col gap-1">
        <button
          type="button"
          class="rounded px-3 py-2 text-left text-sm font-medium transition {devicePage === 'network' ? 'bg-accent text-accent-ink' : 'text-zinc-700 hover:bg-zinc-200'}"
          onclick={() => (devicePage = 'network')}
          >{t('Network')}</button>
        <button
          type="button"
          class="rounded px-3 py-2 text-left text-sm font-medium transition {devicePage === 'state' ? 'bg-accent text-accent-ink' : 'text-zinc-700 hover:bg-zinc-200'}"
          onclick={() => (devicePage = 'state')}
          >{t('State')}</button>
        <button
          type="button"
          class="rounded px-3 py-2 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-200"
          onclick={() => push('#/builder/')}
          >{t('Configure')}</button>
        <button
          type="button"
          class="rounded px-3 py-2 text-left text-sm font-medium transition {devicePage === 'system' ? 'bg-accent text-accent-ink' : 'text-zinc-700 hover:bg-zinc-200'}"
          onclick={() => (devicePage = 'system')}
          >{t('System')}</button>
      </nav>
    </aside>
    <main class="flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto py-6">
      {#if devicePage === 'network'}
        <NetworkPage />
      {:else if devicePage === 'state'}
        <StatePage />
      {:else}
        <SystemPage />
      {/if}
    </main>
  </div>
{/if}