<!--
SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>

SPDX-License-Identifier: GPL-2.0-only
-->

<script>
  import { t } from '../i18n.svelte.js'

  let { obj } = $props()

  const fid = $props.id()
  const value = $derived(obj.addressing ?? 'dynamic')
</script>

<div class="flex flex-col gap-1">
  <label for={fid} class="text-xs font-medium text-zinc-700">{t('Addressing')}</label>
  <input id={fid} class="input" value={t(value)} disabled />
</div>
