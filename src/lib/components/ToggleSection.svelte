<!--
SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>

SPDX-License-Identifier: GPL-2.0-only
-->

<script>
  import { title_for } from '../schema.js'
  import { accordion_get } from '../accordion.svelte.js'
  import { view } from '../view.svelte.js'
  import { t } from '../i18n.svelte.js'

  let { container, key, title = null, children } = $props()

  const acc = accordion_get()
  const id = $props.id()
  let localOpen = $state(false)
  const open = $derived(acc ? acc.isOpen(id) : localOpen)
  const on = $derived(container[key] != null)
  const lbl = $derived(t(title ?? title_for(key)))

  function toggle_open() {
    if (acc) acc.toggle(id)
    else localOpen = !localOpen
  }

  function toggle_enabled() {
    if (on) delete container[key]
    else container[key] = {}
  }
</script>

{#snippet enabled_toggle()}
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={lbl}
    onclick={toggle_enabled}
    class="relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition {on ? 'bg-emerald-500' : 'bg-zinc-300'}"
  >
    <span
      class="inline-block h-4 w-4 transform rounded-full bg-surface shadow transition {on ? 'translate-x-4' : 'translate-x-0.5'}"
    ></span>
  </button>
{/snippet}

{#snippet chevron(rev)}
  <svg
    class="h-4 w-4 flex-shrink-0 text-zinc-400 transition-transform {open ? (rev ? '-rotate-180' : 'rotate-180') : ''}"
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

{#snippet body()}
  <div class="flex items-center gap-2">
    {@render enabled_toggle()}
    <span class="text-xs font-medium text-zinc-700">{t('Enabled')}</span>
  </div>
  {#if on}
    {@render children()}
  {/if}
{/snippet}

{#if view.mode === 'menu'}
  <section class="rounded-lg border border-zinc-200 bg-surface">
    <button type="button" class="flex w-full items-center gap-3 px-4 py-3 text-left" onclick={toggle_open}>
      {@render chevron(true)}
      <span class="flex-1 text-xs font-semibold uppercase tracking-wide text-zinc-600">{lbl}</span>
    </button>
    {#if open}
      <div class="flex flex-col gap-4 border-t border-zinc-100 px-4 py-4">{@render body()}</div>
    {/if}
  </section>
{:else}
  <div>
    <button type="button" class="flex w-full items-center gap-2 border-b border-zinc-200 pb-2" onclick={toggle_open}>
      {@render chevron(true)}
      <span class="flex-1 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">{lbl}</span>
    </button>
    {#if open}
      <div class="flex flex-col gap-4 pt-3">{@render body()}</div>
    {/if}
  </div>
{/if}
