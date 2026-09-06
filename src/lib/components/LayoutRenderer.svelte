<!--
SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>
SPDX-FileCopyrightText: 2026 Zach Mandeville <webmaster@coolguy.website>

SPDX-License-Identifier: GPL-2.0-only
-->

<script>
 import Field from './Field.svelte'
 import ArrayListField from './ArrayListField.svelte'
 import ChannelField from './ChannelField.svelte'
 import ChannelWidthField from './ChannelWidthField.svelte'
 import ChannelModeField from './ChannelModeField.svelte'
 import TxPowerField from './TxPowerField.svelte'
 import AddressingField from './AddressingField.svelte'
 import AddressingReadonly from './AddressingReadonly.svelte'
 import TimezoneField from './TimezoneField.svelte'
 import DisallowUpstreamSection from './DisallowUpstreamSection.svelte'
 import MapListField from './MapListField.svelte'
 import PortsSection from './PortsSection.svelte'
 import VlanSection from './VlanSection.svelte'
 import DhcpPoolSection from './DhcpPoolSection.svelte'
 import MapEditor from './MapEditor.svelte'
 import CollapsibleSection from './CollapsibleSection.svelte'
 import ToggleSection from './ToggleSection.svelte'
 import NameAddForm from './NameAddForm.svelte'
 import BandsField from './BandsField.svelte'
 import ChoiceListField from './ChoiceListField.svelte'
 import ServicesField from './ServicesField.svelte'
 import AclField from './AclField.svelte'
 import MultiPskField from './MultiPskField.svelte'
 import SchemaObject from './SchemaObject.svelte'
 import Self from './LayoutRenderer.svelte'
 import { ref_resolve, schema_at, pattern_value_schema, title_for } from '../schema.js'
 import { accordion_provide } from '../accordion.svelte.js'

 let { data, schema, layout, context = {} } = $props()

 accordion_provide(true)

 function walk (obj, path, create = false) {
   if (!path) return obj;
   let cur = obj;
   for (const seg of path.split('.')) {
     if (cur[seg] == null) {
       if (!create) return undefined
       cur[seg] = {}
     }
     cur = cur[seg]
   }
   return cur
 }

 // Object sections (e.g. ipv4/ipv6) are always present.
 function extractDeepPaths (node) {
   const paths = [];
   const recurse = (node) => {
     if (node.field) {
       const dot = node.field.lastIndexOf('.');
       if (dot > 0) paths.push(node.field.slice(0,dot))
     }
     if (node.toggleSection) {
       const dot = node.toggleSection.lastIndexOf('.');
       if (dot > 0) paths.push(node.toggleSection.slice(0,dot));
     }
     if (node.objectSection) {
       paths.push(node.objectSection);
     }
     if (node.mapSection) {
       paths.push(node.mapSection)
     }
     if (node.dhcpSection) {
       paths.push('ipv4')
     }
     if (node.disallow) {
       paths.push(node.disallow)
     }
     if (node.children) {
       node.children.forEach(child => recurse(child))
     }
     if (node.item) {
       node.item.forEach(i => recurse(i))
     }
   }
   recurse(node)
   return paths
 }

 // pre-populate the data in the script, not dynamically in the template,
 // to avoid unsafe mutation
 $effect.pre(() => {
   const allPaths = new Set();
   for (const node of layout) {
     for (const path of extractDeepPaths(node)) {
       allPaths.add(path)
     }
   }
   for (const path of allPaths) {
     walk(data,path,true)
   }
 })

 // Keep the document in sync with what is shown: when a node is hidden by its
 // `when` predicate, remove its data so the JSON never carries stale values.
 $effect(() => {
   for (const node of layout) {
     if (node.when && !node.when({ data, context })) {
       for (const p of prune_paths(node)) delete_at(data, p)
     }
   }
 })

 function parent_of (path, create=false) {
   const dot = path.lastIndexOf('.');
   return dot < 0
              ? data
              : walk(data, path.slice(0, dot), create)
 }

 function leaf_of (path) {
   const dot = path.lastIndexOf('.');
   return dot < 0
              ? path
              : path.slice(dot + 1)
 }

 function delete_at(o, path) {
   const segs = path.split('.')
   const last = segs.pop()
   let cur = o
   for (const s of segs) {
     if (cur[s] == null) return
     cur = cur[s]
   }
   delete cur[last]
 }

 function prune_paths(node) {
   if (node.field) return [node.field]
   if (node.objectSection) return [node.objectSection]
   if (node.toggleSection) return [node.toggleSection]
   if (node.mapSection) return [node.mapSection]
   if (node.mapList) return [node.mapList]
   if (node.multiPsk) return ['multi-psk']
   if (node.disallow) return [`${node.disallow}.disallow-upstream-subnet`]
   if (node.dhcpSection) return ['ipv4.dhcp-pool', 'ipv4.dhcp-leases']
   return []
 }

 function show (node) {
   return !node.when || node.when({ data, context })
 }

 function req_of (node) {
   return typeof node.required === 'function'
        ? node.required({ data, context })
        : !!node.required
 }

 function obj_branch(s) {
   if (s.type === 'object' || s.properties) return s
   const br = s.anyOf || s.oneOf || []
   return br.map(ref_resolve).find((b) => b.type === 'object' || b.properties) ?? s
 }
</script>

<div class="flex flex-col gap-4">
  {#each layout as node, i (i)}
    {#if show(node)}
      {#if node.field}
        {@const parent = parent_of(node.field, false)}
        {#if parent != null}
          {@const fkey = leaf_of(node.field)}
          {@const fs0 = schema_at(schema, node.field)}
          {@const cur = parent[fkey]}
          {@const enumOpts = node.options
            ? cur != null && !node.options.includes(cur)
            ? [...node.options, cur]
            : node.options
            : null}
          {@const fs = enumOpts ? { ...fs0, enum: enumOpts } : fs0}
          {@const w = node.widget ?? (fs.type === 'array' ? 'list' : 'field')}
          {#if w === 'field'}
            <Field obj={parent} key={fkey} schema={fs} required={req_of(node)} label={node.label ?? null} fallback={node.default} describe={node.describe ?? null} />
          {:else if w === 'list'}
            <ArrayListField obj={parent} key={fkey} schema={fs} label={node.label ?? null} describe={node.describe ?? null} />
          {:else if w === 'channel'}
            <ChannelField obj={parent} schema={fs} band={context.band} describe={node.describe ?? null} />
          {:else if w === 'channel-width'}
            <ChannelWidthField obj={parent} schema={fs} band={context.band} describe={node.describe ?? null} />
          {:else if w === 'channel-mode'}
            <ChannelModeField obj={parent} schema={fs} band={context.band} describe={node.describe ?? null} />
          {:else if w === 'tx-power'}
            <TxPowerField obj={parent} describe={node.describe ?? null} />
          {:else if w === 'addressing'}
            <AddressingField obj={parent} schema={fs} role={context.role} describe={node.describe ?? null} />
          {:else if w === 'addressing-ro'}
            <AddressingReadonly obj={parent} />
          {:else if w === 'timezone'}
            <TimezoneField obj={parent} />
          {:else if w === 'bands'}
            <BandsField obj={parent} {context} />
          {:else if w === 'choice'}
            <ChoiceListField obj={parent} key={fkey} options={node.options ?? []} label={node.label ?? null} />
          {:else if w === 'services'}
            <ServicesField obj={parent} {context} />
          {/if}
        {/if}
      {:else if node.section}
        <CollapsibleSection title={node.section}>
          {#snippet children()}
            <Self {data} {schema} layout={node.children} {context} />
          {/snippet}
        </CollapsibleSection>
      {:else if node.objectSection}
        {@const target = walk(data, node.objectSection, false)}
        {#if target}
          {@const ts = schema_at(schema, node.objectSection)}
          <CollapsibleSection title={node.title ?? title_for(node.objectSection)}>
            {#snippet children()}
              {#if node.children}
                <Self data={target} schema={ts} layout={node.children} {context} />
              {:else}
                <SchemaObject obj={target} schema={ts} />
              {/if}
            {/snippet}
          </CollapsibleSection>
        {/if}
      {:else if node.toggleSection}
        {@const parent = parent_of(node.toggleSection)}
        {#if parent != null}
          {@const tkey = leaf_of(node.toggleSection)}
          {@const ts = obj_branch(schema_at(schema, node.toggleSection))}
          <ToggleSection container={parent} key={tkey} title={node.title ?? title_for(tkey)}>
            {#snippet children()}
              {#if node.children}
                <Self data={parent[tkey]} schema={ts} layout={node.children} {context} />
              {:else}
                <SchemaObject obj={parent[tkey]} schema={ts} />
              {/if}
            {/snippet}
          </ToggleSection>
        {/if}
      {:else if node.mapSection}
        {@const ms = schema_at(schema, node.mapSection)}
        {@const vs = pattern_value_schema(ms)}
        <CollapsibleSection title={node.title ?? title_for(node.mapSection)}>
          {#snippet children()}
            {#if node.tabbed}
              <MapEditor parent={data} mapKey={node.mapSection} valueSchema={vs} keyLabel={node.keyLabel ?? 'entry'} tabbed renamable={node.renamable ?? true}>
                {#snippet item(entry)}
                  {#if node.item}
                    <Self data={entry} schema={vs} layout={node.item} {context} />
                  {:else}
                    <SchemaObject obj={entry} schema={vs} />
                  {/if}
                {/snippet}
                {#snippet addModal({ create, close, map })}
                  <NameAddForm existing={map} keyLabel={node.keyLabel ?? 'entry'} onCreate={create} {close} />
                {/snippet}
              </MapEditor>
          {:else}
              <MapEditor parent={data} mapKey={node.mapSection} valueSchema={vs} keyLabel={node.keyLabel ?? 'entry'} embedded>
                {#snippet item(entry)}
                  {#if node.item}
                    <Self data={entry} schema={vs} layout={node.item} {context} />
                  {:else}
                    <SchemaObject obj={entry} schema={vs} />
                  {/if}
                {/snippet}
              </MapEditor>
            {/if}
          {/snippet}
        </CollapsibleSection>
      {:else if node.aclField}
        <AclField obj={data} />
      {:else if node.multiPsk}
        <MultiPskField obj={data} />
      {:else if node.portsSection}
        <PortsSection iface={data} interfaces={context.allInterfaces ?? {}} selfName={context.selfName} role={context.role} />
      {:else if node.vlanSection}
        {#if data.vlan != null}
          <VlanSection iface={data} interfaces={context.allInterfaces ?? {}} selfName={context.selfName} role={context.role} />
        {/if}
      {:else if node.dhcpSection}
        {@const ipv4 = walk(data, 'ipv4', false)}
        {#if ipv4}
          <DhcpPoolSection {ipv4} />
        {/if}
      {:else if node.mapList}
        {@const vs = pattern_value_schema(schema_at(schema, node.mapList))}
        <MapListField container={data} mapKey={node.mapList} valueSchema={vs} keyLabel={node.keyLabel ?? 'entry'} />
      {:else if node.disallow}
        {@const obj = walk(data, node.disallow, false)}
        {#if obj}
          {@const ds = ref_resolve(schema_at(schema, node.disallow).properties?.['disallow-upstream-subnet'] ?? {})}
          <DisallowUpstreamSection {obj} schema={ds} />
        {/if}
      {/if}
    {/if}
  {/each}
</div>
