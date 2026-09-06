// SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>
//
// SPDX-License-Identifier: GPL-2.0-only

// Global UI rendering mode:
//  - 'cards': everything on one page, sections collapse into an accordion.
//  - 'menu': top-level items become a left menu; the selected page shows each
//    section as a plain, non-collapsible card.
export const view = $state({ mode: 'cards', section: 'unit' })
