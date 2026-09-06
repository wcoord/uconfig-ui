// SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>
//
// SPDX-License-Identifier: GPL-2.0-only

export const confirmState = $state({
  open: false,
  message: '',
  _resolve: null
})

export function confirm(message) {
  return new Promise((resolve) => {
    confirmState.message = message
    confirmState.open = true
    confirmState._resolve = resolve
  })
}

export function confirm_answer(ok) {
  const resolve = confirmState._resolve
  confirmState.open = false
  confirmState.message = ''
  confirmState._resolve = null
  if (resolve) resolve(ok)
}
