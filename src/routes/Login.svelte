<!--
SPDX-FileCopyrightText: 2026 Zach Mandeville <webmaster@coolguy.website>

SPDX-License-Identifier: GPL-2.0-only
-->

<script>
  import { onMount } from 'svelte';
  import { push } from 'svelte-spa-router'
  import { t } from '../lib/i18n.svelte.js';
  import { settings } from '../lib/settings.svelte.js';
  import {
    connection,
    connect as ws_connect
  } from '../lib/connection.svelte.js';
  import { doc_adopt } from '../lib/store.svelte.js'
  import { capabilities_set, capabilities_clear } from '../lib/capabilities.svelte.js'
  import {
    login as ws_login,
    request as ws_request,
    disconnect as ws_disconnect
  } from '../lib/connection.svelte.js'

  import Spinner from '../lib/components/Spinner.svelte';

  let password = $state('')
  let loginError = $state(null)
  let loggingIn = $state(false)

  async function host_connect() {
    const h = settings.host
    if (!h) {
      connection.status = 'error'
      loginError = 'No host provided to connect'
      push('/')
      return
    }
    loginError = null
    try {
      await ws_connect(h)
      connection.status = 'ready';
    } catch (e) {
      connection.status = 'error'
      loginError = e?.message || String(e)
    }
  }

  async function host_login(event) {
    event?.preventDefault()
    if (loggingIn) return
    loginError = null
    loggingIn = true
    try {
      const mode = await ws_login(password)
      if (mode === 'standalone') {
        // Pull the device's active config; a fresh device may have none yet.
        try {
          doc_adopt(await ws_request('config-get', {}), settings.host)
        } catch {
          /* no active config on the device; start from the blank document */
        }
        try {
          capabilities_set(await ws_request('capabilities', {}))
        } catch {
          /* device did not report capabilities; static defaults apply */
        }
      }
      // Land on the device menu (Network is the default page); Configure opens the builder.
      password = ''
      push('#/device')
    } catch (e) {
      loginError = e?.message || String(e)
    } finally {
      loggingIn = false
    }
  }

  function login_back() {
    ws_disconnect()
    capabilities_clear()
    loginError = null
    connection.status = 'idle'
    push('#/welcome')
  }

  onMount(host_connect)
</script>


<div class="flex flex-1 items-center justify-center overflow-y-auto p-4">
  <div class="w-full max-w-lg rounded-lg border border-zinc-200 bg-surface p-6 shadow-sm">
    <div class="mb-4 flex items-start justify-between gap-4">
      <div>
        <h1 class="text-lg font-semibold tracking-tight">{t('Log in')}</h1>
        <p class="mt-1 text-sm text-zinc-500">{settings.host}</p>
      </div>
    </div>
    {#if connection.status === 'connecting'}
      <div class="flex flex-col items-center gap-3 py-8 text-sm text-zinc-500">
        <Spinner class="h-6 w-6 text-zinc-400" />
        <span>{t('Connecting to the device…')}</span>
      </div>
    {:else if connection.status === 'error'}
      <p class="text-sm text-red-600">{loginError}</p>
      <div class="mt-4 flex justify-end">
        <button type="button" class="btn" onclick={login_back}>{t('Back')}</button>
      </div>
    {:else}
      <form class="flex flex-col gap-4" onsubmit={host_login}>
        <input type="hidden" name="username" autocomplete="username" value="admin" />
        <label class="flex flex-col gap-1">
          <span class="text-sm font-medium text-zinc-700">{t('Password')}</span>
          <input class="input" type="password" name="password" autocomplete="current-password" bind:value={password} />
        </label>
        {#if loginError}
          <p class="text-sm text-red-600">{loginError}</p>
        {/if}
        <button type="submit" class="btn-primary w-full justify-center rounded-md px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50" disabled={loggingIn}>
          {loggingIn ? t('Logging in…') : t('Log in')}
        </button>
      </form>
    {/if}
  </div>
</div>