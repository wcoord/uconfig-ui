<!--
SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>

SPDX-License-Identifier: GPL-2.0-only
-->

<script>
  import { t } from '../i18n.svelte.js'

  let { obj, describe = null } = $props()

  const fid = $props.id()
  const desc = $derived(t(describe ?? ''))
  const MAX = 30
  const value = $derived(obj['tx-power'] ?? MAX)
  const pct = $derived(Math.round((value / MAX) * 100))

  $effect(() => {
    if (obj['tx-power'] == null) obj['tx-power'] = MAX
  })

  function onInput(e) {
    obj['tx-power'] = Number(e.target.value)
  }
</script>

<div class="flex flex-col gap-1">
  <label for={fid} class="text-xs font-medium text-zinc-700">{t('TX Power')}</label>
  <input
    id={fid}
    type="range"
    min="0"
    max={MAX}
    step="1"
    value={value}
    oninput={onInput}
    class="w-full accent-emerald-500"
  />
  <p class="text-center text-[11px] text-zinc-500">{pct}% ({value} dBm)</p>
  {#if desc}<p class="text-[11px] leading-snug text-zinc-500">{desc}</p>{/if}
</div>
