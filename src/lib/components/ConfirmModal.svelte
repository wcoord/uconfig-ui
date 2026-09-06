<!--
SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>

SPDX-License-Identifier: GPL-2.0-only
-->

<script>
  import { confirmState, confirm_answer } from '../confirm.svelte.js'
  import { t } from '../i18n.svelte.js'
</script>

{#if confirmState.open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    onclick={() => confirm_answer(false)}
  >
    <div
      class="w-full max-w-sm rounded-lg border border-zinc-200 bg-surface p-4 shadow-lg"
      onclick={(e) => e.stopPropagation()}
    >
      <p class="text-sm text-zinc-800">{confirmState.message}</p>
      <div class="mt-4 flex justify-end gap-2">
        <button type="button" class="btn-sm" onclick={() => confirm_answer(false)}>{t('Cancel')}</button>
        <button type="button" class="btn-sm-danger" onclick={() => confirm_answer(true)}>{t('Remove')}</button>
      </div>
    </div>
  </div>
{/if}
