<!--
SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>

SPDX-License-Identifier: GPL-2.0-only
-->

<script>
  import { t } from '../i18n.svelte.js'

  let { existing, keyLabel = 'entry', onCreate, close } = $props()

  let name = $state('')
  const trimmed = $derived(name.trim())
  const error = $derived(
    !trimmed ? t('Name is required') : existing[trimmed] !== undefined ? t('Name already in use') : ''
  )

  function submit() {
    if (error) return
    onCreate(trimmed, {})
  }
</script>

<h3 class="mb-3 text-sm font-semibold">{t('Add {label}', { label: t(keyLabel) })}</h3>
<div class="flex flex-col gap-1">
  <label for="na-name" class="text-xs font-medium text-zinc-700">{t('Name')}</label>
  <input id="na-name" class="input" bind:value={name} onkeydown={(e) => e.key === 'Enter' && submit()} />
  {#if trimmed && error}<p class="text-[11px] text-amber-600">{error}</p>{/if}
</div>
<div class="mt-4 flex justify-end gap-2">
  <button type="button" class="btn-sm" onclick={close}>{t('Cancel')}</button>
  <button type="button" class="btn-sm disabled:cursor-not-allowed disabled:opacity-50" disabled={!!error} onclick={submit}>
    {t('Add')}
  </button>
</div>
