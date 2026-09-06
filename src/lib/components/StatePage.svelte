<!--
SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>

SPDX-License-Identifier: GPL-2.0-only
-->

<script>
  import { request as ws_request } from '../connection.svelte.js'
  import { capabilities } from '../capabilities.svelte.js'
  import { t } from '../i18n.svelte.js'

  let info = $state(null)
  let error = $state(null)

  const model = $derived(capabilities.data?.capabilities?.model)
  const mem = $derived(info?.memory)
  const memUsed = $derived(mem ? mem.total - mem.available : null)
  const memPct = $derived(mem && mem.total ? Math.round((memUsed / mem.total) * 100) : 0)

  function fmt_uptime(s) {
    if (s == null) return '—'
    const d = Math.floor(s / 86400)
    const h = Math.floor((s % 86400) / 3600)
    const m = Math.floor((s % 3600) / 60)
    const parts = []
    if (d) parts.push(`${d}d`)
    if (d || h) parts.push(`${h}h`)
    parts.push(`${m}m`)
    return parts.join(' ')
  }

  function fmt_bytes(b) {
    if (b == null) return '—'
    const u = ['B', 'KB', 'MB', 'GB', 'TB']
    let i = 0
    let v = b
    while (v >= 1024 && i < u.length - 1) {
      v /= 1024
      i++
    }
    return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${u[i]}`
  }

  // ubus loadavg is fixed-point, scaled by 1<<16.
  const load = $derived((info?.load ?? []).map((v) => (v / 65536).toFixed(2)))

  function storage_pct(s) {
    return s && s.total ? Math.round((s.used / s.total) * 100) : 0
  }

  async function refresh() {
    try {
      info = await ws_request('system-info', {})
      error = null
    } catch (e) {
      error = e?.message || String(e)
    }
  }

  $effect(() => {
    refresh()
    const iv = setInterval(refresh, 5000)
    return () => clearInterval(iv)
  })
</script>

{#snippet bar(pct)}
  <div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-200">
    <div class="h-full rounded-full bg-accent" style="width: {Math.min(100, Math.max(0, pct))}%"></div>
  </div>
{/snippet}

{#if error && !info}
  <div class="rounded-lg border border-zinc-200 bg-surface p-4 text-sm text-red-600">{error}</div>
{/if}

<div class="grid gap-4 sm:grid-cols-2">
  <div class="rounded-lg border border-zinc-200 bg-surface p-4">
    <h3 class="text-sm font-semibold text-zinc-900">{t('Device')}</h3>
    <dl class="mt-2 space-y-1 text-sm">
      <div class="flex justify-between gap-4"><dt class="text-zinc-500">{t('Model')}</dt><dd class="text-zinc-800">{model ?? '—'}</dd></div>
      <div class="flex justify-between gap-4"><dt class="text-zinc-500">{t('Uptime')}</dt><dd class="text-zinc-800">{fmt_uptime(info?.uptime)}</dd></div>
    </dl>
  </div>

  <div class="rounded-lg border border-zinc-200 bg-surface p-4">
    <h3 class="text-sm font-semibold text-zinc-900">{t('CPU load')}</h3>
    <dl class="mt-2 space-y-1 text-sm">
      <div class="flex justify-between gap-4"><dt class="text-zinc-500">{t('1 min')}</dt><dd class="font-mono text-zinc-800">{load[0] ?? '—'}</dd></div>
      <div class="flex justify-between gap-4"><dt class="text-zinc-500">{t('5 min')}</dt><dd class="font-mono text-zinc-800">{load[1] ?? '—'}</dd></div>
      <div class="flex justify-between gap-4"><dt class="text-zinc-500">{t('15 min')}</dt><dd class="font-mono text-zinc-800">{load[2] ?? '—'}</dd></div>
    </dl>
  </div>

  <div class="rounded-lg border border-zinc-200 bg-surface p-4">
    <h3 class="text-sm font-semibold text-zinc-900">{t('Memory')}</h3>
    <p class="mt-2 text-sm text-zinc-800">{fmt_bytes(memUsed)} / {fmt_bytes(mem?.total)} <span class="text-zinc-500">({memPct}%)</span></p>
    {@render bar(memPct)}
  </div>

  <div class="rounded-lg border border-zinc-200 bg-surface p-4">
    <h3 class="text-sm font-semibold text-zinc-900">{t('Storage')}</h3>
    <div class="mt-2 text-sm">
      <div class="flex justify-between gap-4"><span class="text-zinc-500">{t('Overlay')}</span><span class="text-zinc-800">{fmt_bytes((info?.root?.used ?? 0) * 1024)} / {fmt_bytes((info?.root?.total ?? 0) * 1024)}</span></div>
      {@render bar(storage_pct(info?.root))}
      <div class="mt-2 flex justify-between gap-4"><span class="text-zinc-500">{t('Temp')}</span><span class="text-zinc-800">{fmt_bytes((info?.tmp?.used ?? 0) * 1024)} / {fmt_bytes((info?.tmp?.total ?? 0) * 1024)}</span></div>
      {@render bar(storage_pct(info?.tmp))}
    </div>
  </div>
</div>
