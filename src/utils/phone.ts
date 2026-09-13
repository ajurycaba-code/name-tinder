// Guardamos telefones só com dígitos, para que "(11) 99999-8888" e "11999998888"
// sejam a mesma pessoa na hora de entrar.
export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, '')
}
