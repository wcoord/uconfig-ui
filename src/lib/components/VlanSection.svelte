<!--
SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>

SPDX-License-Identifier: GPL-2.0-only
-->

<script>
  import CollapsibleSection from './CollapsibleSection.svelte'
  import ListBox from './ListBox.svelte'
  import RemoveButton from './RemoveButton.svelte'
  import { confirm } from '../confirm.svelte.js'
  import { t } from '../i18n.svelte.js'

  let { iface, interfaces, selfName, role } = $props()

  const vlan = $derived(iface.vlan ?? {})
  const isUpstream = $derived(role === 'upstream')
  const trunks = $derived(Array.isArray(vlan.trunks) ? vlan.trunks : [])

  // VLAN ids that a downstream interface relies on; these trunks can't be removed.
  const consumed = $derived(downstream_vlans())
  function downstream_vlans() {
    const s = new Set()
    for (const [n, iv] of Object.entries(interfaces)) {
      if (n === selfName) continue
      if (iv?.role === 'downstream' && iv?.vlan?.id != null) s.add(iv.vlan.id)
    }
    return s
  }

  let showModal = $state(false)
  let entry = $state('')
  const val = $derived(Number(entry))
  const error = $derived(validate())

  function validate() {
    if (entry === '') return t('A VLAN ID is required')
    if (!Number.isInteger(val) || val < 2 || val > 4096) return t('VLAN ID must be 2 to 4096')
    if (val === vlan.id) return t('Cannot trunk the interface VLAN')
    if (trunks.includes(val)) return t('Already a trunk')
    return ''
  }

  function open() {
    entry = ''
    showModal = true
  }
  function commit() {
    if (error) return
    if (!Array.isArray(iface.vlan.trunks)) iface.vlan.trunks = []
    iface.vlan.trunks.push(val)
    showModal = false
  }
  async function remove(tr) {
    if (consumed.has(tr)) return
    if (!(await confirm(t('Remove trunk {id}?', { id: tr })))) return
    const i = iface.vlan.trunks.indexOf(tr)
    if (i >= 0) iface.vlan.trunks.splice(i, 1)
    if (!iface.vlan.trunks.length) delete iface.vlan.trunks
  }
</script>

<CollapsibleSection title={t('VLAN')}>
  {#snippet children()}
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-1">
        <label for="vlan-id" class="text-xs font-medium text-zinc-700">{t('VLAN ID')}</label>
        <input id="vlan-id" class="input bg-zinc-100 text-zinc-600" value={vlan.id ?? ''} readonly />
      </div>

      {#if isUpstream}
        <ListBox items={trunks} label="Trunks" onAdd={open}>
          {#snippet row(tr)}
            <span class="flex-1 font-mono text-xs text-zinc-800">{tr}</span>
            {#if consumed.has(tr)}
              <span class="text-[11px] text-zinc-400">{t('in use downstream')}</span>
            {:else}
              <RemoveButton onclick={() => remove(tr)} />
            {/if}
          {/snippet}
        </ListBox>
      {/if}
    </div>
  {/snippet}
</CollapsibleSection>

{#if showModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onclick={() => (showModal = false)}>
    <div class="w-full max-w-xs rounded-lg border border-zinc-200 bg-surface p-4 shadow-lg" onclick={(e) => e.stopPropagation()}>
      <h3 class="mb-3 text-sm font-semibold">{t('Add trunk')}</h3>
      <input class="input" type="number" min="2" max="4096" bind:value={entry} placeholder={t('2 to 4096')} onkeydown={(e) => e.key === 'Enter' && commit()} />
      {#if entry !== '' && error}<p class="mt-1 text-[11px] text-amber-600">{error}</p>{/if}
      <div class="mt-4 flex justify-end gap-2">
        <button type="button" class="btn-sm" onclick={() => (showModal = false)}>{t('Cancel')}</button>
        <button type="button" class="btn-sm disabled:cursor-not-allowed disabled:opacity-50" disabled={!!error} onclick={commit}>{t('Add')}</button>
      </div>
    </div>
  </div>
{/if}
