// SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>
//
// SPDX-License-Identifier: GPL-2.0-only

import { getContext, setContext } from 'svelte'

const KEY = Symbol('accordion')

// One-open-at-a-time group. Each LayoutRenderer provides its own, so sections
// within a card are mutually exclusive; nested renderers get their own group.
// When `autoFirst` is set, the first item to register opens automatically.
export function accordion_provide(autoFirst = false) {
  let open = $state(null)
  let claimed = false
  const ctl = {
    isOpen: (id) => open === id,
    toggle: (id) => {
      open = open === id ? null : id
    },
    show: (id) => {
      open = id
    },
    register: (id) => {
      if (claimed) return
      claimed = true
      if (autoFirst && open === null) open = id
    }
  }
  setContext(KEY, ctl)
  return ctl
}

export function accordion_get() {
  return getContext(KEY)
}
