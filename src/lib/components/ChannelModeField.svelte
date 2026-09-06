<!--
SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>

SPDX-License-Identifier: GPL-2.0-only
-->

<script>
  import { band_modes } from '../capabilities.svelte.js'
  import { t } from '../i18n.svelte.js'

  let { obj, schema, band, describe = null } = $props()

  const fid = $props.id()
  const value = $derived(obj['channel-mode'])
  const def = $derived(schema?.default ?? 'HE')
  const options = $derived(band_modes(band))
  const fallback = $derived(options.includes(def) ? def : options[options.length - 1])
  const invalid = $derived(value != null && !options.includes(value))
  const shown = $derived(invalid ? [value, ...options] : options)
  const selected = $derived(value ?? fallback)
  const desc = $derived(t((describe ?? '').replace(/\s+/g, ' ').trim()))

  function onChange(e) {
    const v = e.target.value
    if (v === '') delete obj['channel-mode']
    else obj['channel-mode'] = v
  }
</script>

<div class="flex flex-col gap-1">
  <label for={fid} class="text-xs font-medium text-zinc-700">{t('Channel Mode')}</label>
  <select id={fid} class="input" value={selected} onchange={onChange}>
    {#each shown as m}
      <option value={m}>{m}</option>
    {/each}
  </select>
  {#if invalid}
    <p class="text-[11px] leading-snug text-amber-600">{value} is not valid for {band}.</p>
  {/if}
  {#if desc}
    <p class="text-[11px] leading-snug text-zinc-500">{desc}</p>
  {/if}
</div>
