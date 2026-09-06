// SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>
//
// SPDX-License-Identifier: GPL-2.0-only

// Cached result of the last `devices` call so the Network page can show data
// immediately on re-entry while a fresh fetch runs in the background.

import { request } from './connection.svelte.js'

export const deviceStore = $state({ data: null, error: null, loading: false })

export async function devices_refresh() {
  deviceStore.loading = true
  try {
    deviceStore.data = (await request('devices', {})) ?? {}
    deviceStore.error = null
  } catch (e) {
    deviceStore.error = e?.message || String(e)
  } finally {
    deviceStore.loading = false
  }
}

export function devices_clear() {
  deviceStore.data = null
  deviceStore.error = null
  deviceStore.loading = false
}
