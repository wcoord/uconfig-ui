<!--
SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>
SPDX-FileCopyrightText: 2026 Zach Mandeville <webmaster@coolguy.website>

SPDX-License-Identifier: GPL-2.0-only
-->

<script>
  import ListBox from './ListBox.svelte'
  import RemoveButton from './RemoveButton.svelte'
  import { title_for } from '../schema.js'
  import { t } from '../i18n.svelte.js'

  let { obj, key, schema, label = null, describe = null } = $props()

  const lbl = $derived(t(label ?? title_for(key)))
  const desc = $derived(t((describe ?? '').replace(/\s+/g, ' ').trim(), { value: obj[key] }))
  const numeric = $derived(/number|integer/.test(schema.items?.type ?? ''))
  const cidr4 = $derived(schema.items?.format === 'uc-cidr4')
  const mac = $derived(schema.items?.format === 'uc-mac')
  const items = $derived(Array.isArray(obj[key]) ? obj[key] : [])
  const min = $derived(schema.items?.minimum)
  const max = $derived(schema.items?.maximum)

  let showModal = $state(false)
  let entry = $state('')

  const value = $derived(numeric ? Number(entry) : entry.trim())
  const error = $derived(validate())

  function validate() {
    if (entry === '' || entry == null) return t('A value is required')
    if (numeric) {
      if (!Number.isInteger(value)) return t('Must be a whole number')
      if (min != null && value < min) return t('Must be at least {min}', { min })
      if (max != null && value > max) return t('Must be at most {max}', { max })
    }
    if (cidr4 && !/^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/.test(entry.trim())) {
      return t('Must be a CIDR, e.g. 192.168.0.0/16')
    }
    if (mac && !/^([0-9a-fA-F]{2}:){5}[0-9a-fA-F]{2}$/.test(entry.trim())) {
      return t('Must be a MAC, e.g. aa:bb:cc:dd:ee:ff')
    }
    if (items.includes(value)) return t('Already in the list')
    return ''
  }

  function open() {
    entry = ''
    showModal = true
  }

  function commit() {
    if (error) return
    if (!Array.isArray(obj[key])) obj[key] = []
    obj[key].push(value)
    showModal = false
  }

  function removeAt(i) {
    obj[key].splice(i, 1)
    if (obj[key].length === 0) delete obj[key]
  }
</script>

<div class="flex flex-col gap-1">
  <ListBox {items} label={lbl} onAdd={open}>
    {#snippet row(item, i)}
      <span class="flex-1 font-mono text-xs text-zinc-800">{item}</span>
      <RemoveButton onclick={() => removeAt(i)} />
    {/snippet}
  </ListBox>
  {#if desc}
    <p class="text-[11px] leading-snug text-zinc-500">{desc}</p>
  {/if}
</div>

{#if showModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    onclick={() => (showModal = false)}
  >
    <div
      class="w-full max-w-xs rounded-lg border border-zinc-200 bg-surface p-4 shadow-lg"
      onclick={(e) => e.stopPropagation()}
    >
      <h3 class="mb-3 text-sm font-semibold">{t('Add')} {lbl.replace(/s$/, '')}</h3>
      <input
        class="input"
        type={numeric ? 'number' : 'text'}
        min={min}
        max={max}
        bind:value={entry}
        onkeydown={(e) => e.key === 'Enter' && commit()}
      />
      {#if entry !== '' && error}
        <p class="mt-1 text-[11px] text-amber-600">{error}</p>
      {/if}
      <div class="mt-4 flex justify-end gap-2">
        <button type="button" class="btn-sm" onclick={() => (showModal = false)}>{t('Cancel')}</button>
        <button
          type="button"
          class="btn-sm disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!!error}
          onclick={commit}
        >
          {t('Add')}
        </button>
      </div>
    </div>
  </div>
{/if}
