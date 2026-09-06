<!--
SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>

SPDX-License-Identifier: GPL-2.0-only
-->

<script>
  import { default_width } from '../channels.js'
  import { band_widths } from '../capabilities.svelte.js'
  import { t } from '../i18n.svelte.js'

  let { obj, schema, band, describe = null } = $props()

  const fid = $props.id()
  const is5G = $derived(String(band).toUpperCase() === '5G')
  const value = $derived(obj['channel-width'])
  // 160 MHz requires DFS, so hide it on 5G when DFS is explicitly disabled.
  const dfsOff = $derived(is5G && obj['allow-dfs'] === false)
  const options = $derived(dfsOff ? band_widths(band).filter((w) => w !== 160) : band_widths(band))
  const invalid = $derived(value != null && !options.includes(value))
  const shown = $derived(invalid ? [value, ...options] : options)
  const desc = $derived(t((describe ?? '').replace(/\s+/g, ' ').trim()))

  $effect(() => {
    if (obj['channel-width'] == null) obj['channel-width'] = default_width(band)
    if (is5G && obj['channel-width'] === 160) obj['allow-dfs'] = true
  })

  function onChange(e) {
    const v = e.target.value
    if (v === '') delete obj['channel-width']
    else obj['channel-width'] = Number(v)
  }
</script>

<div class="flex flex-col gap-1">
  <label for={fid} class="text-xs font-medium text-zinc-700">{t('Channel Width')}</label>
  <select id={fid} class="input" value={value ?? ''} onchange={onChange}>
    {#each shown as w}
      <option value={w}>{w} MHz</option>
    {/each}
  </select>
  {#if invalid}
    <p class="text-[11px] leading-snug text-amber-600">
      {value} MHz is not valid for {band}.
    </p>
  {/if}
  {#if desc}
    <p class="text-[11px] leading-snug text-zinc-500">{desc}</p>
  {/if}
</div>
