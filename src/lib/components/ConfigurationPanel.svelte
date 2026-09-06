<!--
SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>

SPDX-License-Identifier: GPL-2.0-only
-->

<script>
  import CollapsibleSection from './CollapsibleSection.svelte'
  import ChangesPanel from './ChangesPanel.svelte'
  import Spinner from './Spinner.svelte'
  import { accordion_provide } from '../accordion.svelte.js'
  import { t } from '../i18n.svelte.js'
  import { doc_export, baseline_reset } from '../store.svelte.js'
  import { connection, request as ws_request } from '../connection.svelte.js'
  import { view } from '../view.svelte.js'

  let { changes, preview } = $props()

  accordion_provide(true)

  const connected = $derived(connection.status === 'connected')
  // In menu view the Configuration section has no surrounding Card, so the
  // status states supply their own card chrome (cards view already wraps them).
  const panelClass = $derived(view.mode === 'menu' ? 'rounded-lg border border-zinc-200 bg-surface px-4' : '')

  let applyState = $state('idle') // 'idle' | 'applying' | 'success' | 'error'
  let applyError = $state(null)

  async function apply() {
    applyState = 'applying'
    applyError = null
    try {
      await ws_request('config-apply', { config: JSON.parse(doc_export()) })
      baseline_reset()
      applyState = 'success'
    } catch (e) {
      applyError = e?.message || String(e)
      applyState = 'idle'
    }
  }

  function apply_done() {
    applyState = 'idle'
  }
</script>

{#if applyState === 'applying'}
  <div class="flex flex-col items-center gap-3 py-10 text-sm text-zinc-500 {panelClass}">
    <Spinner class="h-6 w-6 text-zinc-400" />
    <span>{t('Applying configuration to the device…')}</span>
  </div>
{:else if applyState === 'success'}
  <div class="flex flex-col items-center gap-3 py-10 text-center {panelClass}">
    <svg class="h-8 w-8 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
    <p class="text-sm font-medium text-zinc-700">{t('Configuration applied to the device.')}</p>
    <button type="button" class="btn" onclick={apply_done}>{t('Done')}</button>
  </div>
{:else}
  <div class="flex flex-col gap-4">
    <CollapsibleSection title={t('Changes')}>
      {#snippet children()}<ChangesPanel {changes} {connected} {applyError} onApply={apply} />{/snippet}
    </CollapsibleSection>
    <CollapsibleSection title={t('JSON')}>
      {#snippet children()}
        <pre class="overflow-x-auto text-xs leading-relaxed text-zinc-700">{preview}</pre>
      {/snippet}
    </CollapsibleSection>
  </div>
{/if}
