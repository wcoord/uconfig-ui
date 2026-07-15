<script>
  import { push } from 'svelte-spa-router'
  import { settings } from '../settings.svelte.js'
  import { t } from '../i18n.svelte.js'
  import { disconnect as ws_disconnect } from '../connection.svelte.js'
  import { capabilities_clear } from '../capabilities.svelte.js'
  import { devices_clear } from '../devices.svelte.js'
  import { doc_reset } from '../store.svelte.js'

  let menuOpen = $state(false)
  let deviceSession = $state(false) // logged into a device (survives idle disconnects)

  const mql = globalThis.matchMedia?.('(prefers-color-scheme: dark)')
  let systemDark = $state(mql?.matches ?? false)
  mql?.addEventListener?.('change', (e) => (systemDark = e.matches))
  const themeMode = $derived(settings.theme ?? (systemDark ? 'dark' : 'light'))

  $effect(() => {
    document.documentElement.classList.toggle('dark', themeMode === 'dark')
    document.documentElement.style.colorScheme = themeMode
    document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', themeMode)
  })
  function toggle_theme() {
    settings.theme = themeMode === 'dark' ? 'light' : 'dark'
  }

  function logout() {
    ws_disconnect()
    capabilities_clear()
    devices_clear()
    doc_reset()
    deviceSession = false
    push('/')
  }

</script>

{#if menuOpen}
  <button type="button" class="fixed inset-0 z-40 cursor-default" aria-label={t('Close menu')} onclick={() => (menuOpen = false)}></button>
{/if}
<div class="fixed right-4 top-3 z-50">
  <button type="button" class="btn" aria-label={t('Menu')} aria-haspopup="true" aria-expanded={menuOpen} onclick={() => (menuOpen = !menuOpen)}>
    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  </button>
  {#if menuOpen}
    <div class="absolute right-0 mt-1 w-44 overflow-hidden rounded-lg border border-zinc-200 bg-surface py-1 shadow-lg">
      <button type="button" class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100" onclick={() => { menuOpen = false; toggle_theme() }}>
        {#if themeMode === 'dark'}
          <svg class="h-4 w-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
          {t('Light theme')}
        {:else}
          <svg class="h-4 w-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
          </svg>
          {t('Dark theme')}
        {/if}
      </button>
      {#if deviceSession}
        <button type="button" class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100" onclick={() => { menuOpen = false; logout() }}>
          <svg class="h-4 w-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {t('Logout')}
        </button>
      {/if}
    </div>
  {/if}
</div>