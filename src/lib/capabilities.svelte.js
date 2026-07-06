// Device capabilities pulled from the websocket `capabilities` method while
// connected (standalone mode). When loaded, these drive the radio mode/width
// options and the interface port list; otherwise the static defaults apply.

import { width_options } from './channels.js'
import { PORT_CAPS } from './ports.js'
import { def_get } from './schema.js'

const radioDef = def_get('radio');
const MODE_ORDER = radioDef.properties['channel-mode'].enum;

// Raw `{ capabilities, wiphy }` result, or null when not connected to a device.
export const capabilities = $state({ data: null })

export function capabilities_set(result) {
  capabilities.data = result ?? null
}

export function capabilities_clear() {
  capabilities.data = null
}

function band_info(band) {
  const key = String(band).toUpperCase()
  const phys = capabilities.data?.wiphy
  if (!Array.isArray(phys)) return null
  for (const phy of phys) {
    const b = phy?.bands?.[key]
    if (b) return b
  }
  return null
}

// Channel widths the hardware supports for a band, else the static fallback.
export function band_widths(band) {
  return band_info(band)?.widths ?? width_options(band)
}

// 802.11 mode families (HT/VHT/HE/EHT) derived from the hardware's per-band
// mode list (e.g. "HE40" -> "HE"), else the full set.
export function band_modes(band) {
  const modes = band_info(band)?.modes
  if (!modes) return MODE_ORDER
  const families = new Set()
  for (const m of modes) {
    const fam = String(m).match(/^[A-Z]+/)?.[0]
    if (fam) families.add(fam)
  }
  const out = MODE_ORDER.filter((m) => families.has(m))
  return out.length ? out : MODE_ORDER
}

// Port keys from the device's wan/lan ethernet roles, else the static fallback.
export function device_ports() {
  const net = capabilities.data?.capabilities?.network
  if (!net) return PORT_CAPS
  const out = []
  const wan = Array.isArray(net.wan) ? net.wan : []
  const lan = Array.isArray(net.lan) ? net.lan : []
  if (wan.length === 1) out.push('wan')
  else wan.forEach((_, i) => out.push(`wan${i + 1}`))
  lan.forEach((_, i) => out.push(`lan${i + 1}`))
  return out.length ? out : PORT_CAPS
}
