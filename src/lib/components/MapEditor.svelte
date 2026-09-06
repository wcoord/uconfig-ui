<!--
SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>

SPDX-License-Identifier: GPL-2.0-only
-->

<script>
  import Field from './Field.svelte'
  import { title_for } from '../schema.js'
  import { confirm } from '../confirm.svelte.js'
  import { view } from '../view.svelte.js'
  import { t } from '../i18n.svelte.js'
  import AddButton from './AddButton.svelte'
  import RemoveButton from './RemoveButton.svelte'

  let {
    parent,
    mapKey,
    valueSchema,
    keyLabel = 'name',
    tabbed = false,
    keyOptions = null,
    renamable = true,
    embedded = false,
    addModal = null,
    makeValue = null,
    item = null,
    tabCard = false,
    locked = false
  } = $props()

  const map = $derived(parent[mapKey] ?? {})
  const keys = $derived(Object.keys(map))
  const scalarValue = $derived(valueSchema && valueSchema.type && valueSchema.type !== 'object')
  const staticName = $derived(keyOptions != null || !renamable)

  let newKey = $state('')
  let showModal = $state(false)
  let active = $state(null)

  const available = $derived(keyOptions ? keyOptions.filter((o) => !keys.includes(o)) : null)

  $effect(() => {
    if (!keys.includes(active)) active = keys[0] ?? null
  })

  function ensure() {
    if (!parent[mapKey] || typeof parent[mapKey] !== 'object') parent[mapKey] = {}
  }

  function new_value(name) {
    if (makeValue) return makeValue(name)
    return scalarValue ? '' : {}
  }

  function add() {
    const name = newKey.trim()
    if (!name) return
    ensure()
    if (parent[mapKey][name] === undefined) parent[mapKey][name] = new_value(name)
    active = name
    newKey = ''
  }

  function add_named(name) {
    ensure()
    if (parent[mapKey][name] === undefined) parent[mapKey][name] = new_value(name)
    active = name
    showModal = false
  }

  function create(name, value) {
    ensure()
    if (parent[mapKey][name] === undefined) parent[mapKey][name] = value
    active = name
    showModal = false
  }

  async function remove(name) {
    if (!(await confirm(t('Remove {label} "{name}"?', { label: t(keyLabel), name })))) return
    delete parent[mapKey][name]
  }

  function rename(oldName, e) {
    const next = e.target.value.trim()
    if (!next || next === oldName) return
    const m = parent[mapKey]
    if (m[next] !== undefined) return
    const rebuilt = {}
    for (const [k, v] of Object.entries(m)) rebuilt[k === oldName ? next : k] = v
    parent[mapKey] = rebuilt
    if (active === oldName) active = next
  }
</script>

{#snippet body(name)}
  {#if scalarValue}
    <Field obj={map} key={name} schema={valueSchema} label="value" />
  {:else if item}
    {@render item(map[name], name)}
  {/if}
{/snippet}

{#snippet rename_input(name)}
  <input
    class="input max-w-[16rem] font-mono text-xs"
    value={name}
    aria-label={t('{label} key', { label: t(keyLabel) })}
    onchange={(e) => rename(name, e)}
  />
{/snippet}

{#snippet name_or_rename(name)}
  {#if staticName}
    <span class="font-mono text-xs font-semibold text-zinc-700">{name}</span>
  {:else}
    {@render rename_input(name)}
  {/if}
{/snippet}

{#snippet add_control(narrow)}
  {#if locked}
    <!-- entries are fixed (device-driven); no manual add -->
  {:else if keyOptions}
    {#if available.length}
      <AddButton onclick={() => (showModal = true)} />
    {/if}
  {:else if addModal}
    <AddButton onclick={() => (showModal = true)} />
  {:else}
    <input
      class="input {narrow ? 'max-w-[10rem]' : 'max-w-[16rem]'}"
      placeholder={t('new {label}…', { label: t(keyLabel) })}
      bind:value={newKey}
      onkeydown={(e) => e.key === 'Enter' && add()}
    />
    <AddButton onclick={add} />
  {/if}
{/snippet}

{#if tabbed}
  <div class="flex flex-col gap-3">
    <div class="flex flex-wrap items-center gap-1 {tabCard && view.mode === 'menu' ? 'rounded-lg border border-zinc-200 bg-surface p-3' : 'border-b border-zinc-200 pb-2'}">
      {#each keys as name (name)}
        <button
          type="button"
          class="rounded-t-md border-b-2 px-3 py-1.5 text-sm font-medium transition {active === name
            ? 'border-accent text-accent'
            : 'border-transparent text-zinc-500 hover:text-zinc-800'}"
          onclick={() => (active = name)}
        >
          {name}
        </button>
      {/each}
      {#if !keys.length}
        <span class="text-xs text-zinc-500">{t('No {label} yet.', { label: title_for(mapKey).toLowerCase() })}</span>
      {/if}
      <span class="flex-1"></span>
      {@render add_control(true)}
    </div>

    {#if active != null}
      {#if !staticName}
        <div class="border-b border-zinc-100 pb-3">{@render rename_input(active)}</div>
      {/if}
      <div class="py-3">{@render body(active)}</div>
      {#if !locked}
        <div class="flex justify-end border-t border-zinc-100 pt-3">
          <RemoveButton onclick={() => remove(active)} />
        </div>
      {/if}
    {/if}
  </div>
{:else if embedded}
  <div class="flex flex-col gap-3">
    {#each keys as name (name)}
      <div class="flex flex-col gap-3 border-b border-zinc-100 pb-3">
        <div class="flex items-center gap-2">
          {@render name_or_rename(name)}
          <span class="flex-1"></span>
          {#if !locked}<RemoveButton onclick={() => remove(name)} />{/if}
        </div>
        {@render body(name)}
      </div>
    {/each}
    <div class="flex items-center justify-end gap-2">{@render add_control(false)}</div>
  </div>
{:else}
  <div class="flex flex-col gap-3">
    <div class="flex items-center gap-2">
      <span class="flex-1 text-xs font-semibold uppercase tracking-wide text-zinc-600">
        {title_for(mapKey)}
      </span>
    </div>
    {#each keys as name (name)}
      <div class="rounded-md border border-zinc-200 bg-surface">
        <div class="flex items-center gap-2 border-b border-zinc-100 px-3 py-2">
          {@render name_or_rename(name)}
          <span class="flex-1"></span>
          {#if !locked}<RemoveButton onclick={() => remove(name)} />{/if}
        </div>
        <div class="px-3 py-3">{@render body(name)}</div>
      </div>
    {/each}
    <div class="flex items-center justify-end gap-2">{@render add_control(false)}</div>
  </div>
{/if}

{#if showModal && keyOptions && available}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onclick={() => (showModal = false)}>
    <div class="w-full max-w-xs rounded-lg border border-zinc-200 bg-surface p-4 shadow-lg" onclick={(e) => e.stopPropagation()}>
      <h3 class="mb-3 text-sm font-semibold">{t('Add {label}', { label: t(keyLabel) })}</h3>
      <div class="flex flex-col gap-2">
        {#each available as opt}
          <button type="button" class="btn justify-center" onclick={() => add_named(opt)}>{t(opt)}</button>
        {/each}
      </div>
      <div class="mt-3 text-right">
        <button type="button" class="btn-sm" onclick={() => (showModal = false)}>{t('Cancel')}</button>
      </div>
    </div>
  </div>
{/if}

{#if showModal && addModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onclick={() => (showModal = false)}>
    <div class="w-full max-w-sm rounded-lg border border-zinc-200 bg-surface p-4 shadow-lg" onclick={(e) => e.stopPropagation()}>
      {@render addModal({ create, close: () => (showModal = false), map })}
    </div>
  </div>
{/if}
