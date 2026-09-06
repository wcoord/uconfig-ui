<!--
SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>

SPDX-License-Identifier: GPL-2.0-only
-->

<script>
  let { class: cls = 'h-5 w-5 text-zinc-400' } = $props()
</script>

<svg class="animate-spin {cls}" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
</svg>
