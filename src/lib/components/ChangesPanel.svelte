<!--
SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>

SPDX-License-Identifier: GPL-2.0-only
-->

<script>
  import { store, doc_export, config_save, saved_names } from '../store.svelte.js'
  import { t } from '../i18n.svelte.js'

  let { changes, connected = false, applyError = null, onApply } = $props()

  let name = $state(store.loadedFrom && store.loadedFrom !== 'imported' ? store.loadedFrom : '')
  let savedNote = $state('')

  const existing = $derived(saved_names())
  const trimmed = $derived(name.trim())
  const overwrites = $derived(trimmed && existing.includes(trimmed))

  function download() {
    const host = store.doc?.unit?.hostname || 'uconfig'
    const blob = new Blob([doc_export()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${host}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function save() {
    if (!trimmed) return
    config_save(trimmed)
    savedNote = t('Saved as "{name}".', { name: trimmed })
  }
</script>

<div class="flex flex-col gap-5">
  <div>
    {#if changes.length}
      <p class="text-xs text-zinc-500">{t('{count, plural, one {# Change} other {# Changes}} since this configuration was loaded.', { count: changes.length })}</p>
      <ul class="mt-3 divide-y divide-zinc-100 rounded-md border border-zinc-200">
        {#each changes as c}
          <li class="flex items-center gap-2 px-3 py-1.5 text-xs">
            <span class="inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent"></span>
            <span class="text-zinc-700">{c.label}</span>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="text-xs text-zinc-500">{t('No changes since this configuration was loaded.')}</p>
    {/if}
  </div>

  {#if connected}
    <div>
      <button
        type="button"
        class="btn-primary w-full justify-center rounded-md px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!changes.length}
        onclick={onApply}
      >
        {t('Apply to device')}
      </button>
      {#if applyError}
        <p class="mt-1 text-[11px] text-red-600">{applyError}</p>
      {/if}
    </div>
  {:else}
    <div>
      <p class="mb-1 text-xs font-medium text-zinc-700">{t('Download')}</p>
      <button type="button" class="btn w-full justify-center" onclick={download}>{t('Download JSON')}</button>
    </div>

    {#if changes.length}
    <div>
      <p class="mb-1 text-xs font-medium text-zinc-700">{t('Save As')}</p>
      <div class="flex items-center gap-2">
        <input
          class="input"
          placeholder={t('configuration name')}
          autocomplete="off"
          autocapitalize="off"
          autocorrect="off"
          spellcheck="false"
          data-1p-ignore
          data-lpignore="true"
          bind:value={name}
          oninput={() => (savedNote = '')}
        />
        <button
          type="button"
          class="btn-primary rounded-md px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!trimmed}
          onclick={save}
        >
          {t('Save')}
        </button>
      </div>
      {#if overwrites && !savedNote}
        <p class="mt-1 text-[11px] text-amber-600">{t('Overwrites the saved configuration "{name}".', { name: trimmed })}</p>
      {/if}
      {#if savedNote}
        <p class="mt-1 text-[11px] text-emerald-600">{savedNote}</p>
      {/if}
    </div>
    {/if}
  {/if}
</div>
