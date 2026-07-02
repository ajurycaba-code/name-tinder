import { useState } from 'react'
import type { NameEntry } from '../data/names'
import type { AllDecisions } from '../types'
import { exportSyncCode, parseSyncCode } from '../utils/storage'

interface Props {
  decisions: AllDecisions
  customNames: NameEntry[]
  onImport: (decisions: AllDecisions, customNames: NameEntry[]) => void
  lastSync: string | null
}

export function SyncScreen({ decisions, customNames, onImport, lastSync }: Props) {
  const [importValue, setImportValue] = useState('')
  const [copyStatus, setCopyStatus] = useState<string | null>(null)
  const [importStatus, setImportStatus] = useState<string | null>(null)

  const code = exportSyncCode({ decisions, customNames })

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopyStatus('Código copiado! Envie para o seu par (WhatsApp, etc).')
    } catch {
      setCopyStatus('Não foi possível copiar automaticamente. Selecione o texto acima manualmente.')
    }
    setTimeout(() => setCopyStatus(null), 4000)
  }

  function handleImport() {
    try {
      const parsed = parseSyncCode(importValue)
      onImport(parsed.decisions, parsed.customNames)
      setImportValue('')
      setImportStatus('Dados combinados com sucesso! Confira seus matches.')
    } catch {
      setImportStatus('Código inválido. Confirme se copiou o código completo do seu par.')
    }
    setTimeout(() => setImportStatus(null), 4000)
  }

  return (
    <div className="screen">
      <h2 className="screen-title">🔄 Sincronizar</h2>
      <p className="screen-subtitle">
        O app roda direto no navegador de cada celular, sem servidor. Para ver os matches dos dois juntos, um manda o
        código pro outro colar aqui.
      </p>

      <div className="sync-block">
        <h3>1. Compartilhe seu código</h3>
        <textarea className="sync-code" readOnly value={code} rows={4} onFocus={(e) => e.target.select()} />
        <button className="primary-btn" onClick={handleCopy}>
          Copiar código
        </button>
        {copyStatus && <p className="form-message">{copyStatus}</p>}
      </div>

      <div className="sync-block">
        <h3>2. Cole o código do seu par</h3>
        <textarea
          className="sync-code"
          placeholder="Cole aqui o código recebido..."
          value={importValue}
          onChange={(e) => setImportValue(e.target.value)}
          rows={4}
        />
        <button className="primary-btn" onClick={handleImport} disabled={!importValue.trim()}>
          Mesclar dados
        </button>
        {importStatus && <p className="form-message">{importStatus}</p>}
      </div>

      {lastSync && (
        <p className="screen-subtitle">Última sincronização: {new Date(lastSync).toLocaleString('pt-BR')}</p>
      )}
    </div>
  )
}
