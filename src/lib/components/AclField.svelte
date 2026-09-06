<!--
SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>

SPDX-License-Identifier: GPL-2.0-only
-->

<script>
  import ArrayListField from './ArrayListField.svelte'
  import { def_get, ref_resolve } from '../schema.js'
  import { t } from '../i18n.svelte.js'

  let { obj } = $props()

  const KEY = 'access-control-list'
  const fid = $props.id()
  const acl = $derived(obj[KEY])
  const mode = $derived(acl?.mode ?? 'disabled')
  const macSchema = ref_resolve(def_get('interface.ssid.acl')).properties['mac-address']

  function onMode(e) {
    const v = e.target.value
    if (v === 'disabled') {
      delete obj[KEY]
    } else {
      if (!obj[KEY] || typeof obj[KEY] !== 'object') obj[KEY] = {}
      obj[KEY].mode = v
    }
  }
</script>

<div class="flex flex-col gap-4">
  <div class="flex flex-col gap-1">
    <label for={fid} class="text-xs font-medium text-zinc-700">{t('Access Control List')}</label>
    <select id={fid} class="input" value={mode} onchange={onMode}>
      <option value="disabled">{t('disabled')}</option>
      <option value="allow">{t('allow')}</option>
      <option value="deny">{t('deny')}</option>
    </select>
  </div>
  {#if acl}
    <ArrayListField obj={acl} key="mac-address" schema={macSchema} label="" />
  {/if}
</div>
