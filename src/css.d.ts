// SPDX-FileCopyrightText: 2026 Zach Mandeville <webmaster@coolguy.website>
//
// SPDX-License-Identifier: GPL-2.0-only

// Adding this so svelte-check does not
// throw an error for unknown module imports.
// We cannot turn off this type of typescript check
// in svelte-check, annoyingly, and I like having
// svelte-check as part of our ci/cd
declare module '*.css' { }