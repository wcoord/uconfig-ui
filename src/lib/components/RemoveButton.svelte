<!--
SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>

SPDX-License-Identifier: GPL-2.0-only
-->

<script>
  import { t } from '../i18n.svelte.js'

  let { onclick } = $props()
</script>

<button type="button" class="btn-sm-danger" {onclick}>{t('- remove')}</button>
