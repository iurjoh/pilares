import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useI18n } from '../i18n'

export default function Privacidade() {
  const { t } = useI18n()
  return <main className="module-page legal-page" id="conteudo">
    <div className="container legal-container">
      <Link className="back-link" to="/"><ArrowLeft size={17} aria-hidden="true"/> {t('Visão geral')}</Link>
      <div className="legal-head">
        <div className="eyebrow">{t('PILARES · DOCUMENTO PÚBLICO')}</div>
        <h1>{t('Política de Privacidade')}</h1>
        <p className="legal-updated">{t('Última atualização: 29 de setembro de 2026')}</p>
      </div>

      <section aria-labelledby="pp-resumo">
        <h2 id="pp-resumo">{t('Resumo em uma frase')}</h2>
        <p>{t('Os registros que você digita ficam no seu navegador. A hospedagem e os serviços opcionais recebem dados técnicos de conexão; a biblioteca usa o Google diretamente no navegador.')}</p>
      </section>

      <section aria-labelledby="pp-controlador">
        <h2 id="pp-controlador">{t('1. Quem é responsável pelos dados')}</h2>
        <p>{t('O controlador dos dados, nos termos do GDPR, é Iuri Johansson, pessoa física, mantenedor do Pilares (pilares.pages.dev). Contato:')} <a href="mailto:iuri.johansson@gmail.com">iuri.johansson@gmail.com</a>.</p>
      </section>

      <section aria-labelledby="pp-locais">
        <h2 id="pp-locais">{t('2. O que o Pilares guarda, e onde')}</h2>
        <p>{t('Os registros que você cria no app - leituras da Bíblia e de livros, práticas da semana, humor, hábitos, metas, habilidades, interesses, anotações e o idioma escolhido - ficam armazenados apenas no seu próprio navegador (IndexedDB e localStorage), no seu aparelho.')}</p>
        <p>{t('O app não envia o conteúdo desses registros a um servidor do Pilares e não faz backup deles. A hospedagem pode registrar dados técnicos de acesso. Limpar os dados do site ou trocar de aparelho sem exportar pode apagar o histórico. Em aparelhos compartilhados, outras pessoas que usem o mesmo perfil do navegador podem acessar os registros.')}</p>
      </section>

      <section aria-labelledby="pp-nuvem">
        <h2 id="pp-nuvem">{t('3. Conexão opcional com a sua nuvem (biblioteca)')}</h2>
        <p>{t('Você pode, opcionalmente, conectar a sua conta de nuvem para montar a sua biblioteca de PDFs dentro do Pilares. A conexão usa OAuth 2.0 diretamente no navegador, para os arquivos escolhidos.')}</p>
        <p>{t('No Google Drive, o escopo pedido é drive.file: o app pode acessar os arquivos ou a pasta que você escolher na Google Picker. Esse escopo permite acesso aos arquivos autorizados; o app não oferece funções de escrita, mas o escopo em si não é somente leitura. O Pilares nunca vê a sua senha, nunca lista o restante do seu Drive e não copia os seus PDFs.')}</p>
        <p>{t('O token de acesso vive apenas no seu navegador (sessionStorage) e expira em cerca de uma hora. A sua escolha de pasta ou arquivos fica guardada no seu navegador até você desconectar. O tráfego dos seus arquivos vai direto do seu navegador para o Google, sem passar por qualquer servidor nosso - nós não temos servidor.')}</p>
        <p>{t('Você pode desfazer a conexão a qualquer momento: pelo botão "Desconectar biblioteca" no app, ou revogando o acesso do Pilares na sua conta (em myaccount.google.com/permissions, no caso do Google). Ao desconectar, o app tenta revogar o token e apaga o token e a escolha de arquivos deste navegador. Para garantir a revogação na conta, use também a página de permissões do Google.')}</p>
      </section>

      <section aria-labelledby="pp-base">
        <h2 id="pp-base">{t('4. Base legal (GDPR)')}</h2>
        <p>{t('O funcionamento do diário local, a conexão opcional ao Google e os registros técnicos de hospedagem exigem análise de finalidade e base legal distinta (GDPR, art. 6.º). Humor, terapia e crença religiosa podem revelar categorias especiais (art. 9.º), que exigem condição adicional. A autorização OAuth no Google dá acesso técnico à conta, mas não substitui, por si só, um consentimento válido para todas as finalidades GDPR. Esta análise ainda não está concluída; não use este texto como sinal de liberação para testers externos.')}</p>
      </section>

      <section aria-labelledby="pp-terceiros">
        <h2 id="pp-terceiros">{t('5. Terceiros que aparecem no caminho')}</h2>
        <p>{t('Mesmo sem servidor próprio, o site depende de alguns serviços de infraestrutura:')}</p>
        <ul>
          <li>{t('Cloudflare Pages: hospedagem do site estático. Como qualquer provedor de hospedagem, a Cloudflare pode registrar logs técnicos de acesso (como endereço IP) conforme a sua própria política de privacidade.')}</li>
          <li>{t('Google Fonts: as fontes tipográficas são carregadas dos servidores do Google, que recebem uma requisição técnica do seu navegador (incluindo endereço IP).')}</li>
          <li>{t('Google (OAuth, Picker e Drive API): somente se você decidir conectar a biblioteca. O uso dos seus dados pelo Google segue a política de privacidade do Google.')}</li>
        </ul>
        <p>{t('Nenhum desses serviços recebe de nós os seus registros do app, e nenhum deles é usado para rastreamento ou publicidade.')}</p>
      </section>

      <section aria-labelledby="pp-cookies">
        <h2 id="pp-cookies">{t('6. Cookies e analytics')}</h2>
        <p>{t('O Pilares não usa cookies de rastreamento nem ferramentas de analytics. Não medimos visitas, não criamos perfis e não exibimos publicidade.')}</p>
      </section>

      <section aria-labelledby="pp-direitos">
        <h2 id="pp-direitos">{t('7. Seus direitos')}</h2>
        <p>{t('Os dados locais podem ser acessados por você no navegador. Em Configurações, há opções de baixar e apagar os registros locais. Para pedidos relativos a logs técnicos de terceiros, escreva ao contato abaixo:')}</p>
        <ul>
          <li>{t('Acesso e portabilidade: baixe um arquivo JSON em Configurações. Guarde-o em lugar privado; ele pode conter dados sensíveis.')}</li>
          <li>{t('Retificação: você edita ou apaga qualquer registro dentro do próprio app.')}</li>
          <li>{t('Exclusão: use a opção em Configurações para apagar dados locais do Pilares neste navegador. Isso não apaga logs técnicos que serviços de terceiros possam reter.')}</li>
          <li>{t('Revogação do consentimento: desconecte a biblioteca no app ou revogue o acesso na sua conta da nuvem.')}</li>
          <li>{t('Reclamação: você pode reclamar à autoridade de proteção de dados do seu país (na Suécia, a IMY - Integritetsskyddsmyndigheten).')}</li>
        </ul>
        <p>{t('Para qualquer pedido ou dúvida sobre privacidade, escreva para')} <a href="mailto:iuri.johansson@gmail.com">iuri.johansson@gmail.com</a>.</p>
      </section>

      <section aria-labelledby="pp-retencao">
        <h2 id="pp-retencao">{t('8. Retenção')}</h2>
        <p>{t('Os registros locais permanecem no navegador até você apagá-los. O token de acesso à nuvem expira em cerca de uma hora; a seleção da biblioteca permanece até ser removida. Os prazos de retenção de logs técnicos dos provedores ainda precisam ser verificados e publicados antes de testes externos.')}</p>
      </section>

      <section aria-labelledby="pp-mudancas">
        <h2 id="pp-mudancas">{t('9. Mudanças nesta política')}</h2>
        <p>{t('Se esta política mudar, a versão nova será publicada nesta mesma página, com a data de atualização revisada. Mudanças relevantes serão anunciadas no próprio app.')}</p>
      </section>
    </div>
  </main>
}
