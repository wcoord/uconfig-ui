<!--
SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>

SPDX-License-Identifier: GPL-2.0-only
-->

<script>
  // Mobile (cards) layout of the device top-level menu: collapsible cards for
  // the pages, mirroring the builder's cards view. Its own accordion group so
  // only one page is expanded at a time.
  import Card from './Card.svelte'
  import NetworkPage from './NetworkPage.svelte'
  import StatePage from './StatePage.svelte'
  import SystemPage from './SystemPage.svelte'
  import Spinner from './Spinner.svelte'
  import { deviceStore } from '../devices.svelte.js'
  import { accordion_provide } from '../accordion.svelte.js'
  import { t } from '../i18n.svelte.js'

  let { onConfigure } = $props()

  accordion_provide(true)
</script>

<div class="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-6">
  <Card title={t('Network')} open>
    {#snippet actions()}
      {#if deviceStore.loading}<Spinner class="h-4 w-4 text-zinc-400" />{/if}
    {/snippet}
    {#snippet children()}<NetworkPage />{/snippet}
  </Card>
  <Card title={t('State')}>
    {#snippet children()}<StatePage />{/snippet}
  </Card>
  <button
    type="button"
    class="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-surface px-4 py-3 text-left text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
    onclick={onConfigure}
  >
    <span>{t('Configure')}</span>
    <svg class="h-4 w-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  </button>
  <Card title={t('System')}>
    {#snippet children()}<SystemPage />{/snippet}
  </Card>
</div>
