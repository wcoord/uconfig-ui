<!--
SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>

SPDX-License-Identifier: GPL-2.0-only
-->

<script>
  import { title_for } from '../schema.js'
  import { t } from '../i18n.svelte.js'

  let { obj, key, schema, label = null, required = false, fallback = undefined, describe = null } = $props()

  const fid = $props.id()
  const value = $derived(obj[key])
  const missing = $derived(required && (value === undefined || value === null || value === ''))
  const isSecret = $derived(/password|passphrase|psk|secret/i.test(key) || key === 'key')
  let show = $state(false)
  const lbl = $derived(t(label ?? title_for(key)))
  const desc = $derived(t(clean(describe), { value }))
  const kind = $derived(classify(schema))

  const enumDefault = $derived(
    fallback ?? schema.default ?? (Array.isArray(schema.enum) ? schema.enum[0] : undefined)
  )

  // Persist defaults so the document matches what the UI shows: toggles and
  // enums always have a value, and any field with a schema/layout default is
  // pre-populated.
  $effect(() => {
    if (obj[key] !== undefined) return
    if (kind === 'boolean') obj[key] = (fallback ?? schema.default) ?? false
    else if (kind === 'enum') {
      if (enumDefault !== undefined) obj[key] = enumDefault
    } else if (kind !== 'array') {
      const d = fallback ?? schema.default
      if (d !== undefined) obj[key] = d
    }
  })

  function clean(d) {
    if (!d) return ''
    return String(d).replace(/\s+/g, ' ').trim()
  }

  function classify(s) {
    if (Array.isArray(s.enum)) return 'enum'
    if (s.type === 'boolean') return 'boolean'
    if (s.type === 'integer' || s.type === 'number') return 'number'
    if (s.type === 'array') return 'array'
    if (s.type === 'string') return 'string'
    if (s.anyOf || s.oneOf) return 'scalar-union'
    return 'string'
  }

  function set(v) {
    if (v === '' || v === undefined || v === null) delete obj[key]
    else obj[key] = v
  }

  function onText(e) {
    set(e.target.value)
  }
  function onNumber(e) {
    const v = e.target.value
    if (v === '') return set('')
    const n = Number(v)
    set(Number.isNaN(n) ? v : n)
  }
  function onEnum(e) {
    set(e.target.value)
  }
  function onUnion(e) {
    const v = e.target.value
    if (v === '') return set('')
    set(/^-?\d+$/.test(v) ? Number(v) : v)
  }

  const itemNumeric = $derived(
    schema.type === 'array' && /number|integer/.test(schema.items?.type ?? '')
  )
  const arrayText = $derived(Array.isArray(value) ? value.join('\n') : '')
  function onArray(e) {
    const lines = e.target.value
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length)
    if (!lines.length) return set('')
    obj[key] = itemNumeric ? lines.map(Number) : lines
  }
</script>

<div class="flex flex-col gap-1">
  {#if kind !== 'boolean'}
    <label for={fid} class="text-xs font-medium text-zinc-700 flex items-baseline gap-2">
      <span>{lbl}{#if required}<span class="text-red-500"> *</span>{/if}</span>
    </label>
  {/if}

  {#if kind === 'enum'}
    <select id={fid} class="input" value={value ?? enumDefault ?? ''} onchange={onEnum}>
      {#each schema.enum as opt}
        <option value={opt}>{t(opt)}</option>
      {/each}
    </select>
  {:else if kind === 'boolean'}
    {@const on = value === undefined ? schema.default === true : value === true}
    <div class="flex items-center gap-2">
      <button
        id={fid}
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={lbl}
        onclick={() => set(!on)}
        class="relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition {on ? 'bg-emerald-500' : 'bg-zinc-300'}"
      >
        <span
          class="inline-block h-4 w-4 transform rounded-full bg-surface shadow transition {on ? 'translate-x-4' : 'translate-x-0.5'}"
        ></span>
      </button>
      <label for={fid} class="text-xs font-medium text-zinc-700">{lbl}</label>
    </div>
  {:else if kind === 'number'}
    <input
      id={fid}
      class="input"
      type="number"
      value={value ?? ''}
      min={schema.minimum}
      max={schema.maximum}
      oninput={onNumber}
    />
  {:else if kind === 'array'}
    <textarea
      id={fid}
      class="input font-mono"
      rows="3"
      placeholder={itemNumeric ? 'one number per line' : 'one entry per line'}
      value={arrayText}
      oninput={onArray}
    ></textarea>
  {:else if kind === 'scalar-union'}
    <input id={fid} class="input" type="text" value={value ?? ''} oninput={onUnion} placeholder="number or keyword (e.g. auto)" />
  {:else if isSecret}
    <div class="relative">
      <input
        id={fid}
        class="input pr-9"
        type={show ? 'text' : 'password'}
        autocomplete="off"
        value={value ?? ''}
        maxlength={schema.maxLength}
        oninput={onText}
      />
      <button
        type="button"
        class="absolute inset-y-0 right-0 flex items-center px-2.5 text-zinc-400 hover:text-zinc-700"
        aria-label={show ? 'Hide' : 'Show'}
        onclick={() => (show = !show)}
      >
        {#if show}
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        {:else}
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        {/if}
      </button>
    </div>
  {:else}
    <input
      id={fid}
      class="input"
      value={value ?? ''}
      maxlength={schema.maxLength}
      oninput={onText}
    />
  {/if}

  {#if missing}
    <p class="text-[11px] leading-snug text-amber-600">{t('Required')}</p>
  {/if}
  {#if desc}
    <p class="text-[11px] leading-snug text-zinc-500">{desc}</p>
  {/if}
</div>
