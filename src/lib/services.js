// SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>
//
// SPDX-License-Identifier: GPL-2.0-only

// Hardcoded set of services available in headless mode. Later this will be
// replaced by the list of services actually installed on a connected device.
//
//  - builtin: always present (templates/services on the device).
//  - config:  the key in the top-level `services` schema, or null if the
//             service has no configuration block.
//  - iface:   interface selectability - true (any), false (not per-interface),
//             or 'downstream' (downstream interfaces only).
export const SERVICES = [
  { name: 'ssh', builtin: true, config: 'ssh', iface: true },
  { name: 'log', builtin: true, config: 'log', iface: false },
  { name: 'radius-server', builtin: true, config: 'radius-server', iface: true },
  { name: 'ntp', builtin: true, config: null, iface: false },
  { name: 'adguardhome', builtin: false, config: 'adguardhome', iface: 'downstream' },
  { name: 'ieee8021x', builtin: false, config: 'ieee8021x', iface: true },
  { name: 'lldp', builtin: false, config: 'lldp', iface: true },
  { name: 'mdns', builtin: false, config: 'mdns', iface: true },
  { name: 'quality-of-service', builtin: false, config: 'quality-of-service', iface: false },
  { name: 'tailscale', builtin: false, config: 'tailscale', iface: true },
  { name: 'fingerprint', builtin: false, config: null, iface: true },
  { name: 'nlbwmon', builtin: false, config: null, iface: true },
  { name: 'samba4', builtin: false, config: null, iface: true },
  { name: 'state', builtin: false, config: null, iface: false },
  { name: 'ucoord', builtin: false, config: null, iface: false },
  { name: 'webui', builtin: false, config: null, iface: false }
]

// Service names selectable on an interface with the given role.
export function interface_services(role) {
  return SERVICES.filter((s) => s.iface === true || (s.iface === 'downstream' && role === 'downstream')).map(
    (s) => s.name
  )
}

// Config-schema keys for services that are available and configurable.
export const SERVICE_CONFIG_KEYS = SERVICES.filter((s) => s.config).map((s) => s.config)
