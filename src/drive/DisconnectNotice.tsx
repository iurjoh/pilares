import { useI18n } from '../i18n'
import type { DisconnectResult } from './disconnect'

export function DisconnectNotice({ result }: { result: DisconnectResult | null }) {
  const { t } = useI18n()
  if (!result) return null
  const message = result.revocation === 'checking'
    ? 'Verificando a revogação no Google...'
    : result.revocation === 'revoked'
      ? 'O Google confirmou a revogação do acesso do Pilares para esta conta.'
      : result.revocation === 'unavailable'
        ? 'Não há token válido neste navegador para revogar o acesso no Google. A permissão na conta pode continuar ativa.'
        : 'Não foi possível confirmar a revogação no Google. A permissão na conta pode continuar ativa.'
  return <div className="library-note" role="status" aria-live="polite">
    <p>{t(result.localCleared ? 'Token e seleção de PDFs removidos deste navegador.' : 'Não foi possível confirmar a limpeza local. Verifique o armazenamento do navegador.')}</p>
    <p>{t(message)}</p>
    {result.revocation !== 'revoked' && result.revocation !== 'checking' && <p><a href="https://myaccount.google.com/connections" target="_blank" rel="noopener noreferrer">{t('Gerenciar o acesso do Pilares na Conta Google')}</a></p>}
  </div>
}
