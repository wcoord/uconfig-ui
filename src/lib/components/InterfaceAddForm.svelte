<!--
SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>

SPDX-License-Identifier: GPL-2.0-only
-->

<script>
  import { t } from '../i18n.svelte.js'

  let { interfaces, create, close } = $props()

  let name = $state('')
  let role = $state('downstream')
  let vlanOn = $state(false)
  let vlanId = $state('')

  const trimmed = $derived(name.trim())
  const nameError = $derived(
    !trimmed ? t('Name is required') : interfaces[trimmed] !== undefined ? t('Name already in use') : ''
  )

  const upstreamVlans = $derived(
    Object.values(interfaces)
      .filter((i) => i?.role === 'upstream' && i?.vlan?.id != null)
      .map((i) => i.vlan.id)
  )

  const vid = $derived(Number(vlanId))
  const vlanError = $derived(vlan_error())

  function vlan_error() {
    if (!vlanOn) return ''
    if (!(Number.isInteger(vid) && vid >= 2 && vid <= 4096)) return t('VLAN ID must be between 2 and 4096')
    if (role === 'upstream') {
      const dup = Object.values(interfaces).some((i) => i?.role === 'upstream' && i?.vlan?.id === vid)
      if (dup) return t('VLAN {id} is already used by an upstream interface', { id: vid })
    } else if (!upstreamVlans.includes(vid)) {
      return t('No upstream interface provides VLAN {id}', { id: vid })
    }
    return ''
  }

  const valid = $derived(!nameError && !vlanError)

  function submit() {
    if (!valid) return
    const addressing = role === 'downstream' ? 'static' : 'dynamic'
    const value = { role, ipv4: { addressing }, ipv6: { addressing } }
    if (vlanOn) value.vlan = { id: vid }
    create(trimmed, value)
  }
</script>

<h3 class="mb-3 text-sm font-semibold">{t('Add interface')}</h3>

<div class="flex flex-col gap-3">
  <div class="flex flex-col gap-1">
    <label for="if-name" class="text-xs font-medium text-zinc-700">{t('Name')}</label>
    <input
      id="if-name"
      class="input"
      bind:value={name}
      placeholder={t('e.g. lan, guest, iot')}
      onkeydown={(e) => e.key === 'Enter' && submit()}
    />
    {#if trimmed && nameError}
      <p class="text-[11px] text-amber-600">{nameError}</p>
    {/if}
  </div>

  <div class="flex flex-col gap-1">
    <label for="if-role" class="text-xs font-medium text-zinc-700">{t('Role')}</label>
    <select id="if-role" class="input" bind:value={role}>
      <option value="upstream">{t('Upstream')}</option>
      <option value="downstream">{t('Downstream')}</option>
    </select>
  </div>

  <div class="flex flex-col gap-2">
    <div class="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={vlanOn}
        aria-label={t('VLAN')}
        onclick={() => (vlanOn = !vlanOn)}
        class="relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition {vlanOn ? 'bg-emerald-500' : 'bg-zinc-300'}"
      >
        <span
          class="inline-block h-4 w-4 transform rounded-full bg-surface shadow transition {vlanOn ? 'translate-x-4' : 'translate-x-0.5'}"
        ></span>
      </button>
      <span class="text-xs font-medium text-zinc-700">{t('VLAN')}</span>
    </div>

    {#if vlanOn}
      <div class="flex flex-col gap-1">
        <input
          class="input"
          type="number"
          min="2"
          max="4096"
          bind:value={vlanId}
          placeholder={t('2 to 4096')}
          onkeydown={(e) => e.key === 'Enter' && submit()}
        />
        {#if role === 'downstream'}
          <p class="text-[11px] text-zinc-500">
            {t('Available upstream VLANs: {list}', { list: upstreamVlans.length ? upstreamVlans.join(', ') : t('none') })}
          </p>
        {/if}
        {#if vlanError}
          <p class="text-[11px] text-amber-600">{vlanError}</p>
        {/if}
      </div>
    {/if}
  </div>
</div>

<div class="mt-4 flex justify-end gap-2">
  <button type="button" class="btn-sm" onclick={close}>{t('Cancel')}</button>
  <button type="button" class="btn-sm disabled:cursor-not-allowed disabled:opacity-50" disabled={!valid} onclick={submit}>
    {t('Add')}
  </button>
</div>
