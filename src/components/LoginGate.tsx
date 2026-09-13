import { useState } from 'react'
import type { LoginInput } from '../hooks/useAppData'
import { PARENT_NAMES, type Profile } from '../types'
import { normalizePhone } from '../utils/phone'

interface Props {
  mode: 'cloud' | 'local'
  onLogin: (input: LoginInput) => Promise<Profile>
  lookupPhone: (phone: string) => Promise<Profile | null>
}

type Step = 'phone' | 'signup'

export function LoginGate({ mode, onLogin, lookupPhone }: Props) {
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const digits = normalizePhone(phone)

  async function run(action: () => Promise<unknown>) {
    setBusy(true)
    setError(null)
    try {
      await action()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Algo deu errado. Tente de novo.')
    } finally {
      setBusy(false)
    }
  }

  // Modo local (sem nuvem configurada): mantém a escolha simples entre os dois perfis.
  if (mode === 'local') {
    return (
      <div className="gate">
        <div className="gate-card">
          <p className="gate-emoji">👶💕</p>
          <h1>Name Tinder</h1>
          <p className="gate-subtitle">Deslize os nomes, dê match no favorito de vocês dois!</p>
          <p className="gate-question">Quem está jogando agora?</p>
          <div className="gate-buttons">
            {PARENT_NAMES.map((parentName) => (
              <button
                key={parentName}
                className="gate-btn"
                disabled={busy}
                onClick={() => void run(() => onLogin({ phone: '', parentName }))}
              >
                {parentName}
              </button>
            ))}
          </div>
          {error && <p className="gate-error">{error}</p>}
        </div>
      </div>
    )
  }

  async function handlePhoneSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (digits.length < 10) {
      setError('Digite o telefone com DDD (pelo menos 10 números).')
      return
    }
    await run(async () => {
      const existing = await lookupPhone(digits)
      if (existing) {
        await onLogin({ phone: digits })
      } else {
        setStep('signup')
      }
    })
  }

  if (step === 'phone') {
    return (
      <div className="gate">
        <form className="gate-card" onSubmit={handlePhoneSubmit}>
          <p className="gate-emoji">👶💕</p>
          <h1>Name Tinder</h1>
          <p className="gate-subtitle">
            Ajude a escolher o nome do bebê da Fabiana e do Aju! Entre com seu telefone.
          </p>
          <input
            className="gate-input"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="(11) 99999-8888"
            aria-label="Telefone"
          />
          <button type="submit" className="gate-btn gate-btn-wide" disabled={busy || digits.length < 10}>
            {busy ? 'Entrando…' : 'Continuar'}
          </button>
          {error && <p className="gate-error">{error}</p>}
          <p className="gate-note">Sem senha — é só pra saber de quem é cada voto.</p>
        </form>
      </div>
    )
  }

  return (
    <div className="gate">
      <div className="gate-card">
        <p className="gate-emoji">👋</p>
        <h1>Primeira vez por aqui!</h1>
        <p className="gate-subtitle">Como você se chama?</p>
        <input
          className="gate-input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Seu nome"
          aria-label="Seu nome"
        />

        <p className="gate-question">Quem é você?</p>
        <div className="gate-buttons">
          {PARENT_NAMES.map((parentName) => (
            <button
              key={parentName}
              className="gate-btn"
              disabled={busy}
              onClick={() => void run(() => onLogin({ phone: digits, parentName }))}
            >
              Sou {parentName}
            </button>
          ))}
        </div>

        <button
          className="gate-btn gate-btn-wide gate-btn-guest"
          disabled={busy || !name.trim()}
          onClick={() => void run(() => onLogin({ phone: digits, name: name.trim() }))}
        >
          {busy ? 'Entrando…' : 'Sou amigo / família 💌'}
        </button>

        {error && <p className="gate-error">{error}</p>}

        <button className="gate-back" onClick={() => setStep('phone')} disabled={busy}>
          ← Trocar telefone
        </button>
      </div>
    </div>
  )
}
