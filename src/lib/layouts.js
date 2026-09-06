// SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>
//
// SPDX-License-Identifier: GPL-2.0-only

import { default_width } from './channels.js'
import { SERVICES } from './services.js'

// `when` predicates receive { data, context } where data is the current object
// and context carries { role } (interfaces) or { band } (radios).
// describe: strings are short keys; en-GB.json holds the verbose wording.
const up = ({ context }) => context.role === 'upstream'
const down = ({ context }) => context.role === 'downstream'
const eff_addr = (data, context) => data.addressing ?? (context.role === 'downstream' ? 'static' : 'dynamic')
const isStatic = ({ data, context }) => eff_addr(data, context) === 'static'
const isDynamic = ({ data, context }) => eff_addr(data, context) === 'dynamic'
const upStatic = (ctx) => up(ctx) && isStatic(ctx)

export const unitLayout = [
  { field: 'hostname', describe: 'Device hostname.' },
  { field: 'timezone', widget: 'timezone' },
  { field: 'password', describe: 'Device password (shadow hash).' },
  { field: 'leds-active', describe: 'Force all LEDs off.' },
  { field: 'tty-login', describe: 'Require login on serial ports.' }
]

export const radioLayout = [
  { field: 'channel', widget: 'channel', describe: 'Wireless channel.' },
  { field: 'channel-mode', widget: 'channel-mode', describe: 'Preferred 802.11 mode.' },
  { field: 'channel-width', widget: 'channel-width', describe: 'Channel width.' },
  { field: 'tx-power', widget: 'tx-power', describe: 'Transmit power (dBm).' },
  {
    field: 'he-multiple-bssid',
    describe: 'Use multiple-BSSID beacons.',
    when: ({ data }) => {
      const m = data['channel-mode'] ?? 'HE'
      return m === 'HE' || m === 'EHT'
    }
  },
  { field: 'legacy-rates', describe: 'Allow legacy 802.11b rates.', when: ({ context }) => context.band === '2G' },
  {
    field: 'allow-dfs',
    describe: 'Allow DFS channels.',
    when: ({ data, context }) =>
      context.band === '5G' &&
      (data.channel == null || data.channel === 'auto') &&
      (data['channel-width'] ?? default_width(context.band)) !== 160
  }
]

const ipv4Layout = [
  { field: 'addressing', widget: 'addressing', describe: 'How the IPv4 address is assigned.' },
  { field: 'subnet', required: true, when: isStatic, describe: 'Static IPv4 (CIDR).' },
  { field: 'gateway', required: true, when: upStatic, describe: 'Static IPv4 gateway.' },
  { field: 'use-dns', widget: 'list', when: up, describe: 'DNS servers to use.' },
  { field: 'send-hostname', when: isDynamic, describe: 'Send hostname in DHCP requests.' }
]

const ipv6Layout = [
  { field: 'addressing', widget: 'addressing-ro', when: up },
  { field: 'dhcpv6.mode', label: 'DHCPv6 Mode', when: down, describe: 'DHCPv6 server mode.' },
  { field: 'dhcpv6.announce-dns', label: 'Announce DNS', widget: 'list', when: down, describe: 'DNS servers to announce.' }
]

const ssidMode = (data) => data.template?.mode

const ssidLayout = [
  { field: 'ssid', describe: 'Network name.' },
  {
    field: 'bss-mode',
    options: ['ap', 'wds-ap', 'wds-sta', 'wds-repeater'],
    default: 'ap',
    describe: 'BSS operation mode.'
  },
  {
    field: 'template.mode',
    label: 'Encryption',
    options: ['open', 'encrypted', 'enterprise', 'opportunistic'],
    default: 'encrypted',
    describe: 'Encryption behaviour.'
  },
  {
    field: 'template.security',
    default: 'maximum',
    describe: 'Encryption strength.',
    when: ({ data }) => {
      const m = ssidMode(data)
      return !!m && m !== 'open' && m !== 'opportunistic'
    }
  },
  { field: 'template.key', describe: 'Pre-shared key.', when: ({ data }) => ssidMode(data) === 'encrypted' },
  {
    field: 'template.radius-server',
    describe: 'Enterprise RADIUS server.',
    when: ({ data }) => ssidMode(data) === 'enterprise'
  },
  { field: 'wifi-radios', widget: 'bands' },
  {
    multiPsk: true,
    when: ({ data }) => data.template?.mode === 'encrypted' && data.template?.security === 'legacy'
  },
  { aclField: true },
  { field: 'hidden-ssid', describe: 'Hide the network.' },
  { field: 'isolate-clients', describe: 'Isolate clients from each other.' },
  { field: 'unicast-conversion', describe: 'Convert multicast to unicast.' }
]

export const interfaceLayout = [
  { objectSection: 'ipv4', title: 'IPv4', children: ipv4Layout },
  { objectSection: 'ipv6', title: 'IPv6', children: ipv6Layout },
  { vlanSection: true },
  { mapSection: 'ssids', title: 'SSIDs', keyLabel: 'SSID', tabbed: true, renamable: false, item: ssidLayout },
  { portsSection: true },
  { section: 'Services', children: [{ field: 'services', widget: 'services' }] },
  { dhcpSection: true, when: down },
  { disallow: 'ipv4', when: down }
]

const serviceLayouts = {
  ssh: [
    { field: 'port', describe: 'SSH server port.' },
    { field: 'cli-port', describe: 'CLI-over-SSH port.' },
    { field: 'authorized-keys', widget: 'list', describe: 'Authorised SSH keys.' },
    { field: 'password-authentication', describe: 'Allow password login.' }
  ],
  log: [
    { field: 'host', describe: 'Remote syslog host.' },
    { field: 'port', describe: 'Remote syslog port.' },
    { field: 'proto', describe: 'Syslog transport.' },
    { field: 'size', describe: 'Log buffer size (KiB).' },
    { field: 'priority', describe: 'Minimum syslog priority.' }
  ],
  'radius-server': [
    { field: 'auth-port', describe: 'RADIUS auth port.' },
    { field: 'acct-port', describe: 'RADIUS accounting port.' },
    { field: 'secret', describe: 'Shared RADIUS secret.' },
    { mapList: 'users', keyLabel: 'user' }
  ],
  adguardhome: [
    { field: 'webui-port', describe: 'Web interface port.' },
    { field: 'dns-intercept', describe: 'Intercept DNS traffic.' },
    { field: 'servers', widget: 'list', describe: 'Upstream DNS servers.' }
  ],
  ieee8021x: [{ field: 'radius-server', describe: 'RADIUS server to use.' }],
  lldp: [
    { field: 'hostname', describe: 'Announced hostname.' },
    { field: 'description', describe: 'Announced description.' },
    { field: 'location', describe: 'Announced location.' }
  ],
  mdns: [{ field: 'additional-hostnames', widget: 'list', describe: 'Extra announced hostnames.' }],
  tailscale: [
    { field: 'auto-start', describe: 'Start at boot.' },
    { field: 'exit-node', describe: 'Advertise as exit node.' },
    { field: 'announce-routes', describe: 'Announce LAN routes.' }
  ]
}

// One always-present section per configurable service. Services with a curated
// layout get inlined describe text; the rest auto-render from the schema.
export const servicesLayout = SERVICES.filter((s) => s.config).map((s) => ({
  objectSection: s.config,
  children: serviceLayouts[s.config]
}))
