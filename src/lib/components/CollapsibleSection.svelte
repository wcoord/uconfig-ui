<!--
SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>

SPDX-License-Identifier: GPL-2.0-only
-->

<script>
  import { untrack } from 'svelte'
  import { accordion_get } from '../accordion.svelte.js'
  import { view } from '../view.svelte.js'
  import { t } from '../i18n.svelte.js'

  let { title, open = false, children } = $props()

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

{#snippet chevron(rev)}
  <svg
    class="h-4 w-4 flex-shrink-0 text-zinc-400 transition-transform {isOpen ? (rev ? '-rotate-180' : 'rotate-180') : ''}"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
{/snippet}

{#if view.mode === 'menu'}
  <section class="rounded-lg border border-zinc-200 bg-surface">
    <button type="button" class="flex w-full items-center gap-3 px-4 py-3 text-left" onclick={toggle}>
      {@render chevron(true)}
      <span class="flex-1 text-xs font-semibold uppercase tracking-wide text-zinc-600">{t(title)}</span>
    </button>
    {#if isOpen}
      <div class="border-t border-zinc-100 px-4 py-4">{@render children()}</div>
    {/if}
  </section>
{:else}
  <div>
    <button type="button" class="flex w-full items-center gap-2 border-b border-zinc-200 pb-2" onclick={toggle}>
      {@render chevron(true)}
      <span class="flex-1 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">{t(title)}</span>
    </button>
    {#if isOpen}
      <div class="pt-3">{@render children()}</div>
    {/if}
  </div>
{/if}
