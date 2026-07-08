<script>
  import Card from './lib/components/Card.svelte'
  import LayoutRenderer from './lib/components/LayoutRenderer.svelte'
  import MapEditor from './lib/components/MapEditor.svelte'
  import ConfirmModal from './lib/components/ConfirmModal.svelte'
  import ConfigurationPanel from './lib/components/ConfigurationPanel.svelte'
  import InterfaceAddForm from './lib/components/InterfaceAddForm.svelte'
  import NetworkPage from './lib/components/NetworkPage.svelte'
  import StatePage from './lib/components/StatePage.svelte'
  import SystemPage from './lib/components/SystemPage.svelte'
  import DeviceCards from './lib/components/DeviceCards.svelte'
  import Spinner from './lib/components/Spinner.svelte'
  import { def_get } from './lib/schema.js'
  import { default_width } from './lib/channels.js'
  import { unitLayout, radioLayout, interfaceLayout, servicesLayout } from './lib/layouts.js'
  import { view } from './lib/view.svelte.js'
  import { settings } from './lib/settings.svelte.js'
  import { accordion_provide } from './lib/accordion.svelte.js'
  import { changes_list } from './lib/changes.js'
  import { t } from './lib/i18n.svelte.js'
  import {
    store,
    example_names,
    example_load,
    config_load,
    saved_names,
    doc_export,
    doc_adopt,
    doc_reset
  } from './lib/store.svelte.js'
  import { connect as ws_connect, login as ws_login, request as ws_request, disconnect as ws_disconnect } from './lib/connection.svelte.js'
  import { capabilities, capabilities_set, capabilities_clear } from './lib/capabilities.svelte.js'
  import { devices_clear } from './lib/devices.svelte.js'

  const preview = $derived(doc_export())

  const unitDef = def_get('unit')
  const radioDef = def_get('radio')
  const interfaceDef = def_get('interface')
  const serviceDef = def_get('service')

  const sections = [
    { key: 'unit', title: 'Unit', subtitle: 'Device identity', card: true },
    { key: 'radios', title: 'Radios', subtitle: 'Physical radios by band label' },
    { key: 'interfaces', title: 'Interfaces', subtitle: 'Logical networks, SSIDs, ports' },
    { key: 'services', title: 'Services', subtitle: 'SSH, mDNS, LLDP, RADIUS, …' },
    { key: 'changes', title: 'Configuration' }
  ]

  function radio_defaults(band) {
    const defaultChannel = radioDef.properties['channel-mode'].default;
    return {
      'channel-mode': defaultChannel,
      'channel-width': default_width(band)
    }
  }

  // Top-level cards (cards view) act as a single accordion.
  accordion_provide()

  // Effective theme follows the OS until the user picks one (then it's persisted).
  const mql = globalThis.matchMedia?.('(prefers-color-scheme: dark)')
  let systemDark = $state(mql?.matches ?? false)
  mql?.addEventListener?.('change', (e) => (systemDark = e.matches))
  const themeMode = $derived(settings.theme ?? (systemDark ? 'dark' : 'light'))

  $effect(() => {
    document.documentElement.classList.toggle('dark', themeMode === 'dark')
    document.documentElement.style.colorScheme = themeMode
    document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', themeMode)
  })
  function toggle_theme() {
    settings.theme = themeMode === 'dark' ? 'light' : 'dark'
  }

  // Menu (sidebar) layout on desktop, stacked cards on mobile.
  const wideMql = globalThis.matchMedia?.('(min-width: 768px)')
  let wide = $state(wideMql?.matches ?? true)
  wideMql?.addEventListener?.('change', (e) => (wide = e.matches))
  $effect(() => {
    view.mode = wide ? 'menu' : 'cards'
  })

  let screen = $state('welcome') // 'welcome' | 'login' | 'device' | 'builder'
  let devicePage = $state('network') // 'network' | 'state' | 'system'
  let deviceSession = $state(false) // logged into a device (survives idle disconnects)
  let menuOpen = $state(false)
  let welcomeExample = $state('')
  let welcomeSaved = $state('')
  let host = $state(settings.host ?? '')
  let password = $state('')
  let loginError = $state(null)
  let loggingIn = $state(false)
  let connState = $state('idle') // 'connecting' | 'ready' | 'error'
  let savedDevices = $state([
    // include local address by default, e.g., connecting directly to router.
    {name: 'This device', address: window.location.hostname}
  ])
  function start_default() {
    example_load('default')
    screen = 'builder'
  }
  function start_example() {
    if (!welcomeExample) return
    example_load(welcomeExample)
    screen = 'builder'
  }
  function start_saved() {
    if (!welcomeSaved) return
    config_load(welcomeSaved)
    screen = 'builder'
  }
  async function host_connect() {
    const h = host.trim()
    if (!h) return
    settings.host = h
    loginError = null
    connState = 'connecting'
    screen = 'login'
    try {
      await ws_connect(h)
      connState = 'ready'
    } catch (e) {
      connState = 'error'
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
      deviceSession = true
      devicePage = 'network'
      screen = 'device'
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
    connState = 'idle'
    screen = 'welcome'
  }

  function logout() {
    ws_disconnect()
    capabilities_clear()
    devices_clear()
    doc_reset()
    deviceSession = false
    screen = 'welcome'
  }

  function back_to_device() {
    devicePage = 'network'
    screen = 'device'
  }

  const savedConfigs = $derived(saved_names())
  // With device capabilities loaded we know the radios; lock manual add/remove.
  const radiosLocked = $derived(capabilities.data != null)
  const active = $derived(sections.find((s) => s.key === view.section) ?? sections[0])
  const changes = $derived(changes_list(store.doc, store.baseline))
</script>

{#snippet appMenu()}
  {#if menuOpen}
    <button type="button" class="fixed inset-0 z-40 cursor-default" aria-label={t('Close menu')} onclick={() => (menuOpen = false)}></button>
  {/if}
  <div class="fixed right-4 top-3 z-50">
    <button type="button" class="btn" aria-label={t('Menu')} aria-haspopup="true" aria-expanded={menuOpen} onclick={() => (menuOpen = !menuOpen)}>
      <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="5" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="12" cy="19" r="1" />
      </svg>
    </button>
    {#if menuOpen}
      <div class="absolute right-0 mt-1 w-44 overflow-hidden rounded-lg border border-zinc-200 bg-surface py-1 shadow-lg">
        <button type="button" class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100" onclick={() => { menuOpen = false; toggle_theme() }}>
          {#if themeMode === 'dark'}
            <svg class="h-4 w-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
            {t('Light theme')}
          {:else}
            <svg class="h-4 w-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
            </svg>
            {t('Dark theme')}
          {/if}
        </button>
        {#if deviceSession}
          <button type="button" class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100" onclick={() => { menuOpen = false; logout() }}>
            <svg class="h-4 w-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {t('Logout')}
          </button>
        {/if}
      </div>
    {/if}
  </div>
{/snippet}

{#snippet unitBody()}
  <LayoutRenderer data={store.doc.unit} schema={unitDef} layout={unitLayout} />
{/snippet}

{#snippet radiosBody()}
  <MapEditor
    parent={store.doc}
    mapKey="radios"
    valueSchema={radioDef}
    keyLabel="band"
    tabbed
    keyOptions={radioDef.properties.band.enum}
    makeValue={radio_defaults}
    tabCard
    locked={radiosLocked}
  >
    {#snippet item(radio, band)}
      {#if view.mode === 'menu'}
        <div class="rounded-lg border border-zinc-200 bg-surface p-4">
          <LayoutRenderer data={radio} schema={radioDef} layout={radioLayout} context={{ band }} />
        </div>
      {:else}
        <LayoutRenderer data={radio} schema={radioDef} layout={radioLayout} context={{ band }} />
      {/if}
    {/snippet}
  </MapEditor>
{/snippet}

{#snippet interfacesBody()}
  <MapEditor parent={store.doc} mapKey="interfaces" valueSchema={interfaceDef} keyLabel="interface" tabbed renamable={false} tabCard>
    {#snippet addModal({ create, close, map })}
      <InterfaceAddForm interfaces={map} {create} {close} />
    {/snippet}
    {#snippet item(iface, name)}
      <LayoutRenderer
        data={iface}
        schema={interfaceDef}
        layout={interfaceLayout}
        context={{ role: iface.role, allInterfaces: store.doc.interfaces, selfName: name, radios: store.doc.radios }}
      />
    {/snippet}
  </MapEditor>
{/snippet}

{#snippet servicesBody()}
  <LayoutRenderer data={store.doc.services} schema={serviceDef} layout={servicesLayout} />
{/snippet}

{#snippet changesBody()}
  <ConfigurationPanel {changes} {preview} />
{/snippet}

{#snippet bodyFor(key)}
  {#if key === 'unit'}{@render unitBody()}
  {:else if key === 'radios'}{@render radiosBody()}
  {:else if key === 'interfaces'}{@render interfacesBody()}
  {:else if key === 'services'}{@render servicesBody()}
  {:else if key === 'changes'}{@render changesBody()}{/if}
{/snippet}

<div class="flex h-screen flex-col bg-zinc-100 text-zinc-900">
  {@render appMenu()}
  {#if screen === 'welcome'}
    <div class="flex flex-1 items-center justify-center overflow-y-auto p-4">
      <div class="w-full max-w-lg rounded-lg border border-zinc-200 bg-surface p-6 shadow-sm">
        <div class="mb-4 flex items-start justify-between gap-4">
          <div>
            <h1 class="text-lg font-semibold tracking-tight">{t('uConfig builder')}</h1>
            <p class="mt-1 text-sm text-zinc-500">{t('Intent-based OpenWrt configuration')}</p>
          </div>
        </div>
        <p class="text-sm leading-relaxed text-zinc-600">
          {t('Describe the device and export a uConfig document. Choose how to start:')}
        </p>
        <div class="mt-5 flex flex-col gap-4">
          {#if savedConfigs.length}
            <div class="flex items-center gap-2">
              <select class="input" bind:value={welcomeSaved}>
                <option value="">{t('Open a saved configuration…')}</option>
                {#each savedConfigs as name}
                  <option value={name}>{name}</option>
                {/each}
              </select>
              <button type="button" class="btn disabled:cursor-not-allowed disabled:opacity-50" disabled={!welcomeSaved} onclick={start_saved}>
                {t('Open')}
              </button>
            </div>
            <div class="flex items-center gap-2">
              <span class="h-px flex-1 bg-zinc-200"></span>
              <span class="text-xs text-zinc-400">{t('or start fresh')}</span>
              <span class="h-px flex-1 bg-zinc-200"></span>
            </div>
          {/if}
          <button type="button" class="btn-primary rounded-md px-3 py-2 text-sm font-medium" onclick={start_default}>
            {t('Start with the default configuration')}
          </button>
          <div class="flex items-center gap-2">
            <span class="h-px flex-1 bg-zinc-200"></span>
            <span class="text-xs text-zinc-400">{t('or start from an example')}</span>
            <span class="h-px flex-1 bg-zinc-200"></span>
          </div>
          <div class="flex items-center gap-2">
            <select class="input" bind:value={welcomeExample}>
              <option value="">{t('Choose an example…')}</option>
              {#each example_names as name}
                <option value={name}>{name}</option>
              {/each}
            </select>
            <button type="button" class="btn disabled:cursor-not-allowed disabled:opacity-50" disabled={!welcomeExample} onclick={start_example}>
              {t('Start')}
            </button>
          </div>
          <div class="flex items-center gap-2">
            <span class="h-px flex-1 bg-zinc-200"></span>
            <span class="text-xs text-zinc-400">{t('or connect to another device')}</span>
            <span class="h-px flex-1 bg-zinc-200"></span>
          </div>
          <form class="flex items-center gap-2" onsubmit={(e) => { e.preventDefault(); host_connect() }}>
            <input class="input" type="text" autocomplete="off" placeholder={t('IP to connect to')} bind:value={host} />
            <button type="submit" class="btn disabled:cursor-not-allowed disabled:opacity-50" disabled={!host.trim()}>
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
  {:else if screen === 'login'}
    <div class="flex flex-1 items-center justify-center overflow-y-auto p-4">
      <div class="w-full max-w-lg rounded-lg border border-zinc-200 bg-surface p-6 shadow-sm">
        <div class="mb-4 flex items-start justify-between gap-4">
          <div>
            <h1 class="text-lg font-semibold tracking-tight">{t('Log in')}</h1>
            <p class="mt-1 text-sm text-zinc-500">{settings.host}</p>
          </div>
        </div>
        {#if connState === 'connecting'}
          <div class="flex flex-col items-center gap-3 py-8 text-sm text-zinc-500">
            <Spinner class="h-6 w-6 text-zinc-400" />
            <span>{t('Connecting to the device…')}</span>
          </div>
        {:else if connState === 'error'}
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
  {:else if screen === 'device'}
    <header class="flex-shrink-0 border-b border-zinc-200 bg-surface/90 backdrop-blur">
      <div class="relative mx-auto max-w-5xl px-4 py-3 text-center">
        <h1 class="text-base font-semibold tracking-tight">{capabilities.data?.capabilities?.model ?? t('Device')}</h1>
        <p class="text-xs text-zinc-500">{settings.host}</p>
      </div>
    </header>
    {#if view.mode === 'cards'}
      <main class="flex-1 overflow-y-auto">
        <DeviceCards onConfigure={() => (screen = 'builder')} />
      </main>
    {:else}
      <div class="mx-auto flex w-full max-w-5xl flex-1 gap-4 overflow-hidden px-4">
        <aside class="w-44 flex-shrink-0 overflow-y-auto py-6">
          <nav class="flex h-full flex-col gap-1">
            <button
              type="button"
              class="rounded px-3 py-2 text-left text-sm font-medium transition {devicePage === 'network' ? 'bg-accent text-accent-ink' : 'text-zinc-700 hover:bg-zinc-200'}"
              onclick={() => (devicePage = 'network')}
            >{t('Network')}</button>
            <button
              type="button"
              class="rounded px-3 py-2 text-left text-sm font-medium transition {devicePage === 'state' ? 'bg-accent text-accent-ink' : 'text-zinc-700 hover:bg-zinc-200'}"
              onclick={() => (devicePage = 'state')}
            >{t('State')}</button>
            <button
              type="button"
              class="rounded px-3 py-2 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-200"
              onclick={() => (screen = 'builder')}
            >{t('Configure')}</button>
            <button
              type="button"
              class="rounded px-3 py-2 text-left text-sm font-medium transition {devicePage === 'system' ? 'bg-accent text-accent-ink' : 'text-zinc-700 hover:bg-zinc-200'}"
              onclick={() => (devicePage = 'system')}
            >{t('System')}</button>
          </nav>
        </aside>
        <main class="flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto py-6">
          {#if devicePage === 'network'}
            <NetworkPage />
          {:else if devicePage === 'state'}
            <StatePage />
          {:else}
            <SystemPage />
          {/if}
        </main>
      </div>
    {/if}
  {:else}
  <header class="flex-shrink-0 border-b border-zinc-200 bg-surface/90 backdrop-blur">
    <div class="relative mx-auto {view.mode === 'cards' ? 'max-w-3xl' : 'max-w-5xl'} px-4 py-3 text-center">
      <h1 class="text-base font-semibold tracking-tight">{t('uConfig builder')}</h1>
      <p class="text-xs text-zinc-500">
        {t('Intent-based OpenWrt configuration')}
        {#if store.loadedFrom}<span class="text-zinc-400"> · {store.loadedFrom}</span>{/if}
      </p>
    </div>
  </header>

  {#if view.mode === 'cards'}
    <main class="flex-1 overflow-y-auto">
      <div class="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-6">
      {#if deviceSession}
        <button type="button" class="self-start text-sm font-medium text-zinc-500 hover:text-zinc-800" onclick={back_to_device}>← {t('Back')}</button>
      {/if}
      <Card title={t('Unit')} subtitle={t('Device identity')}>
        {#snippet children()}{@render unitBody()}{/snippet}
      </Card>
      <Card title={t('Radios')} subtitle={t('Physical radios by band label')}>
        {#snippet children()}{@render radiosBody()}{/snippet}
      </Card>
      <Card title={t('Interfaces')} subtitle={t('Logical networks, SSIDs, ports')}>
        {#snippet children()}{@render interfacesBody()}{/snippet}
      </Card>
      <Card title={t('Services')} subtitle={t('SSH, mDNS, LLDP, RADIUS, …')}>
        {#snippet children()}{@render servicesBody()}{/snippet}
      </Card>
      <Card title={t('Configuration')} badge={changes.length || null}>
        {#snippet children()}{@render changesBody()}{/snippet}
      </Card>
      </div>
    </main>
  {:else}
    <div class="mx-auto flex w-full max-w-5xl flex-1 gap-4 overflow-hidden px-4">
      <aside class="w-44 flex-shrink-0 overflow-y-auto py-6">
        <nav class="flex flex-col gap-1">
          {#if deviceSession}
            <button type="button" class="mb-1 flex items-center gap-2 rounded px-3 py-2 text-left text-sm font-medium text-zinc-500 hover:bg-zinc-200" onclick={back_to_device}>
              <span aria-hidden="true">←</span>{t('Back')}
            </button>
          {/if}
          {#each sections as s}
            <button
              type="button"
              class="flex items-center justify-between gap-2 rounded px-3 py-2 text-left text-sm font-medium transition {view.section === s.key ? 'bg-accent text-accent-ink' : 'text-zinc-700 hover:bg-zinc-200'}"
              onclick={() => (view.section = s.key)}
            >
              <span>{t(s.title)}</span>
              {#if s.key === 'changes' && changes.length}
                <span class="inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold {view.section === s.key ? 'bg-accent-ink text-accent' : 'bg-accent text-accent-ink'}">
                  {changes.length}
                </span>
              {/if}
            </button>
          {/each}
        </nav>
      </aside>
      <main class="flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto py-6">
        {#if active.card}
          <div class="rounded-lg border border-zinc-200 bg-surface p-4">{@render bodyFor(view.section)}</div>
        {:else}
          {@render bodyFor(view.section)}
        {/if}
      </main>
    </div>
  {/if}
  {/if}

  <ConfirmModal />
</div>
