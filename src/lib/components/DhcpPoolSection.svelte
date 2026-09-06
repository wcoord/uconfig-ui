<!--
SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>

SPDX-License-Identifier: GPL-2.0-only
-->

<script>
  import CollapsibleSection from './CollapsibleSection.svelte'
  import Field from './Field.svelte'
  import LeasesField from './LeasesField.svelte'
  import { def_get, ref_resolve } from '../schema.js'
  import { t } from '../i18n.svelte.js'
  import { DESCRIPTIONS } from '../descriptions.js'

  let { ipv4 } = $props()

  const poolDef = ref_resolve(def_get('interface.ipv4.dhcp-pool'))

  // Downstream interfaces always have a DHCP pool.
  $effect(() => {
    if (ipv4['dhcp-pool'] == null) ipv4['dhcp-pool'] = {}
  })
</script>

<CollapsibleSection title={t('DHCP Pool')}>
  {#snippet children()}
    {@const pool = ipv4['dhcp-pool']}
    {#if pool}
      <div class="flex flex-col gap-4">
        <Field obj={pool} key="lease-first" schema={poolDef.properties['lease-first']} describe={DESCRIPTIONS['lease-first']} />
        <Field obj={pool} key="lease-count" schema={poolDef.properties['lease-count']} describe={DESCRIPTIONS['lease-count']} />
        <Field obj={pool} key="lease-time" schema={poolDef.properties['lease-time']} describe={DESCRIPTIONS['lease-time']} />
        <LeasesField container={ipv4} subnet={ipv4.subnet} />
      </div>
    {/if}
  {/snippet}
</CollapsibleSection>
