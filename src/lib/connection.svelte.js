// WebSocket JSON-RPC 2.0 client for a live uConfig device.
// Endpoint: ws://<host>/uconfig, subprotocol "uconfig" (see uconfig WEBUI.md).

const READY_TIMEOUT_MS = 8000

let socket = null
let next_id = 1
const pending = new Map()

// connect() resolves only once the server sends the login-required event.
let ready_resolve = null
let ready_reject = null
let ready_timer = null


export const connection = $state({
  status: 'idle', // 'idle' | 'connecting' | 'connected' | 'error'
  mode: null, // 'standalone' | 'ucoord'
  host: null,
  error: null
})

function reject_pending(reason) {
  for (const { reject } of pending.values()) reject(new Error(reason))
  pending.clear()
}

function ready_clear() {
  if (ready_timer) clearTimeout(ready_timer)
  ready_timer = null
  ready_resolve = null
  ready_reject = null
}

function ready_resolve_now() {
  const resolve = ready_resolve
  ready_clear()
  resolve?.()
}

function ready_reject_now(message) {
  const reject = ready_reject
  ready_clear()
  reject?.(new Error(message))
}

function handle_event(msg) {
  if (msg.method === 'login-required') ready_resolve_now()
}

function on_message(event) {
  let msg
  try {
    msg = JSON.parse(event.data)
  } catch {
    return
  }
  if (msg.id == null) {
    handle_event(msg)
    return
  }
  const entry = pending.get(msg.id)
  if (!entry) return
  pending.delete(msg.id)
  if (msg.error) entry.reject(new Error(msg.error.message || 'request failed'))
  else entry.resolve(msg.result)
}

export function request(method, params) {
  return new Promise((resolve, reject) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      reject(new Error('not connected'))
      return
    }
    const id = next_id++
    pending.set(id, { resolve, reject })
    socket.send(JSON.stringify({ jsonrpc: '2.0', id, method, params: params ?? {} }))
  })
}

// Open the socket; resolves once the server signals login-required.
export function connect(host) {
  return new Promise((resolve, reject) => {
    try {
      socket = new WebSocket(`ws://${host}/uconfig`, 'uconfig')
    } catch (e) {
      reject(e)
      return
    }
    connection.status = 'connecting'
    connection.host = host
    connection.error = null
    ready_resolve = resolve
    ready_reject = reject
    ready_timer = setTimeout(() => {
      ready_reject_now('timed out waiting for the device')
      try {
        socket?.close()
      } catch {
        /* already closing */
      }
    }, READY_TIMEOUT_MS)
    socket.onmessage = on_message
    socket.onopen = () => {
      connection.status = 'connected'
    }
    socket.onclose = () => {
      reject_pending('connection closed')
      socket = null
      connection.status = 'idle'
      ready_reject_now(`could not connect to ${host}`)
    }
    socket.onerror = () => {} // detail surfaced via onclose
  })
}

export function disconnect() {
  ready_clear()
  if (socket) {
    try {
      socket.close()
    } catch {
      /* already closing */
    }
  }
  socket = null
  reject_pending('disconnected')
  connection.status = 'idle'
  connection.mode = null
}

// Authenticate over the already-open socket; returns the device mode.
export async function login(password) {
  const result = await request('login', { password })
  connection.mode = result?.mode ?? 'standalone'
  return connection.mode
}

// HTTP PUT a file to a one-shot upload URL on the device (see upload.uc);
// resolves to the server's JSON response (incl. file_id) on 201.
export async function upload(upload_url, file) {
  const res = await fetch(`http://${connection.host}${upload_url}`, { method: 'PUT', body: file })
  let data = {}
  try {
    data = await res.json()
  } catch {
    /* non-JSON error body */
  }
  if (!res.ok) throw new Error(data.error || `upload failed (${res.status})`)
  return data
}
