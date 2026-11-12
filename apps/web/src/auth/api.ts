export type AuthResult =
  | { ok: true; account: { id: string; email: string } }
  | { ok: false; kind: 'field'; errors: { email?: string; password?: string } }
  | { ok: false; kind: 'invalid_credentials' }
  | { ok: false; kind: 'network' }

async function post(path: string, email: string, password: string): Promise<AuthResult> {
  try {
    const res = await fetch(`/api/auth/${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const body = await res.json()
    if (res.ok) return { ok: true, account: body.account }
    if (res.status === 401) return { ok: false, kind: 'invalid_credentials' }
    if (body.errors) return { ok: false, kind: 'field', errors: body.errors }
    return { ok: false, kind: 'network' }
  } catch {
    return { ok: false, kind: 'network' }
  }
}

export const register = (email: string, password: string) => post('register', email, password)
export const login = (email: string, password: string) => post('login', email, password)
