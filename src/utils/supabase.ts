// Cliente mínimo para a API REST do Supabase (PostgREST).
//
// Não usamos a biblioteca @supabase/supabase-js de propósito: o app só precisa
// de select/insert/upsert/delete simples, e assim o bundle não cresce nem
// ganhamos uma dependência nova.
//
// A chave "anon" é pública por design — ela vai no bundle do front e quem
// protege os dados são as políticas de RLS definidas em supabase/schema.sql.

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL ?? '').trim().replace(/\/+$/, '')
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim()

export const cloudEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

export type Query = Record<string, string>

function buildHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  }
}

function buildUrl(table: string, query?: Query): string {
  const params = new URLSearchParams(query)
  const search = params.toString()
  return `${SUPABASE_URL}/rest/v1/${table}${search ? `?${search}` : ''}`
}

async function parse<T>(response: Response): Promise<T[]> {
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Supabase ${response.status}: ${body || response.statusText}`)
  }
  if (response.status === 204) return []
  const text = await response.text()
  return text ? (JSON.parse(text) as T[]) : []
}

export async function select<T>(table: string, query?: Query): Promise<T[]> {
  const response = await fetch(buildUrl(table, { select: '*', ...query }), {
    headers: buildHeaders(),
  })
  return parse<T>(response)
}

export async function insert<T>(table: string, rows: unknown): Promise<T[]> {
  const response = await fetch(buildUrl(table), {
    method: 'POST',
    headers: buildHeaders({ Prefer: 'return=representation' }),
    body: JSON.stringify(rows),
  })
  return parse<T>(response)
}

export async function upsert<T>(table: string, rows: unknown, onConflict?: string): Promise<T[]> {
  const response = await fetch(buildUrl(table, onConflict ? { on_conflict: onConflict } : undefined), {
    method: 'POST',
    headers: buildHeaders({ Prefer: 'resolution=merge-duplicates,return=representation' }),
    body: JSON.stringify(rows),
  })
  return parse<T>(response)
}

export async function update<T>(table: string, query: Query, patch: unknown): Promise<T[]> {
  const response = await fetch(buildUrl(table, query), {
    method: 'PATCH',
    headers: buildHeaders({ Prefer: 'return=representation' }),
    body: JSON.stringify(patch),
  })
  return parse<T>(response)
}

export async function remove(table: string, query: Query): Promise<void> {
  const response = await fetch(buildUrl(table, query), {
    method: 'DELETE',
    headers: buildHeaders(),
  })
  await parse(response)
}
