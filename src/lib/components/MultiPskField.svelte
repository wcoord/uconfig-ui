<!--
SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>

SPDX-License-Identifier: GPL-2.0-only
-->

<script>
  import ListBox from './ListBox.svelte'
  import RemoveButton from './RemoveButton.svelte'
  import { confirm } from '../confirm.svelte.js'
  import { t } from '../i18n.svelte.js'

  let { obj } = $props()

  const KEY = 'multi-psk'
  const map = $derived(obj[KEY] ?? {})
  const keys = $derived(Object.keys(map))

  let showModal = $state(false)
  let psk = $state('')
  let mac = $state('')

  const pskError = $derived(
    !psk ? t('PSK is required') : psk.length < 8 || psk.length > 63 ? t('PSK must be 8 to 63 characters') : ''
  )
  const macError = $derived(
    mac && !/^([0-9a-fA-F]{2}:){5}[0-9a-fA-F]{2}$/.test(mac) ? t('Invalid MAC address') : ''
  )
  const valid = $derived(!pskError && !macError)

  function next_name() {
    let n = 1
    while (map['psk' + n] !== undefined) n++
    return 'psk' + n
  }

  function open() {
    psk = ''
    mac = ''
    showModal = true
  }
  function commit() {
    if (!valid) return
    if (!obj[KEY] || typeof obj[KEY] !== 'object') obj[KEY] = {}
    const entry = { key: psk }
    if (mac) entry.mac = [mac]
    obj[KEY][next_name()] = entry
    showModal = false
  }
  async function remove(k) {
    if (!(await confirm(t('Remove PSK "{name}"?', { name: k })))) return
    delete obj[KEY][k]
    if (!Object.keys(obj[KEY]).length) delete obj[KEY]
  }
</script>

<ListBox items={keys} label="Multi-PSK" onAdd={open}>
  {#snippet row(k)}
    <span class="flex-1 text-xs">
      <span class="font-mono font-semibold text-zinc-800">{k}</span>
      <span class="text-zinc-500"> — {map[k].mac?.length ? map[k].mac.join(', ') : t('any MAC')}</span>
    </span>
    <RemoveButton onclick={() => remove(k)} />
  {/snippet}
</ListBox>

{#if showModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onclick={() => (showModal = false)}>
    <div class="w-full max-w-xs rounded-lg border border-zinc-200 bg-surface p-4 shadow-lg" onclick={(e) => e.stopPropagation()}>
      <h3 class="mb-3 text-sm font-semibold">{t('Add PSK')}</h3>
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label for="mp-psk" class="text-xs font-medium text-zinc-700">{t('PSK')}</label>
          <input id="mp-psk" class="input" maxlength="63" bind:value={psk} />
          {#if psk && pskError}<p class="text-[11px] text-amber-600">{pskError}</p>{/if}
        </div>
        <div class="flex flex-col gap-1">
          <label for="mp-mac" class="text-xs font-medium text-zinc-700">{t('MAC address')} <span class="font-normal text-zinc-400">{t('(optional)')}</span></label>
          <input id="mp-mac" class="input font-mono" placeholder="aa:bb:cc:dd:ee:ff" bind:value={mac} />
          {#if mac && macError}<p class="text-[11px] text-amber-600">{macError}</p>{/if}
        </div>
      </div>
      <div class="mt-4 flex justify-end gap-2">
        <button type="button" class="btn-sm" onclick={() => (showModal = false)}>{t('Cancel')}</button>
        <button type="button" class="btn-sm disabled:cursor-not-allowed disabled:opacity-50" disabled={!valid} onclick={commit}>{t('Add')}</button>
      </div>
    </div>
  </div>
{/if}
