<!--
SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>

SPDX-License-Identifier: GPL-2.0-only
-->

<script>
  import { deviceStore, devices_refresh } from '../devices.svelte.js'
  import { view } from '../view.svelte.js'
  import { t } from '../i18n.svelte.js'
  import Spinner from './Spinner.svelte'

  function name_of(d) {
    return d.hostname || d.fingerprint?.device_name || d.fingerprint?.device || d.fingerprint?.vendor || d.mac
  }

  function ip_of(d) {
    return d.ipv4 || d.ipv6?.[0] || ''
  }

  function flatten(data) {
    if (!data) return []
    const out = []
    for (const macs of Object.values(data)) {
      for (const [mac, dev] of Object.entries(macs)) out.push({ ...dev, mac: dev.mac || mac })
    }
    out.sort((a, b) => Number(!!b.online) - Number(!!a.online) || name_of(a).localeCompare(name_of(b)))
    return out
  }

  const devices = $derived(flatten(deviceStore.data))

  // In cards (mobile) view the surrounding Card supplies the border, title and
  // header spinner, so render flat and let the Card's padding apply.
  const menu = $derived(view.mode === 'menu')
  const pad = $derived(menu ? 'px-4' : '')

  $effect(() => {
    devices_refresh()
    const iv = setInterval(devices_refresh, 60000)
    return () => clearInterval(iv)
  })
</script>

<div class={menu ? 'rounded-lg border border-zinc-200 bg-surface' : ''}>
  {#if menu}
    <div class="flex items-center gap-2 border-b border-zinc-100 px-4 py-3">
      <h3 class="text-sm font-semibold text-zinc-900">{t('Devices')}</h3>
      <span class="flex-1"></span>
      {#if deviceStore.loading}
        <Spinner class="h-4 w-4 text-zinc-400" />
      {/if}
    </div>
  {/if}

  {#if deviceStore.error && !deviceStore.data}
    <p class="{pad} py-3 text-sm text-red-600">{deviceStore.error}</p>
  {:else if deviceStore.data === null}
    <div class="flex items-center justify-center gap-3 {pad} py-10 text-sm text-zinc-500">
      <Spinner class="h-5 w-5 text-zinc-400" />
      <span>{t('Loading devices…')}</span>
    </div>
  {:else if !devices.length}
    <p class="{pad} py-8 text-center text-sm text-zinc-500">{t('No devices found.')}</p>
  {:else}
    <ul class="divide-y divide-zinc-100">
      {#each devices as d (d.mac)}
        <li class="flex items-center gap-3 {pad} py-2.5">
          <span
            class="h-2 w-2 flex-shrink-0 rounded-full {d.online ? 'bg-emerald-500' : 'bg-zinc-300'}"
            title={d.online ? t('online') : t('offline')}
          ></span>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="truncate text-sm font-medium text-zinc-800">{name_of(d)}</span>
              {#if d.fingerprint?.class}
                <span class="flex-shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">{d.fingerprint.class}</span>
              {/if}
            </div>
            <div class="truncate font-mono text-xs text-zinc-400">
              {d.mac}{#if ip_of(d)} · {ip_of(d)}{/if}
            </div>
          </div>
          {#if d.fingerprint?.vendor}
            <span class="hidden flex-shrink-0 text-right text-xs text-zinc-400 sm:block">{d.fingerprint.vendor}</span>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>
