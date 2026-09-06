<!--
SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>

SPDX-License-Identifier: GPL-2.0-only
-->

<script>
  import CollapsibleSection from './CollapsibleSection.svelte'
  import ListBox from './ListBox.svelte'
  import RemoveButton from './RemoveButton.svelte'
  import { port_cover, effective_tag } from '../ports.js'
  import { device_ports } from '../capabilities.svelte.js'
  import { confirm } from '../confirm.svelte.js'
  import { t } from '../i18n.svelte.js'

  let { iface, interfaces, selfName, role } = $props()

  const ports = $derived(iface.ports ?? {})
  const assigned = $derived(Object.keys(ports))
  const hasVlan = $derived(iface.vlan?.id != null)
  const portList = $derived(device_ports())

  let showModal = $state(false)
  let selPort = $state('')
  let selMode = $state('auto')

  const selfCovered = $derived(new Set(assigned.flatMap((k) => port_cover(k, portList))))

  function others_cover(p) {
    const tags = []
    for (const [n, iv] of Object.entries(interfaces)) {
      if (n === selfName) continue
      const ivVlan = iv?.vlan?.id != null
      for (const k of Object.keys(iv?.ports ?? {})) {
        if (port_cover(k, portList).includes(p)) tags.push(effective_tag(iv.ports[k], iv.role, ivVlan))
      }
    }
    return tags
  }
  function taken_untagged(p) {
    return others_cover(p).includes('un-tagged')
  }
  function used_elsewhere(p) {
    return others_cover(p).length > 0
  }

  const availablePorts = $derived(
    portList.filter((p) => {
      if (selfCovered.has(p)) return false
      return hasVlan ? !taken_untagged(p) : !used_elsewhere(p)
    })
  )

  const error = $derived(validate(selPort, selMode))

  function validate(port, mode) {
    if (!port) return t('Select a port')
    if (!hasVlan) return ''
    const e = effective_tag(mode, role, true)
    if (e === 'un-tagged' && used_elsewhere(port))
      return t('{port} is used by another interface; it can only be shared when tagged', { port })
    if (e === 'tagged' && taken_untagged(port)) return t('{port} is used untagged by another interface', { port })
    return ''
  }

  function open() {
    selPort = availablePorts[0] ?? ''
    selMode = 'auto'
    showModal = true
  }

  function commit() {
    if (error) return
    if (!iface.ports || typeof iface.ports !== 'object') iface.ports = {}
    iface.ports[selPort] = hasVlan ? selMode : 'auto'
    showModal = false
  }

  async function remove(port) {
    if (!(await confirm(t('Remove port "{port}"?', { port })))) return
    delete iface.ports[port]
    if (!Object.keys(iface.ports).length) delete iface.ports
  }
</script>

<CollapsibleSection title={t('Ports')}>
  {#snippet children()}
    <ListBox items={assigned} showAdd={availablePorts.length > 0} onAdd={open}>
      {#snippet row(port)}
        <span class="flex-1 text-xs">
          <span class="font-mono font-semibold text-zinc-800">{port}</span>
          <span class="text-zinc-500"> — {t(effective_tag(ports[port], role, hasVlan))}</span>
        </span>
        <RemoveButton onclick={() => remove(port)} />
      {/snippet}
    </ListBox>
  {/snippet}
</CollapsibleSection>

{#if showModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onclick={() => (showModal = false)}>
    <div class="w-full max-w-xs rounded-lg border border-zinc-200 bg-surface p-4 shadow-lg" onclick={(e) => e.stopPropagation()}>
      <h3 class="mb-3 text-sm font-semibold">{t('Add port')}</h3>
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label for="port-sel" class="text-xs font-medium text-zinc-700">{t('Port')}</label>
          <select id="port-sel" class="input" bind:value={selPort}>
            {#each availablePorts as p}
              <option value={p}>{p}</option>
            {/each}
          </select>
        </div>
        {#if hasVlan}
          <div class="flex flex-col gap-1">
            <label for="port-mode" class="text-xs font-medium text-zinc-700">{t('Tagging')}</label>
            <select id="port-mode" class="input" bind:value={selMode}>
              <option value="auto">{t('auto')} ({t(effective_tag('auto', role, true))})</option>
              <option value="tagged">{t('tagged')}</option>
              <option value="un-tagged">{t('un-tagged')}</option>
            </select>
          </div>
        {/if}
        {#if error}
          <p class="text-[11px] text-amber-600">{error}</p>
        {/if}
      </div>
      <div class="mt-4 flex justify-end gap-2">
        <button type="button" class="btn-sm" onclick={() => (showModal = false)}>{t('Cancel')}</button>
        <button type="button" class="btn-sm disabled:cursor-not-allowed disabled:opacity-50" disabled={!!error} onclick={commit}>
          {t('Add')}
        </button>
      </div>
    </div>
  </div>
{/if}
