const FUNCTIONS_BASE = 'https://us-central1-laborsafe-g.cloudfunctions.net'

async function callFunction<T>(name: string, body: unknown): Promise<T> {
  const res = await fetch(`${FUNCTIONS_BASE}/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as any
    throw new Error(err.error || `Function ${name} failed`)
  }
  return res.json()
}

export { callFunction }
