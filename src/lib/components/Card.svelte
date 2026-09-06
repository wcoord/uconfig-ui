<!--
SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>

SPDX-License-Identifier: GPL-2.0-only
-->

<script>
  import { untrack } from 'svelte'
  import { accordion_get } from '../accordion.svelte.js'

  let { title, subtitle = null, badge = null, open = false, children, actions = null } = $props()

  const acc = accordion_get()
  const id = $props.id()
  let localOpen = $state(untrack(() => open))
  const isOpen = $derived(acc ? acc.isOpen(id) : localOpen)

  $effect(() => {
    untrack(() => acc?.register(id))
  })

  function toggle() {
    if (acc) acc.toggle(id)
    else localOpen = !localOpen
  }
</script>

<div class="rounded-lg border border-zinc-200 bg-surface shadow-sm">
  <button
    type="button"
    class="flex w-full items-center gap-3 px-4 py-3 text-left"
    onclick={toggle}
  >
    <svg
      class="h-4 w-4 flex-shrink-0 text-zinc-400 transition-transform {isOpen ? '-rotate-180' : ''}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
    <span class="flex-1">
      <span class="flex items-center gap-2">
        <span class="text-sm font-semibold text-zinc-900">{title}</span>
        {#if badge}
          <span class="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-ink">
            {badge}
          </span>
        {/if}
      </span>
      {#if subtitle}
        <span class="block text-xs text-zinc-500">{subtitle}</span>
      {/if}
    </span>
    {#if actions}
      <span role="presentation" onclick={(e) => e.stopPropagation()}>
        {@render actions()}
      </span>
    {/if}
  </button>
  {#if isOpen}
    <div class="border-t border-zinc-100 px-4 py-4">
      {@render children()}
    </div>
  {/if}
</div>
