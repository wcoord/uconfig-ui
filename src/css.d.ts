// Adding this so svelte-check does not
// throw an error for unknown module imports.
// We cannot turn off this type of typescript check
// in svelte-check, annoyingly, and I like having
// svelte-check as part of our ci/cd
declare module '*.css' { }