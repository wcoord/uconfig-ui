<!--
SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>
SPDX-FileCopyrightText: 2026 Zach Mandeville <webmaster@coolguy.website>

SPDX-License-Identifier: GPL-2.0-only
-->

<script>
  import SchemaObject from './SchemaObject.svelte'
  import ListBox from './ListBox.svelte'
  import RemoveButton from './RemoveButton.svelte'
  import { title_for } from '../schema.js'
  import { confirm } from '../confirm.svelte.js'
  import { t } from '../i18n.svelte.js'

  let { container, mapKey, valueSchema, keyLabel = 'entry', context = {} } = $props()

  const map = $derived(container[mapKey] ?? {})
  const keys = $derived(Object.keys(map))

  let showModal = $state(false)
  let name = $state('')
  let draft = $state({})

  const trimmed = $derived(name.trim())
  const nameError = $derived(
    !trimmed ? t('Name is required') : map[trimmed] !== undefined ? t('Name already in use') : ''
  )

  function open() {
    name = ''
    draft = {}
    showModal = true
  }

  function commit() {
    if (nameError) return
    if (!container[mapKey] || typeof container[mapKey] !== 'object') container[mapKey] = {}
    container[mapKey][trimmed] = $state.snapshot(draft)
    showModal = false
  }

  async function remove(k) {
    if (!(await confirm(t('Remove {label} "{name}"?', { label: t(keyLabel), name: k })))) return
    delete container[mapKey][k]
    if (!Object.keys(container[mapKey]).length) delete container[mapKey]
  }

  function summary(v) {
    return Object.entries(v)
      .filter(([, x]) => x === null || typeof x !== 'object')
      .map(([, x]) => `${x}`)
      .join(' · ')
  }
</script>

<ListBox items={keys} label={title_for(mapKey)} onAdd={open}>
  {#snippet row(k)}
    <span class="flex-1 text-xs">
      <span class="font-mono font-semibold text-zinc-800">{k}</span>
      {#if summary(map[k])}<span class="text-zinc-500"> — {summary(map[k])}</span>{/if}
    </span>
    <RemoveButton onclick={() => remove(k)} />
  {/snippet}
</ListBox>

{#if showModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    onclick={() => (showModal = false)}
  >
    <div
      class="max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-lg border border-zinc-200 bg-surface p-4 shadow-lg"
      onclick={(e) => e.stopPropagation()}
    >
      <h3 class="mb-3 text-sm font-semibold">{t('Add {label}', { label: t(keyLabel) })}</h3>
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-1">
          <label for="ml-name" class="text-xs font-medium text-zinc-700">{t('Name')}</label>
          <input id="ml-name" class="input" bind:value={name} />
          {#if trimmed && nameError}
            <p class="text-[11px] text-amber-600">{nameError}</p>
          {/if}
        </div>
        <SchemaObject obj={draft} schema={valueSchema} />
      </div>
      <div class="mt-4 flex justify-end gap-2">
        <button type="button" class="btn-sm" onclick={() => (showModal = false)}>{t('Cancel')}</button>
        <button
          type="button"
          class="btn-sm disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!!nameError}
          onclick={commit}
        >
          {t('Add')}
        </button>
      </div>
    </div>
  </div>
{/if}
