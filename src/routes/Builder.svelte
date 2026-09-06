<!--
SPDX-FileCopyrightText: 2026 Zach Mandeville <webmaster@coolguy.website>

SPDX-License-Identifier: GPL-2.0-only
-->

<script>
  import { push } from 'svelte-spa-router'
  import { view } from '../lib/view.svelte.js'
  import { t } from '../lib/i18n.svelte.js'
  import { changes_list } from '../lib/changes.js'
  import { def_get } from '../lib/schema.js'
  import { default_width } from '../lib/channels.js'
  import {
    store,
    doc_export
  } from '../lib/store.svelte.js'
  import {
    unitLayout,
    radioLayout,
    interfaceLayout,
    servicesLayout
  } from '../lib/layouts.js'
  import {
    capabilities
  } from '../lib/capabilities.svelte.js'

  import Card from '../lib/components/Card.svelte'
  import LayoutRenderer from '../lib/components/LayoutRenderer.svelte'
  import MapEditor from '../lib/components/MapEditor.svelte'
  import ConfigurationPanel from '../lib/components/ConfigurationPanel.svelte'
  import InterfaceAddForm from '../lib/components/InterfaceAddForm.svelte'

  const unitDef = def_get('unit')
  const radioDef = def_get('radio')
  const interfaceDef = def_get('interface')
  const serviceDef = def_get('service')

  let deviceSession = $state(false) // logged into a device (survives idle disconnects)
  const sections = [
    { key: 'unit', title: 'Unit', subtitle: 'Device identity', card: true },
    { key: 'radios', title: 'Radios', subtitle: 'Physical radios by band label' },
    { key: 'interfaces', title: 'Interfaces', subtitle: 'Logical networks, SSIDs, ports' },
    { key: 'services', title: 'Services', subtitle: 'SSH, mDNS, LLDP, RADIUS, …' },
    { key: 'changes', title: 'Configuration' }
  ]

  const changes = $derived(changes_list(store.doc, store.baseline))
  const active = $derived(sections.find((s) => s.key === view.section) ?? sections[0])
  const radiosLocked = $derived(capabilities.data != null)
  const preview = $derived(doc_export())


  function radio_defaults(band) {
    const defaultChannel = radioDef.properties['channel-mode'].default;
    return {
      'channel-mode': defaultChannel,
      'channel-width': default_width(band)
    }
  }

  function back_to_device() {
    push('#/device')
  }
</script>

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