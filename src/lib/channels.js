// SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>
//
// SPDX-License-Identifier: GPL-2.0-only

// Valid control/primary channels per band and bandwidth.
//
// The width-specific lists are ported verbatim from the device render code
// (uconfig-new modules/state/usr/share/ucode/uconfig/state/radios.uc, the
// `bandwidths` table). On the device those lists are intersected with the
// channels the hardware actually reports; the builder has no hardware to query,
// so it offers every theoretically valid channel for the band.

const ALL_20 = {
  '2G': Array.from({ length: 13 }, (_, i) => i + 1),
  '5G': [
    36, 40, 44, 48, 52, 56, 60, 64, 100, 104, 108, 112, 116, 120, 124, 128, 132,
    136, 140, 144, 149, 153, 157, 161, 165, 169, 173, 177
  ]
}

// 6 GHz Preferred Scanning Channels (PSC). On 6 GHz we only offer PSC channels.
const PSC_6G = [5, 21, 37, 53, 69, 85, 101, 117, 133, 149, 165, 181, 197, 213, 229]

const WIDTH = {
  '2G': {
    40: [1, 9]
  },
  '5G': {
    40: [36, 44, 52, 60, 100, 108, 116, 124, 132, 140, 149, 157, 165, 173, 184, 192],
    80: [36, 52, 100, 116, 132, 149],
    160: [36, 100]
  }
}

const WIDTHS = {
  '2G': [20, 40],
  '5G': [20, 40, 80, 160],
  '6G': [20, 40, 80, 160, 320]
}

export function width_options(band) {
  return WIDTHS[String(band).toUpperCase()] ?? [20, 40, 80, 160]
}

export function default_width(band) {
  return String(band).toUpperCase() === '2G' ? 20 : 80
}

// Dynamic per-field visibility for the radio editor. Static drops
// (require-mode, rates, maximum-clients, valid-channels, band) are handled via
// skipKeys; this covers the rules that depend on band/width/channel-mode.
export function radio_field_hidden(obj, band, key) {
  band = String(band).toUpperCase()
  if (key === 'allow-dfs') {
    if (band !== '5G') return true
    return (obj['channel-width'] ?? default_width(band)) === 160
  }
  if (key === 'legacy-rates') return band !== '2G'
  if (key === 'he-multiple-bssid') {
    const mode = obj['channel-mode'] ?? 'HE'
    return !(mode === 'HE' || mode === 'EHT')
  }
  return false
}

export function channel_options(band, width) {
  band = String(band).toUpperCase()
  if (band === '6G') return PSC_6G
  const w = Number(width) || 20
  if (w === 20) return ALL_20[band] ?? []
  return WIDTH[band]?.[w] ?? []
}
