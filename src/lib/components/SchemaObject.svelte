<!--
SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>

SPDX-License-Identifier: GPL-2.0-only
-->

<script>
  import Field from './Field.svelte'
  import ArrayListField from './ArrayListField.svelte'
  import MapEditor from './MapEditor.svelte'
  import Self from './SchemaObject.svelte'
  import AddButton from './AddButton.svelte'
  import RemoveButton from './RemoveButton.svelte'
  import { ref_resolve, pattern_value_schema, title_for } from '../schema.js'
  import { confirm } from '../confirm.svelte.js'
  import { t } from '../i18n.svelte.js'
  import { DESCRIPTIONS } from '../descriptions.js'

  let { obj, schema } = $props()

  const entries = $derived(build(schema))

  function build(s) {
    const props = ref_resolve(s)?.properties ?? {}
    return Object.entries(props).map(([key, raw]) => {
      const sc = ref_resolve(raw)
      return { key, schema: sc, kind: classify(sc) }
    })
  }

  function classify(s) {
    if (s.patternProperties) return 'map'
    if (s.type === 'object' || s.properties) return 'object'
    const br = s.anyOf || s.oneOf
    if (br && br.map(ref_resolve).find((b) => b.type === 'object' || b.properties || b.patternProperties))
      return 'object'
    if (s.type === 'array') return 'array'
    return 'scalar'
  }

  function objBranchSchema(s) {
    if (s.type === 'object' || s.properties) return s
    const br = s.anyOf || s.oneOf || []
    return br.map(ref_resolve).find((b) => b.type === 'object' || b.properties) ?? s
  }

  function add_object(key) {
    obj[key] = {}
  }
  async function remove_object(key) {
    if (!(await confirm(t('Remove "{name}"?', { name: t(title_for(key)) })))) return
    delete obj[key]
  }
</script>

<div class="flex flex-col gap-4">
  {#each entries as e (e.key)}
    {#if e.kind === 'array'}
      <ArrayListField {obj} key={e.key} schema={e.schema} describe={DESCRIPTIONS[e.key] ?? null} />
    {:else if e.kind === 'scalar'}
      <Field {obj} key={e.key} schema={e.schema} describe={DESCRIPTIONS[e.key] ?? null} />
    {:else if e.kind === 'map'}
      {@const vs = pattern_value_schema(e.schema)}
      <MapEditor parent={obj} mapKey={e.key} valueSchema={vs}>
        {#snippet item(entry)}
          <Self obj={entry} schema={vs} />
        {/snippet}
      </MapEditor>
    {:else}
      {@const child = obj[e.key]}
      <div class="rounded-md border border-zinc-200 bg-surface">
        <div class="flex items-center gap-2 px-3 py-2">
          <span class="flex-1 text-xs font-semibold uppercase tracking-wide text-zinc-600">
            {t(title_for(e.key))}
          </span>
          {#if child === undefined || child === null}
            <AddButton onclick={() => add_object(e.key)} />
          {:else}
            <RemoveButton onclick={() => remove_object(e.key)} />
          {/if}
        </div>
        {#if child !== undefined && child !== null}
          <div class="px-3 pb-3">
            <Self obj={obj[e.key]} schema={objBranchSchema(e.schema)} />
          </div>
        {/if}
      </div>
    {/if}
  {/each}
</div>
