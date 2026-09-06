// SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>
//
// SPDX-License-Identifier: GPL-2.0-only

import { ref_resolve, def_get, title_for } from './schema.js'
import { default_width } from './channels.js'

// Reduce a value to a default-stripped, empty-pruned canonical form so that
// defaults the UI materialises while a section is merely viewed do not register
// as edits. Only values the user has actually changed away from their default
// survive.
function strip(value, schema) {
  schema = schema ? ref_resolve(schema) : null
  if (Array.isArray(value)) return value.length ? value : undefined
  if (value && typeof value === 'object') {
    const props = schema?.properties ?? {}
    const ppNode = schema?.patternProperties
    const ppS = ppNode ? ref_resolve(Object.values(ppNode)[0]) : null
    const out = {}
    for (const [k, v] of Object.entries(value)) {
      const cs = props[k] ? ref_resolve(props[k]) : ppS
      const sv = strip(v, cs)
      if (sv === undefined) continue
      if (cs && sv === cs.default) continue
      out[k] = sv
    }
    return Object.keys(out).length ? out : undefined
  }
  if (value === '' || value == null) return undefined
  return value
}

function clean(obj) {
  if (!obj) return undefined
  for (const k of Object.keys(obj)) if (obj[k] === undefined) delete obj[k]
  return Object.keys(obj).length ? obj : undefined
}

function canon_unit(u) {
  return strip(u, def_get('unit'))
}

function canon_radio(r, band) {
  const s = strip(r, def_get('radio'))
  if (!s) return undefined
  if (s.channel === 'auto') delete s.channel
  if (s['tx-power'] === 30) delete s['tx-power']
  if (s['channel-width'] === default_width(band)) delete s['channel-width']
  return clean(s)
}

function canon_iface(iface) {
  if (!iface) return undefined
  const { ssids, ...rest } = iface
  const s = strip(rest, def_get('interface')) ?? {}
  const def = iface.role === 'downstream' ? 'static' : 'dynamic'
  for (const key of ['ipv4', 'ipv6']) {
    if (s[key] && typeof s[key] === 'object' && s[key].addressing === def) delete s[key].addressing
  }
  const dhcpv6 = s.ipv6?.dhcpv6
  if (dhcpv6 && typeof dhcpv6 === 'object') {
    if (dhcpv6.mode === 'hybrid') delete dhcpv6.mode
    if (!Object.keys(dhcpv6).length) delete s.ipv6.dhcpv6
  }
  for (const key of ['ipv4', 'ipv6']) {
    if (s[key] && typeof s[key] === 'object' && !Object.keys(s[key]).length) delete s[key]
  }
  return clean(s)
}

function canon_ssid(ssid) {
  const s = strip(ssid, def_get('interface.ssid'))
  if (!s) return undefined
  if (s.template && typeof s.template === 'object') {
    if (s.template.mode === 'encrypted') delete s.template.mode
    if (s.template.security === 'maximum') delete s.template.security
    if (!Object.keys(s.template).length) delete s.template
  }
  return clean(s)
}

function eq(a, b) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
}

function keys_union(a, b) {
  return [...new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})])].sort()
}

export function changes_list(cur, base) {
  if (!cur || !base) return []
  const out = []

  if (!eq(canon_unit(cur.unit), canon_unit(base.unit))) {
    out.push({ section: 'Unit', label: 'Unit' })
  }

  for (const band of keys_union(cur.radios, base.radios)) {
    if (!eq(canon_radio(cur.radios?.[band], band), canon_radio(base.radios?.[band], band))) {
      out.push({ section: 'Radios', label: `Radio ${band}` })
    }
  }

  for (const name of keys_union(cur.interfaces, base.interfaces)) {
    const ci = cur.interfaces?.[name]
    const bi = base.interfaces?.[name]
    if (!eq(canon_iface(ci), canon_iface(bi))) {
      out.push({ section: 'Interfaces', label: `Interface ${name}` })
    }
    for (const ssid of keys_union(ci?.ssids, bi?.ssids)) {
      if (!eq(canon_ssid(ci?.ssids?.[ssid]), canon_ssid(bi?.ssids?.[ssid]))) {
        out.push({ section: 'Interfaces', label: `SSID ${name} / ${ssid}` })
      }
    }
  }

  const svcDef = ref_resolve(def_get('service'))
  for (const svc of keys_union(cur.services, base.services)) {
    const schema = svcDef?.properties?.[svc] ? ref_resolve(svcDef.properties[svc]) : null
    if (!eq(strip(cur.services?.[svc], schema), strip(base.services?.[svc], schema))) {
      out.push({ section: 'Services', label: `Service ${title_for(svc)}` })
    }
  }

  return out
}
