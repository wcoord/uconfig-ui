// SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>
//
// SPDX-License-Identifier: GPL-2.0-only

// Static port capabilities until real device detection is added: 1 WAN + 4 LAN.
export const PORT_CAPS = ['wan', 'lan1', 'lan2', 'lan3', 'lan4']

// Which physical ports a port key covers. Wildcards (wan*, lan*) cover the whole
// matching group; a discrete key covers just itself. `list` is the active port
// set (device-derived when connected, PORT_CAPS otherwise).
export function port_cover(key, list = PORT_CAPS) {
  if (key.endsWith('*')) {
    const prefix = key.slice(0, -1)
    return list.filter((p) => p.startsWith(prefix))
  }
  return [key]
}

// Without a VLAN the render pipeline ignores tagging, so a port is always an
// untagged access port. With a VLAN, "auto" tags on upstream and leaves
// untagged on downstream; explicit modes are used as-is.
export function effective_tag(mode, role, hasVlan) {
  if (!hasVlan) return 'un-tagged'
  if (mode === 'auto') return role === 'upstream' ? 'tagged' : 'un-tagged'
  return mode
}
