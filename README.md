# uconfig builder

A single-page app for authoring [uconfig](../uconfig) documents, the intent-based
configuration format for OpenWrt, and for managing a live device over its websocket
control plane.

It works two ways:

- **Standalone (offline)**: load a bundled example, the default skeleton, or a saved
  config; edit through schema-driven cards; export the resulting JSON. No device needed.
- **Connected to a device**: enter a device address, log in, and the app pulls the
  device's active config and hardware capabilities over a websocket, shows live device
  pages (network neighbours, system state, maintenance), and applies edited configs back
  to the device.

## Stack

- Svelte 5 (runes, not SvelteKit)
- Tailwind CSS v4 (via `@tailwindcss/vite`)
- Vite 6
- `@formatjs/intl` for internationalisation (catalogue in `src/lib/locales/`)

Plain JavaScript, no TypeScript.

## Development

```
npm install
npm run dev          # http://localhost:5173 (host exposed on the LAN)
npm run build        # production bundle in dist/
npm run preview
npm run i18n:extract # re-extract translatable strings into the locale catalogue
```

## Screens

`App.svelte` is a small state machine over four top-level screens:

1. **welcome** - landing page: start from the default config, a bundled example, a
   locally saved config, or connect to a device by address.
2. **login** - opens the websocket to the device and prompts for the password.
3. **device** - the device dashboard (Network, State, System pages); a Configure button
   opens the builder against the device's live config.
4. **builder** - the schema-driven config editor (Unit, Radios, Interfaces, Services, and
   a Configuration/changes section).

## Device control plane

The connected mode talks JSON-RPC 2.0 over a websocket to the uconfig-ui server:

- Endpoint `ws://<host>/uconfig`, subprotocol `ui`.
- `src/lib/connection.svelte.js` - the client: `connect()`, `login()`, `request()`,
  `upload()`, `disconnect()`. The connection resolves once the server emits its
  `login-required` event.
- `src/lib/settings.svelte.js` - persisted `host` and `theme` (localStorage).
- On login the app pulls `config-get` (active config) and `capabilities` (radios, bands,
  channel widths, modes, ports); the changes section applies edits via `config-apply`.

Device pages under `src/lib/components/`:

- `NetworkPage.svelte` - the device's network neighbours, refreshed periodically.
- `StatePage.svelte` - system state metrics.
- `SystemPage.svelte` - maintenance actions: reboot, factory reset, firmware upload and
  upgrade (the upload uses the websocket `upload` channel).
- `DeviceCards.svelte` - the mobile (cards) layout of the device menu.

`src/lib/capabilities.svelte.js` exposes the device capabilities so the editor can lock
the radio/port maps to what the hardware actually has.

## The schema-driven editor

The editor is a hybrid: a curated card shell for the top-level sections (unit, radios,
interfaces, services) with the field widgets driven by the schema.

- `src/lib/data/schema.json` - the merged uconfig JSON Schema (draft-07, all `$ref`s
  internal as `#/$defs/...`), copied from `../uconfig/generated/schema.json`.
- `src/lib/data/examples.json` - the shipped example configs.
- `src/lib/schema.js` - schema access helpers (`def_get`, `$ref` resolution, `$defs`
  lookup, pattern-property value schemas, titles).
- `src/lib/layouts.js` - declarative layouts (`unitLayout`, `radioLayout`,
  `interfaceLayout`, `servicesLayout`) describing which fields appear where.
- `src/lib/store.svelte.js` - the document `$state` (`doc`, `baseline`, `loadedFrom`),
  plus import/export, example/config loaders, and pruning of empty values before export.
- `src/lib/changes.js` - the diff between the edited `doc` and its `baseline`, shown in
  the Configuration section.

### Components

- `Card.svelte` - collapsible top-level section card.
- `LayoutRenderer.svelte` - renders a layout array against data and schema, delegating to
  the field widgets; supports `when` predicates to show or prune fields conditionally.
- `Field.svelte` - schema-driven scalar widget (enum, boolean, number, string,
  string/number array, int-or-keyword union, with secret show/hide).
- `SchemaObject.svelte` - recursively renders an object subschema: scalars via `Field`,
  nested objects as add/remove groups, `patternProperties` via `MapEditor`.
- `MapEditor.svelte` - editor for the dynamically-keyed maps (radios, interfaces, ssids,
  ports, ...) with add, rename and remove, optionally tabbed and lockable.
- `CollapsibleSection.svelte` - a sub-section that renders as its own card on desktop and
  flat inside a card on mobile.
- `ConfigurationPanel.svelte` / `ChangesPanel.svelte` - the pending-changes view and the
  apply action.

Alongside these are specialised field components (channel, channel width/mode, tx power,
addressing, timezone, ports, vlan, dhcp pool, multi-psk, services, ...).

## Responsive layout

`src/lib/view.svelte.js` holds `view.mode`, set in `App.svelte` from
`matchMedia('(min-width: 768px)')`:

- **`menu`** (>= 768px, desktop): a left sidebar of sections plus a content pane.
- **`cards`** (< 768px, mobile): a vertical stack of collapsible cards behaving as an
  accordion (one open at a time, via `src/lib/accordion.svelte.js`).

Components such as `CollapsibleSection`, `NetworkPage` and `SystemPage` adapt their chrome
to the mode so they never nest a bordered card inside another bordered card on mobile.

## Regenerating bundled data

When the source schema or examples change, refresh the bundled copies:

```
cp ../uconfig/generated/schema.json src/lib/data/schema.json
```

The data-model repo lives at `../uconfig` (historically named `uconfig-new`, which its git
remote still uses); run its `generate.sh` first to build `generated/schema.json`.

## License

Copyright (C) 2026  Zach Mandeville, Devan Carpenter, John Crispin

SPDX-License-Identifier: GPL-2.0-only

## wcoord

Part of the [wcoord project](https://wcoord.informatics.coop)
<img src="./docs/wcoord_logo.svg">
