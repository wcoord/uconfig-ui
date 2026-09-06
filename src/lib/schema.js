// SPDX-FileCopyrightText: 2026 John Crispin <john@phrozen.org>
//
// SPDX-License-Identifier: GPL-2.0-only

import rootSchema from './data/schema.json'

export { rootSchema }

export function ref_resolve(schema) {
  let node = schema
  let guard = 0
  while (node && node.$ref && guard++ < 32) {
    const path = node.$ref.replace(/^#\//, '').split('/')
    let target = rootSchema
    for (const seg of path) target = target?.[decode_pointer(seg)]
    node = target
  }
  return node ?? schema
}

function decode_pointer(seg) {
  return seg.replace(/~1/g, '/').replace(/~0/g, '~')
}

export function def_get(name) {
  return rootSchema.$defs?.[name]
}

export function prop_schema(parent, key) {
  const resolved = ref_resolve(parent)
  return ref_resolve(resolved?.properties?.[key] ?? {})
}

export function schema_at(root, path) {
  let node = ref_resolve(root)
  if (!path) return node
  for (const seg of path.split('.')) {
    node = ref_resolve(node?.properties?.[seg] ?? {})
  }
  return node
}

export function pattern_value_schema(parent) {
  const resolved = ref_resolve(parent)
  const pp = resolved?.patternProperties
  if (!pp) return null
  const first = Object.values(pp)[0]
  return first ? ref_resolve(first) : null
}

export { title_for } from './labels.js'
