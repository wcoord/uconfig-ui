<!--
SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>

SPDX-License-Identifier: GPL-2.0-only
-->

<script>
  import { t } from '../i18n.svelte.js'

  let { obj, schema, role, describe = null } = $props()

  const fid = $props.id()
  const desc = $derived(t(describe ?? ''))
  const isDownstream = $derived(role === 'downstream')
  const options = $derived(schema.enum ?? ['dynamic', 'static'])

  // Downstream interfaces are always static; upstream default to dynamic (DHCP).
  $effect(() => {
    if (isDownstream) {
      if (obj.addressing !== 'static') obj.addressing = 'static'
    } else if (obj.addressing == null) {
      obj.addressing = 'dynamic'
    }
  })

  function onChange(e) {
    obj.addressing = e.target.value
  }
</script>

{#if !isDownstream}
  <div class="flex flex-col gap-1">
    <label for={fid} class="text-xs font-medium text-zinc-700">{t('Addressing')}</label>
    <select id={fid} class="input" value={obj.addressing ?? 'dynamic'} onchange={onChange}>
      {#each options as o}
        <option value={o}>{t(o)}</option>
      {/each}
    </select>
    {#if desc}<p class="text-[11px] leading-snug text-zinc-500">{desc}</p>{/if}
  </div>
{/if}
