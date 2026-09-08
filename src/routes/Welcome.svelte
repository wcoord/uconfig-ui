<!--
SPDX-FileCopyrightText: 2026 Zach Mandeville <webmaster@coolguy.website>

SPDX-License-Identifier: GPL-2.0-only
-->

<script>
  import { push } from 'svelte-spa-router';
  import { t } from '../lib/i18n.svelte.js'
  import { settings } from '../lib/settings.svelte.js'
  import { connection } from '../lib/connection.svelte.js';
  import {
    config_load,
    saved_names,
    example_load,
    example_names
  } from '../lib/store.svelte.js'

  let savedConfig = $state('')
  let exampleConfig = $state('')
  let host = $state(settings.host ?? '')
  let savedConfigs = $derived(saved_names())
  let savedDevices = $state([
    // include local address by default, e.g., connecting directly to router.
    {name: 'This device', address: window.location.hostname}
  ])

  async function host_connect() {
    const h = host.trim()
    if (!h) return
    settings.host = h
    connection.status = 'connecting'
    push('#/login')
  }
</script>

{#snippet divider(text)}
  <span class="h-px flex-1 bg-zinc-200"></span>
  <span class="text-xs text-zinc-400">{t(text)}</span>
  <span class="h-px flex-1 bg-zinc-200"></span>
{/snippet}


<div class="flex flex-1 items-center justify-center overflow-y-auto p-4">
  <div class="w-full max-w-lg rounded-lg border border-zinc-200 bg-surface p-6 shadow-sm">
    <div class="mb-4 flex items-start justify-between gap-4">
      <div>
        <h1 class="text-lg font-semibold tracking-tight">{t('uConfig UI')}</h1>
        <p class="mt-1 text-sm text-zinc-500">{t('Intent-based OpenWrt configuration')}</p>
      </div>
    </div>
    <p class="text-sm leading-relaxed text-zinc-600">
      {t('Describe the device and export a uConfig document. Choose how to start:')}
    </p>
    <div class="mt-5 flex flex-col gap-4">

      <!-- saved configuration  -->
      {#if savedConfigs.length}
        <div class="flex items-center gap-2">
          <select class="input" bind:value={savedConfig}>
            <option value="">
              {t('Open a saved configuration…')}
            </option>
            {#each savedConfigs as name}
              <option value={name}>{name}</option>
            {/each}
          </select>
          <button type="button"
                  class="btn disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!savedConfig}
                  onclick={() => {config_load(savedConfig); push('#/builder/')}}>
            {t('Open')}
          </button>
        </div>
      {/if}

      <!-- Fresh, default configuration -->
      <div class="flex items-center gap-2">
        {@render divider('or start fresh')}
      </div>
      <button type="button"
              class="btn-primary rounded-md px-3 py-2 text-sm font-medium"
              onclick={() => {example_load('default'); push('#/builder/');}}>
        {t('Start with the default configuration')}
      </button>

      <!-- Select example configuration -->
      <div class="flex items-center gap-2">
        {@render divider('or start from an example')}
      </div>
      <div class="flex items-center gap-2">
        <select class="input" bind:value={exampleConfig}>
          <option value="">
            {t('Choose an example…')}
          </option>
          {#each example_names as name}
            <option value={name}>{name}</option>
          {/each}
        </select>
        <button type="button"
                class="btn disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!exampleConfig}
                onclick={() => { example_load(exampleConfig); push('#/builder/');}}>
          {t('Start')}
        </button>
      </div>

      <!-- Connect to a device -->
      <div class="flex items-center gap-2">
        {@render divider('or connect to another device')}
      </div>
      <form class="flex items-center gap-2"
            onsubmit={(e) => { e.preventDefault(); host_connect() }}>
        <input class="input"
               type="text"
               autocomplete="off"
               placeholder={t('IP to connect to')}
               bind:value={host} />
        <button type="submit"
                class="btn disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!host.trim()}>
          {t('Connect')}
        </button>
      </form>

      <p class='text-zinc-400 text-xs'>choose from saved devices</p>
      {#each savedDevices as device}
        <button
          title={device.address}
          class="btn w-fit text-xs transition-colors"
          class:bg-zinc-400={host === device.address}
          onclick={() => {host = device.address; }}
          >{device.name}</button>
      {/each}
    </div>
  </div>
</div>
