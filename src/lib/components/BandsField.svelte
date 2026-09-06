<!--
SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>

SPDX-License-Identifier: GPL-2.0-only
-->

<script>
  import ListBox from './ListBox.svelte'
  import RemoveButton from './RemoveButton.svelte'
  import { t } from '../i18n.svelte.js'

  let { obj, context } = $props()

  const KEY = 'wifi-radios'
  const list = $derived(Array.isArray(obj[KEY]) ? obj[KEY] : [])
  const allBands = $derived(Object.keys(context?.radios ?? {}))
  const available = $derived(allBands.filter((b) => !list.includes(b)))

  let showModal = $state(false)
  let sel = $state('')

  function open() {
    sel = available[0] ?? ''
    showModal = true
  }
  function commit() {
    if (!sel) return
    if (!Array.isArray(obj[KEY])) obj[KEY] = []
    obj[KEY].push(sel)
    showModal = false
  }
  function remove(b) {
    obj[KEY].splice(obj[KEY].indexOf(b), 1)
    if (!obj[KEY].length) delete obj[KEY]
  }
</script>

<ListBox items={list} label="WiFi Radios" showAdd={available.length > 0} onAdd={open}>
  {#snippet row(b)}
    <span class="flex-1 font-mono text-xs font-semibold text-zinc-800">{b}</span>
    <RemoveButton onclick={() => remove(b)} />
  {/snippet}
</ListBox>

{#if showModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onclick={() => (showModal = false)}>
    <div class="w-full max-w-xs rounded-lg border border-zinc-200 bg-surface p-4 shadow-lg" onclick={(e) => e.stopPropagation()}>
      <h3 class="mb-3 text-sm font-semibold">{t('Add radio')}</h3>
      <select class="input" bind:value={sel}>
        {#each available as b}
          <option value={b}>{b}</option>
        {/each}
      </select>
      <div class="mt-4 flex justify-end gap-2">
        <button type="button" class="btn-sm" onclick={() => (showModal = false)}>{t('Cancel')}</button>
        <button type="button" class="btn-sm" onclick={commit}>{t('Add')}</button>
      </div>
    </div>
  </div>
{/if}
