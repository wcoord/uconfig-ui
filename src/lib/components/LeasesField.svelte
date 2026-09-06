<!--
SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>

SPDX-License-Identifier: GPL-2.0-only
-->

<script>
  import { confirm } from '../confirm.svelte.js'
  import ListBox from './ListBox.svelte'
  import RemoveButton from './RemoveButton.svelte'
  import { t } from '../i18n.svelte.js'

  let { container, subnet } = $props()

  const KEY = 'dhcp-leases'
  const leases = $derived(container[KEY] ?? {})
  const keys = $derived(Object.keys(leases))
  const prefix = $derived(prefix_of(subnet))
  const maxOffset = $derived(host_max(prefix))

  let showModal = $state(false)
  let name = $state('')
  let mac = $state('')
  let offset = $state('')
  let time = $state('6h')
  let publish = $state(true)

  const trimmed = $derived(name.trim())
  const nameError = $derived(
    !trimmed ? t('Name is required') : leases[trimmed] !== undefined ? t('Name already in use') : ''
  )
  const macError = $derived(
    !mac ? t('MAC is required') : !/^([0-9a-fA-F]{2}:){5}[0-9a-fA-F]{2}$/.test(mac) ? t('Invalid MAC address') : ''
  )
  const offNum = $derived(Number(offset))
  const offsetError = $derived(
    offset === ''
      ? t('Offset is required')
      : !Number.isInteger(offNum) || offNum < 1 || offNum > maxOffset
        ? t('Offset must be 1 to {max}', { max: maxOffset })
        : ''
  )
  const valid = $derived(!nameError && !macError && !offsetError)

  function prefix_of(s) {
    const m = String(s ?? '').match(/\/(\d+)\s*$/)
    return m ? Number(m[1]) : 24
  }
  function host_max(p) {
    const bits = 32 - p
    return bits < 2 ? 1 : Math.pow(2, bits) - 2
  }

  function open() {
    name = ''
    mac = ''
    offset = ''
    time = '6h'
    publish = true
    showModal = true
  }
  function commit() {
    if (!valid) return
    if (!container[KEY] || typeof container[KEY] !== 'object') container[KEY] = {}
    container[KEY][trimmed] = {
      macaddr: mac,
      'lease-offset': offNum,
      'lease-time': time,
      'publish-hostname': publish
    }
    showModal = false
  }
  async function remove(k) {
    if (!(await confirm(t('Remove lease "{name}"?', { name: k })))) return
    delete container[KEY][k]
    if (!Object.keys(container[KEY]).length) delete container[KEY]
  }
</script>

<ListBox items={keys} label="Static DHCP Leases" onAdd={open} emptyText="No static leases">
  {#snippet row(k)}
    <span class="flex-1 text-xs">
      <span class="font-mono font-semibold text-zinc-800">{k}</span>
      <span class="text-zinc-500"> — {leases[k].macaddr} · +{leases[k]['lease-offset']}</span>
    </span>
    <RemoveButton onclick={() => remove(k)} />
  {/snippet}
</ListBox>

{#if showModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onclick={() => (showModal = false)}>
    <div class="w-full max-w-xs rounded-lg border border-zinc-200 bg-surface p-4 shadow-lg" onclick={(e) => e.stopPropagation()}>
      <h3 class="mb-3 text-sm font-semibold">{t('Add static lease')}</h3>
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label for="lz-name" class="text-xs font-medium text-zinc-700">{t('Name')}</label>
          <input id="lz-name" class="input" bind:value={name} />
          {#if trimmed && nameError}<p class="text-[11px] text-amber-600">{nameError}</p>{/if}
        </div>
        <div class="flex flex-col gap-1">
          <label for="lz-mac" class="text-xs font-medium text-zinc-700">{t('MAC address')}</label>
          <input id="lz-mac" class="input font-mono" placeholder="aa:bb:cc:dd:ee:ff" bind:value={mac} />
          {#if mac && macError}<p class="text-[11px] text-amber-600">{macError}</p>{/if}
        </div>
        <div class="flex flex-col gap-1">
          <label for="lz-offset" class="text-xs font-medium text-zinc-700">{t('Lease offset')}</label>
          <input id="lz-offset" class="input" type="number" min="1" max={maxOffset} bind:value={offset} />
          <p class="text-[11px] text-zinc-500">{t('Host offset within the /{prefix} subnet (1 to {max}).', { prefix, max: maxOffset })}</p>
          {#if offset !== '' && offsetError}<p class="text-[11px] text-amber-600">{offsetError}</p>{/if}
        </div>
        <div class="flex flex-col gap-1">
          <label for="lz-time" class="text-xs font-medium text-zinc-700">{t('Lease time')}</label>
          <select id="lz-time" class="input" bind:value={time}>
            <option value="6h">6h</option>
            <option value="12h">12h</option>
            <option value="24h">24h</option>
          </select>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={publish}
            aria-label={t('Publish hostname')}
            onclick={() => (publish = !publish)}
            class="relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition {publish ? 'bg-emerald-500' : 'bg-zinc-300'}"
          >
            <span class="inline-block h-4 w-4 transform rounded-full bg-surface shadow transition {publish ? 'translate-x-4' : 'translate-x-0.5'}"></span>
          </button>
          <span class="text-xs font-medium text-zinc-700">{t('Publish hostname')}</span>
        </div>
      </div>
      <div class="mt-4 flex justify-end gap-2">
        <button type="button" class="btn-sm" onclick={() => (showModal = false)}>{t('Cancel')}</button>
        <button type="button" class="btn-sm disabled:cursor-not-allowed disabled:opacity-50" disabled={!valid} onclick={commit}>
          {t('Add')}
        </button>
      </div>
    </div>
  </div>
{/if}
