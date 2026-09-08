// SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>
//
// SPDX-License-Identifier: GPL-2.0-only

// Central persisted settings. Reactive $state mirrored to localStorage; add new
// keys here as more user preferences are introduced.
const KEY = 'uconfig-ui'

function load() {
  try {
    return JSON.parse(globalThis.localStorage?.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}

export const settings = $state(load())

$effect.root(() => {
  $effect(() => {
    const data = JSON.stringify(settings)
    if (data === '{}') return // nothing chosen yet; keep localStorage untouched
    try {
      globalThis.localStorage?.setItem(KEY, data)
    } catch {
      /* storage unavailable */
    }
  })
})
