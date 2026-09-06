// SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>
//
// SPDX-License-Identifier: GPL-2.0-only

// Inline descriptions for schema-auto-rendered fields (SchemaObject), keyed by
// property key. Values are short keys; en-GB.json holds the verbose wording.
// Layout-driven fields carry their own describe in layouts.js; this covers the
// fields that have no layout entry (quality-of-service, RADIUS-server users,
// DHCP pool and similar nested objects).
export const DESCRIPTIONS = {
  // quality-of-service
  services: 'Named services to classify.',
  'bulk-detection': 'Auto-classify bulk flows.',
  classifier: 'Custom traffic classifiers.',
  dscp: 'DSCP for matching packets.',
  'packets-per-second': 'PPS that marks a bulk flow.',
  ports: 'Protocol/port match rules.',
  dns: 'FQDN match rules.',
  // dhcp pool
  'lease-first': 'First pool address (last octet).',
  'lease-count': 'Addresses in the pool.',
  'lease-time': 'Lease validity.',
  // radius-server users
  'auth-type': 'Authentication type.',
  password: 'User password.',
  'vlan-id': 'VLAN ID for this user.',
  'rate-limit-upload': 'Upload limit (kbps).',
  'rate-limit-download': 'Download limit (kbps).'
}
