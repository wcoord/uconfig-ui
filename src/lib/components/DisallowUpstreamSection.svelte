<!--
SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>

SPDX-License-Identifier: GPL-2.0-only
-->

<script>
  import ArrayListField from './ArrayListField.svelte'
  import { title_for } from '../schema.js'
  import { accordion_get } from '../accordion.svelte.js'
  import { view } from '../view.svelte.js'
  import { t } from '../i18n.svelte.js'

  let { obj, schema } = $props()

  const KEY = 'disallow-upstream-subnet'
  const acc = accordion_get()
  const id = $props.id()
  let localOpen = $state(false)
  const open = $derived(acc ? acc.isOpen(id) : localOpen)

  function toggle_open() {
    if (acc) acc.toggle(id)
    else localOpen = !localOpen
  }
  const value = $derived(obj[KEY])
  const anyRfc = $derived(value === true)
  const arraySchema = $derived(
    (schema.anyOf ?? []).find((b) => b.type === 'array') ?? {
      type: 'array',
      items: { type: 'string', format: 'uc-cidr4' }
    }
  )

  function toggle_rfc() {
    if (anyRfc) delete obj[KEY]
    else obj[KEY] = true
  }
</script>

{#snippet body()}
  <div class="flex flex-col gap-4">
    <div class="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={anyRfc}
        aria-label={t('Any RFC1918 subnet')}
        onclick={toggle_rfc}
        class="relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition {anyRfc ? 'bg-emerald-500' : 'bg-zinc-300'}"
      >
        <span
          class="inline-block h-4 w-4 transform rounded-full bg-surface shadow transition {anyRfc ? 'translate-x-4' : 'translate-x-0.5'}"
        ></span>
      </button>
      <span class="text-xs font-medium text-zinc-700">{t('Any RFC1918 subnet')}</span>
    </div>
    {#if !anyRfc}
      <ArrayListField {obj} key={KEY} schema={arraySchema} label="Blocked subnets" />
    {/if}
  </div>
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

{#if view.mode === 'menu'}
  <section class="rounded-lg border border-zinc-200 bg-surface">
    <button type="button" class="flex w-full items-center gap-3 px-4 py-3 text-left" onclick={toggle_open}>
      {@render chevron(true)}
      <span class="flex-1 text-xs font-semibold uppercase tracking-wide text-zinc-600">{t(title_for(KEY))}</span>
    </button>
    {#if open}
      <div class="border-t border-zinc-100 px-4 py-4">{@render body()}</div>
    {/if}
  </section>
{:else}
  <div>
    <button type="button" class="flex w-full items-center gap-2 border-b border-zinc-200 pb-2" onclick={toggle_open}>
      {@render chevron(true)}
      <span class="flex-1 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
        {t(title_for(KEY))}
      </span>
    </button>
    {#if open}
      <div class="pt-3">{@render body()}</div>
    {/if}
  </div>
{/if}
