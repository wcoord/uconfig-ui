<!--
SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>

SPDX-License-Identifier: GPL-2.0-only
-->

<script>
  import { tz_keys } from '../store.svelte.js'
  import { t } from '../i18n.svelte.js'

  let { obj } = $props()

  const fid = $props.id()
  const value = $derived(obj.timezone)
  const options = $derived(value && !tz_keys.includes(value) ? [value, ...tz_keys] : tz_keys)

  function onChange(e) {
    const v = e.target.value
    if (!v) delete obj.timezone
    else obj.timezone = v
  }
</script>

<div class="flex flex-col gap-1">
  <label for={fid} class="text-xs font-medium text-zinc-700">{t('Timezone')}</label>
  <select id={fid} class="input" value={value ?? ''} onchange={onChange}>
    {#each options as tz}
      <option value={tz}>{tz}</option>
    {/each}
  </select>
</div>
