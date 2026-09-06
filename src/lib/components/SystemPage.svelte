<!--
SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>

SPDX-License-Identifier: GPL-2.0-only
-->

<script>
  import { request as ws_request, upload as ws_upload } from '../connection.svelte.js'
  import { confirm } from '../confirm.svelte.js'
  import { view } from '../view.svelte.js'
  import { accordion_provide } from '../accordion.svelte.js'
  import { t } from '../i18n.svelte.js'
  import Spinner from './Spinner.svelte'
  import CollapsibleSection from './CollapsibleSection.svelte'

  // Own accordion group so the action sections are mutually exclusive and
  // independent of the surrounding device-menu accordion.
  accordion_provide(true)

  let status = $state('idle') // 'idle' | 'rebooting' | 'resetting' | 'uploading' | 'upgrading'
  let error = $state(null)
  let file = $state(null)
  let keepConfig = $state(false)

  const menu = $derived(view.mode === 'menu')

  const messages = {
    rebooting: 'The device is rebooting…',
    resetting: 'The device is resetting to factory defaults…',
    uploading: 'Uploading firmware…',
    upgrading: 'Flashing firmware. The device will reboot when done.'
  }

  async function do_reboot() {
    if (!(await confirm(t('Reboot the device now?')))) return
    error = null
    status = 'rebooting'
    try {
      await ws_request('reboot', {})
    } catch {
      /* the socket may drop before the reply arrives */
    }
  }

  async function do_factory_reset() {
    if (!(await confirm(t('Factory reset the device? All settings will be erased.')))) return
    error = null
    status = 'resetting'
    try {
      await ws_request('factory-reset', {})
    } catch {
      /* socket may drop before reply */
    }
  }

  function pick(e) {
    file = e.target.files?.[0] ?? null
  }

  async function do_upgrade() {
    if (!file) return
    if (!(await confirm(t('Flash "{name}" and reboot?', { name: file.name })))) return
    error = null
    status = 'uploading'
    try {
      const tok = await ws_request('sysupgrade', { action: 'token' })
      const res = await ws_upload(tok.upload_url, file)
      status = 'upgrading'
      await ws_request('sysupgrade', { action: 'apply', file_id: res.file_id, keep_config: keepConfig })
    } catch (e) {
      error = e?.message || String(e)
      status = 'idle'
    }
  }
</script>

{#if status !== 'idle'}
  <div class="flex flex-col items-center gap-3 text-center text-sm text-zinc-500 {menu ? 'rounded-lg border border-zinc-200 bg-surface p-10' : 'py-10'}">
    <Spinner class="h-6 w-6 text-zinc-400" />
    <span>{t(messages[status])}</span>
  </div>
{:else}
  <div class="flex flex-col gap-3">
    <CollapsibleSection title="Reboot">
      {#snippet children()}
        <p class="text-xs text-zinc-500">{t('Restart the device.')}</p>
        <button type="button" class="btn mt-3 w-full justify-center" onclick={do_reboot}>{t('Reboot')}</button>
      {/snippet}
    </CollapsibleSection>

    <CollapsibleSection title="Factory reset">
      {#snippet children()}
        <p class="text-xs text-zinc-500">{t('Erase all settings and reboot.')}</p>
        <button type="button" class="btn mt-3 w-full justify-center border-red-200 text-red-700 hover:bg-red-50" onclick={do_factory_reset}>{t('Factory reset')}</button>
      {/snippet}
    </CollapsibleSection>

    <CollapsibleSection title="Firmware upgrade">
      {#snippet children()}
        <p class="text-xs text-zinc-500">{t('Upload a firmware image and flash it.')}</p>
        <input type="file" accept=".bin,.img,application/octet-stream" class="mt-3 block w-full text-sm text-zinc-700 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-zinc-200" onchange={pick} />
        <label class="mt-3 flex items-center gap-2 text-sm text-zinc-700">
          <input type="checkbox" bind:checked={keepConfig} />
          {t('Keep current settings')}
        </label>
        {#if error}
          <p class="mt-2 text-xs text-red-600">{error}</p>
        {/if}
        <button type="button" class="btn-primary mt-3 w-full justify-center rounded-md px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50" disabled={!file} onclick={do_upgrade}>
          {t('Flash firmware')}
        </button>
      {/snippet}
    </CollapsibleSection>
  </div>
{/if}
