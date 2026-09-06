<!--
SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>

SPDX-License-Identifier: GPL-2.0-only
-->

<script>
  import AddButton from './AddButton.svelte'
  import { t } from '../i18n.svelte.js'

  let {
    items,
    label = null,
    showAdd = true,
    onAdd = null,
    emptyText = 'No entries',
    row
  } = $props()
</script>

<div class="flex flex-col gap-2">
  {#if label}
    <span class="text-xs font-medium text-zinc-700">{t(label)}</span>
  {/if}
  <div class="overflow-hidden rounded-md border border-zinc-200">
    {#each items as item, i (i)}
      <div class="flex items-center gap-2 border-b border-zinc-100 bg-surface px-3 py-1.5 last:border-b-0">
        {@render row(item, i)}
      </div>
    {:else}
      <div class="bg-surface px-3 py-1.5 text-xs text-zinc-400">{t(emptyText)}</div>
    {/each}
  </div>
  {#if showAdd && onAdd}
    <div class="text-right">
      <AddButton onclick={onAdd} />
    </div>
  {/if}
</div>
