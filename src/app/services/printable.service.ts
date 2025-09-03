import { Injectable } from '@angular/core';
import { Orcamento, Locacao, Equipamento } from '../models/index';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

@Injectable({
  providedIn: 'root'
})
export class PrintableService {

  private equipamentos: Equipamento[] = [];

  constructor() { }

  // Método para definir os equipamentos disponíveis
  setEquipamentos(equipamentos: Equipamento[]) {
    this.equipamentos = equipamentos;
  }

  // Dados da empresa (configuráveis)
  private empresaData = {
    nome: 'JR Pinto',
    endereco: 'Rua Indio Ajuricaba, 1 - Gilberto Mestrinho / Manaus-AM',
    cnpj: '09.181.720/0001-75',
    telefone: '(92) 99153-4302 / 99457-0101'
  };

  // Gerar HTML do orçamento usando o template personalizado
  generateOrcamentoHTML(orcamento: Orcamento): string {
    const dataInicio = new Date(orcamento.data_inicio).toLocaleDateString('pt-BR');
    const dataFim = new Date(orcamento.data_fim).toLocaleDateString('pt-BR');
    const dataCriacao = new Date(orcamento.data_criacao).toLocaleDateString('pt-BR');

    // Obter informações do documento do cliente
    const documentoCliente = this.getDocumentoInfo(orcamento.cliente?.cnpj || orcamento.cliente?.cpf);

    // Gerar linhas da tabela de itens
    const itensHTML = orcamento.itens?.map(item => `
      <tr>
        <td>${this.getEquipamentoDescricao(item.equipamento_id)}</td>
        <td class="num">R$ ${item.preco_unitario.toFixed(2).replace('.', ',')}</td>
        <td class="center">${item.quantidade}</td>
        <td class="center">${dataInicio}</td>
        <td class="center">${dataFim}</td>
        <td class="center">${item.dias}</td>
        <td class="num">R$ ${item.subtotal.toFixed(2).replace('.', ',')}</td>
      </tr>
    `).join('') || '';

    const subtotal = orcamento.itens?.reduce((sum, item) => sum + item.subtotal, 0) || 0;
    const descontoPercentual = orcamento.desconto > 0 ? ((orcamento.desconto / subtotal) * 100).toFixed(0) : '0';
    const descontoValor = orcamento.desconto.toFixed(2).replace('.', ',');
    const frete = orcamento.frete.toFixed(2).replace('.', ',');
    const total = orcamento.total_final.toFixed(2).replace('.', ',');

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Orçamento ${orcamento.id} - ${orcamento.cliente?.nome_razao_social}</title>
  <style>
    @page {
      size: A4;
      margin: 1.5cm;
      page-break-inside: avoid;
    }
    
    :root {
      --accent: #0f766e;
      --ink: #0f172a;
      --muted: #475569;
      --line: #e2e8f0;
      --bg: #ffffff;
    }
    * { box-sizing: border-box; }
    html, body { height: 100%; }
    body {
      margin: 0;
      font: 12px/1.4 system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, "Noto Sans", "Helvetica Neue", Arial, "Apple Color Emoji", "Segoe UI Emoji";
      color: var(--ink);
      background: var(--bg);
      orphans: 3;
      widows: 3;
    }

    .page {
      max-width: 900px;
      margin: 24px auto;
      padding: 32px;
      background: #fff;
      border: 1px solid var(--line);
      border-radius: 16px;
      box-shadow: 0 8px 24px rgba(2,6,23,0.06);
      page-break-inside: avoid;
    }

    header {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 16px;
      align-items: start;
      border-bottom: 2px solid var(--line);
      padding-bottom: 16px;
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    .brand h1 {
      margin: 0 0 6px 0;
      font-size: 26px;
      letter-spacing: 0.5px;
    }
    .brand .subtitle {
      font-weight: 600;
      color: var(--accent);
      letter-spacing: 1px;
    }
    .doc-meta {
      text-align: right;
      color: var(--muted);
      font-size: 13px;
    }
    .doc-meta strong { color: var(--ink); }

    .cols {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
      margin-bottom: 22px;
    }
    .card {
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 14px 16px;
    }
    .card h3 {
      margin: 0 0 8px 0;
      font-size: 14px;
      letter-spacing: 0.4px;
      color: var(--accent);
      text-transform: uppercase;
    }
    .kv {
      display: grid;
      grid-template-columns: 110px 1fr;
      gap: 6px 10px;
      font-size: 13px;
    }
    .kv label { color: var(--muted); }
    .kv div { color: var(--ink); }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0 16px;
      font-size: 12px;
      page-break-inside: avoid;
    }
    thead th {
      text-align: left;
      padding: 10px 8px;
      background: #f8fafc;
      color: var(--muted);
      border-bottom: 1px solid var(--line);
      page-break-inside: avoid;
      font-weight: 600;
    }
    tbody td {
      padding: 10px 8px;
      border-bottom: 1px solid var(--line);
      page-break-inside: avoid;
    }
    tbody tr {
      page-break-inside: avoid;
      vertical-align: top;
    }
    tfoot td {
      padding: 8px;
    }

    .num { text-align: right; white-space: nowrap; }
    .center { text-align: center; }

    .totals {
      margin-top: 8px;
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 16px;
      align-items: start;
    }
    .notes {
      border: 1px dashed var(--line);
      border-radius: 12px;
      padding: 12px;
      color: var(--muted);
      min-height: 72px;
    }
    .summary {
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 12px;
    }
    .summary .row {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 8px;
      padding: 6px 0;
      border-bottom: 1px solid var(--line);
    }
    .summary .row:last-child { border-bottom: 0; }
    .summary .grand {
      font-weight: 800;
      font-size: 16px;
    }

    footer {
      margin-top: 28px;
      padding-top: 12px;
      border-top: 2px solid var(--line);
      color: var(--muted);
      font-size: 12px;
      display: flex;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }

    /* Print (A4) */
    @media print {
      body { background: #fff; }
      .page {
        max-width: none;
        margin: 0;
        border: none;
        border-radius: 0;
        box-shadow: none;
        padding: 24mm;
        page-break-after: always;
      }
      @page { size: A4; margin: 12mm; }
    }

    /* Small screens */
    @media (max-width: 720px) {
      .cols { grid-template-columns: 1fr; }
      .totals { grid-template-columns: 1fr; }
      .doc-meta { text-align: left; }
    }
  </style>
</head>
<body>
  <section class="page">
    <header>
      <div class="brand">
        <img src="/logo-r-loc.jpg" alt="R-Loc" style="max-height: 60px; margin-bottom: 10px;">
        <h1>${this.empresaData.nome}</h1>
        <div class="subtitle">ORÇAMENTO</div>
      </div>
      <div class="doc-meta">
        <div><strong>Orçamento:</strong> ${orcamento.id}</div>
        <div><strong>Data:</strong> ${dataCriacao}</div>
      </div>
    </header>

    <section class="cols">
      <div class="card">
        <h3>Locadora</h3>
        <div class="kv">
          <label>Nome</label><div>${this.empresaData.nome}</div>
          <label>Endereço</label><div>${this.empresaData.endereco}</div>
          <label>CNPJ</label><div>${this.empresaData.cnpj}</div>
          <label>Telefone</label><div>${this.empresaData.telefone}</div>
        </div>
      </div>
      <div class="card">
        <h3>Locatário</h3>
        <div class="kv">
          <label>Nome</label><div>${orcamento.cliente?.nome_razao_social || 'Cliente não encontrado'}</div>
          <label>Endereço</label><div>${orcamento.cliente?.endereco || 'Endereço não informado'}</div>
          <label>${documentoCliente.tipo}</label><div>${documentoCliente.documento}</div>
          <label>Contato</label><div>Tel. comercial: ${orcamento.cliente?.telefone_comercial || '—'} &nbsp;&nbsp;|&nbsp;&nbsp; Celular: ${orcamento.cliente?.telefone_celular || '—'}</div>
        </div>
      </div>
    </section>

    <section>
      <table>
        <thead>
          <tr>
            <th style="width:36%">Material</th>
            <th class="num" style="width:12%">Valor Base</th>
            <th class="center" style="width:8%">Qtd</th>
            <th class="center" style="width:12%">Data Início</th>
            <th class="center" style="width:12%">Data Fim</th>
            <th class="center" style="width:8%">Dias</th>
            <th class="num" style="width:12%">SubTotal</th>
          </tr>
        </thead>
        <tbody>
          ${itensHTML}
        </tbody>
      </table>
    </section>

    <section class="totals">
      <div class="notes">
        <strong>Observações</strong>
        <div>
          ${orcamento.observacoes || 'Nenhuma observação registrada.'}
        </div>
      </div>
      <div class="summary">
        <div class="row"><div>Desconto</div><div><strong>${descontoPercentual}%</strong> &nbsp; | &nbsp; R$ ${descontoValor}</div></div>
        <div class="row"><div>Frete</div><div>R$ ${frete}</div></div>
        <div class="row grand"><div>Total</div><div>R$ ${total}</div></div>
      </div>
    </section>

    <footer>
      <div>Endereço da locadora: ${this.empresaData.endereco}</div>
      <div>Contato: ${this.empresaData.telefone}</div>
    </footer>
  </section>
</body>
</html>`;
  }

  // Gerar HTML do contrato usando o template personalizado
  generateContratoHTML(locacao: Locacao): string {
    const dataInicio = new Date(locacao.data_inicio).toLocaleDateString('pt-BR');
    const dataFim = new Date(locacao.data_fim).toLocaleDateString('pt-BR');
    const dataCriacao = new Date(locacao.data_criacao).toLocaleDateString('pt-BR');
    const dataAtual = new Date().toLocaleDateString('pt-BR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });

    // Obter informações do documento do cliente
    const documentoCliente = this.getDocumentoInfo(locacao.cliente?.cnpj || locacao.cliente?.cpf);

    // Gerar linhas da tabela de itens
    const itensHTML = locacao.itens?.map(item => `
      <tr>
        <td>${this.getEquipamentoDescricao(item.equipamento_id)}</td>
        <td>R$ ${item.preco_unitario.toFixed(2).replace('.', ',')}</td>
        <td>${item.quantidade}</td>
        <td>${dataInicio}</td>
        <td>${dataFim}</td>
        <td>${item.dias}</td>
        <td>R$ ${item.subtotal.toFixed(2).replace('.', ',')}</td>
      </tr>
    `).join('') || '';

    const total = locacao.total_final.toFixed(2).replace('.', ',');

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Contrato de Locação</title>
  <style>
    @page {
      size: A4;
      margin: 1.5cm;
      page-break-inside: avoid;
    }

    body {
      font-family: Arial, sans-serif;
      font-size: 11pt;
      color: #000;
      margin: 0;
      padding: 0;
      line-height: 1.4;
      orphans: 3;
      widows: 3;
    }

    .container {
      width: 100%;
      margin: 0 auto;
    }

    .header {
      text-align: center;
      margin-bottom: 20px;
      page-break-inside: avoid;
    }

    .header img {
      max-height: 80px;
      margin-bottom: 10px;
    }

    .header h1 {
      font-size: 16pt;
      margin: 0;
    }

    .header h2 {
      font-size: 12pt;
      margin: 0;
      font-weight: normal;
    }

    .info {
      margin: 15px 0;
      page-break-inside: avoid;
    }

    .info p {
      margin: 2px 0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      page-break-inside: avoid;
    }

    table, th, td {
      border: 1px solid #000;
    }

    th, td {
      padding: 6px;
      text-align: left;
      font-size: 10pt;
      page-break-inside: avoid;
    }

    tr {
      page-break-inside: avoid;
    }

    .section-title {
      font-weight: bold;
      margin-top: 15px;
      text-transform: uppercase;
      page-break-after: avoid;
    }

    .assinaturas-container {
      margin-top: 50px;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .assinaturas {
      display: flex;
      justify-content: space-between;
      margin-bottom: 15px;
      page-break-inside: avoid;
    }

    .assinaturas:last-child {
      margin-bottom: 0;
    }

    .assinaturas div {
      width: 45%;
      text-align: center;
    }

    .footer {
      margin-top: 40px;
      text-align: center;
      page-break-inside: avoid;
    }

    .linha {
      margin-top: 50px;
      text-align: center;
    }

    /* Evitar quebra de página em elementos importantes */
    p {
      page-break-inside: avoid;
      orphans: 2;
      widows: 2;
    }
  </style>
</head>
<body>
  <div class="container">

    <div class="header">
      <img src="/logo-r-loc.jpg" alt="R-Loc" style="max-height: 80px; margin-bottom: 10px;">
      <h1>CONTRATO DE LOCAÇÃO DE BEM MÓVEL</h1>
      <h2>SEM SEÇÃO DE MÃO-DE-OBRA</h2>
    </div>

    <div class="info">
      <p><strong>Contrato:</strong> ${locacao.id}</p>
      <p><strong>Data:</strong> ${dataCriacao}</p>
      <p><strong>Locatário:</strong> ${locacao.cliente?.nome_razao_social || 'Cliente não encontrado'}</p>
      <p><strong>Endereço:</strong> ${locacao.cliente?.endereco || 'Endereço não informado'}</p>
      <p><strong>${documentoCliente.tipo}:</strong> ${documentoCliente.documento}</p>
      <p><strong>Locadora:</strong> ${this.empresaData.nome}</p>
      <p><strong>Endereço:</strong> ${this.empresaData.endereco}</p>
      <p><strong>CNPJ:</strong> ${this.empresaData.cnpj}</p>
      <p><strong>Telefone:</strong> ${this.empresaData.telefone}</p>
    </div>

    <p class="section-title">OBJETIVO DO CONTRATO</p>
    <p>O presente instrumento tem por objetivo a locação dos equipamentos abaixo:</p>

    <table>
      <thead>
        <tr>
          <th>Material</th>
          <th>Valor Base</th>
          <th>Qtd</th>
          <th>Data Início</th>
          <th>Data Fim</th>
          <th>Dias</th>
          <th>Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${itensHTML}
      </tbody>
    </table>

    <p><strong>Total:</strong> R$ ${total}</p>

    <p class="section-title">OBRIGAÇÕES DA LOCADORA</p>
    <p>A LOCADORA entregará a LOCATÁRIA os equipamentos objeto desta locação no local indicado, testado e em perfeito estado de conservação e de uso.</p>
    <p>A LOCADORA se compromete a fornecer assistência técnica básica durante o período de locação, conforme disponibilidade.</p>
    <p><strong>OBS:</strong> A LOCADORA não se responsabiliza por danos elétricos, falhas de energia, condições climáticas adversas ou uso inadequado dos equipamentos.</p>

    <p class="section-title">OBRIGAÇÕES DA LOCATÁRIA</p>
    <p>A LOCATÁRIA se compromete a:</p>
    <p>a) Utilizar os equipamentos exclusivamente para os fins a que se destinam;</p>
    <p>b) Manter os equipamentos em perfeito estado de conservação durante todo o período de locação;</p>
    <p>c) Não realizar modificações, reparos ou alterações nos equipamentos sem autorização prévia da LOCADORA;</p>
    <p>d) Devolver os equipamentos no prazo estabelecido, nas mesmas condições em que foram recebidos;</p>
    <p>e) Comunicar imediatamente à LOCADORA qualquer dano, avaria ou defeito nos equipamentos;</p>
    <p>f) Não emprestar, arrendar ou sublocar os equipamentos locados;</p>
    <p>g) Não transferir os equipamentos para outro local sem autorização prévia da LOCADORA;</p>
    <p>h) Responsabilizar-se por todos os danos causados aos equipamentos durante o período de locação.</p>

    <p class="section-title">PRAZO E ENTREGA</p>
    <p>O prazo de locação é de ${dataInicio} a ${dataFim}, podendo ser prorrogado mediante acordo entre as partes.</p>
    <p>A entrega dos equipamentos será realizada no endereço: ${locacao.cliente?.endereco || 'A ser definido'}.</p>
    <p>A devolução dos equipamentos deverá ser realizada no endereço da LOCADORA: ${this.empresaData.endereco}.</p>

    <p class="section-title">VALOR E FORMA DE PAGAMENTO</p>
    <p>O valor total da presente locação é de R$ ${total}.</p>
    <p>O pagamento deve ser efetuado no ato da emissão do contrato, através de: dinheiro, cartão de débito/crédito ou transferência bancária.</p>
    <p>Em caso de atraso no pagamento, será cobrada multa de 2% (dois por cento) sobre o valor em atraso, mais juros de 1% (um por cento) ao mês.</p>

    <p class="section-title">PENALIDADES E MULTA</p>
    <p>Em caso de atraso na devolução dos equipamentos, será cobrada multa de 10% (dez por cento) do valor total da locação por dia de atraso.</p>
    <p>Em caso de danos aos equipamentos, a LOCATÁRIA se responsabiliza pelo custo total do reparo ou substituição.</p>
    <p>Em caso de perda ou furto dos equipamentos, a LOCATÁRIA se responsabiliza pelo valor integral dos equipamentos.</p>

    <p class="section-title">RESCISÃO E RESOLUÇÃO</p>
    <p>O presente contrato poderá ser rescindido por qualquer das partes mediante aviso prévio de 24 (vinte e quatro) horas.</p>
    <p>Em caso de descumprimento das obrigações por parte da LOCATÁRIA, a LOCADORA poderá resolver o contrato imediatamente, sem prejuízo das multas e penalidades previstas.</p>
    <p>Em caso de rescisão antecipada por parte da LOCATÁRIA, não haverá restituição de valores já pagos.</p>

    <p class="section-title">RESPONSABILIDADES</p>
    <p>A LOCATÁRIA se responsabiliza integralmente pelo uso adequado dos equipamentos e por todos os danos que possam ocorrer durante o período de locação.</p>
    <p>A LOCADORA não se responsabiliza por acidentes, danos pessoais ou materiais decorrentes do uso dos equipamentos.</p>
    <p>É de responsabilidade da LOCATÁRIA verificar as condições técnicas adequadas para o funcionamento dos equipamentos no local de uso.</p>

    <p class="section-title">FORO E JURISDIÇÃO</p>
    <p>Fica eleito o Fórum da Comarca de Manaus para dirimir quaisquer dúvidas ou controvérsias decorrentes deste contrato.</p>
    <p>Este contrato é regido pelas leis brasileiras e qualquer alteração deverá ser feita por escrito e assinada por ambas as partes.</p>

    <div class="footer">
      <p>Manaus, ${dataAtual}</p>
    </div>

    <div class="assinaturas-container">
      <div class="assinaturas">
        <div>
          <p><strong>LOCADORA</strong></p>
          <p>${this.empresaData.nome.toUpperCase()}</p>
          <p>CNPJ: ${this.empresaData.cnpj}</p>
        </div>
        <div>
          <p><strong>LOCATÁRIA</strong></p>
          <p>${(locacao.cliente?.nome_razao_social || 'Cliente não encontrado').toUpperCase()}</p>
          <p>${documentoCliente.tipo}: ${documentoCliente.documento}</p>
        </div>
      </div>

      <div class="assinaturas">
        <div>
          <p><strong>TESTEMUNHA 1</strong></p>
          <p>Nome: ________________________</p>
          <p>CPF: _________________________</p>
        </div>
        <div>
          <p><strong>TESTEMUNHA 2</strong></p>
          <p>Nome: ________________________</p>
          <p>CPF: _________________________</p>
        </div>
      </div>
    </div>

  </div>
</body>
</html>`;
  }

  // Gerar HTML do recibo usando o template personalizado
  generateReciboHTML(locacao: Locacao): string {
    const dataInicio = new Date(locacao.data_inicio).toLocaleDateString('pt-BR');
    const dataFim = new Date(locacao.data_fim).toLocaleDateString('pt-BR');
    const dataCriacao = new Date(locacao.data_criacao).toLocaleDateString('pt-BR');
    const dataAtual = new Date().toLocaleDateString('pt-BR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });

    // Obter informações do documento do cliente
    const documentoCliente = this.getDocumentoInfo(locacao.cliente?.cnpj || locacao.cliente?.cpf);

    // Gerar linhas da tabela de itens
    const itensHTML = locacao.itens?.map(item => `
      <tr>
        <td>${this.getEquipamentoDescricao(item.equipamento_id)}</td>
        <td>R$ ${item.preco_unitario.toFixed(2).replace('.', ',')}</td>
        <td>${item.quantidade}</td>
        <td>${dataInicio}</td>
        <td>${dataFim}</td>
        <td>${item.dias}</td>
        <td>R$ ${item.subtotal.toFixed(2).replace('.', ',')}</td>
      </tr>
    `).join('') || '';

    const total = locacao.total_final.toFixed(2).replace('.', ',');

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Recibo</title>
  <style>
    @page {
      size: A4;
      margin: 1.5cm;
      page-break-inside: avoid;
    }

    body {
      font-family: Arial, sans-serif;
      font-size: 11pt;
      color: #000;
      margin: 0;
      padding: 0;
      line-height: 1.4;
      orphans: 3;
      widows: 3;
    }

    .container {
      width: 100%;
      margin: 0 auto;
    }

    .header {
      text-align: center;
      margin-bottom: 20px;
      page-break-inside: avoid;
    }

    .header img {
      max-height: 80px;
      margin-bottom: 10px;
    }

    .header h1 {
      font-size: 18pt;
      margin: 0;
      text-transform: uppercase;
    }

    .info {
      margin: 15px 0;
      page-break-inside: avoid;
    }

    .info p {
      margin: 2px 0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      page-break-inside: avoid;
    }

    table, th, td {
      border: 1px solid #000;
    }

    th, td {
      padding: 6px;
      text-align: left;
      font-size: 10pt;
      page-break-inside: avoid;
    }

    tr {
      page-break-inside: avoid;
    }

    .total {
      margin-top: 15px;
      font-weight: bold;
      page-break-inside: avoid;
    }

    .observacao {
      margin-top: 30px;
      font-size: 11pt;
      border: 1px solid #000;
      padding: 10px;
    }

    .footer {
      margin-top: 40px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">

    <div class="header">
      <img src="/logo-r-loc.jpg" alt="R-Loc" style="max-height: 80px; margin-bottom: 10px;">
      <h1>RECIBO</h1>
    </div>

    <div class="info">
      <p><strong>N. Recibo:</strong> ${locacao.id}</p>
      <p><strong>Data:</strong> ${dataCriacao}</p>
      <p><strong>Locatário:</strong> ${locacao.cliente?.nome_razao_social || 'Cliente não encontrado'}</p>
      <p><strong>Endereço:</strong> ${locacao.cliente?.endereco || 'Endereço não informado'}</p>
      <p><strong>${documentoCliente.tipo}:</strong> ${documentoCliente.documento}</p>
      <p><strong>Locadora:</strong> ${this.empresaData.nome}</p>
      <p><strong>Endereço:</strong> ${this.empresaData.endereco}</p>
      <p><strong>CNPJ:</strong> ${this.empresaData.cnpj}</p>
      <p><strong>Telefone:</strong> ${this.empresaData.telefone}</p>
    </div>

    <table>
      <thead>
        <tr>
          <th>Material</th>
          <th>Valor Base</th>
          <th>Qtd</th>
          <th>Data Início</th>
          <th>Data Fim</th>
          <th>Dias</th>
          <th>Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${itensHTML}
      </tbody>
    </table>

    <div class="total">
      <p><strong>Total:</strong> R$ ${total}</p>
    </div>

    <div class="observacao">
      <p><strong>OBSERVAÇÃO:</strong></p>
      <p>DE ACORDO COM O DECRETO N.0043 DA PMM, DE 04 DE MARÇO DE 2009 PARÁGRAFO 2° - PARA LOCAÇÃO DE BENS MÓVEIS SEM FORNECIMENTO DE MÃO-DE-OBRA, O SISTEMA NFS-E INABILITARÁ O SUBITEM 03.01.1 - LOCAÇÃO DE BENS MÓVEIS, COM INDICAÇÃO DE QUE TAL OPERAÇÃO ESTÁ DISPENSADA DA EMISSÃO DE DOCUMENTO FISCAL, EM VIRTUDE DA NÃO-INCIDÊNCIA DO ISS. EM SUBSTITUIÇÃO EMITIMOS ESTE RECIBO.</p>
    </div>

    <div class="footer">
      <p>Manaus, ${dataAtual}</p>
    </div>

  </div>
</body>
</html>`;
  }

  // Método auxiliar para obter descrição do equipamento
  private getEquipamentoDescricao(equipamentoId: number): string {
    const equipamento = this.equipamentos.find(e => e.id === equipamentoId);
    return equipamento ? equipamento.descricao : `Equipamento ID: ${equipamentoId}`;
  }

  // Método auxiliar para determinar se é CNPJ ou CPF
  private getDocumentoInfo(documento: string | undefined): { tipo: string, documento: string } {
    if (!documento) {
      return { tipo: 'Documento', documento: 'não informado' };
    }
    
    // Remove caracteres não numéricos
    const numeros = documento.replace(/\D/g, '');
    
    if (numeros.length === 11) {
      return { tipo: 'CPF', documento: documento };
    } else if (numeros.length === 14) {
      return { tipo: 'CNPJ', documento: documento };
    } else {
      return { tipo: 'Documento', documento: documento };
    }
  }

  // Exportar HTML para nova janela com botão de impressão
  exportToPDF(html: string, filename: string): void {
    try {
      // Criar HTML completo com botão de impressão e CSS otimizado
      const fullHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${filename}</title>
  <style>
    body {
      margin: 0;
      padding: 15px;
      font-family: Arial, sans-serif;
      background-color: #f5f5f5;
    }
    
    .print-button {
      position: fixed;
      top: 15px;
      right: 15px;
      background: #007bff;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      z-index: 1000;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    
    .print-button:hover {
      background: #0056b3;
    }
    
    .document-container {
      background: white;
      margin: 0 auto;
      max-width: 210mm;
      min-height: 297mm;
      padding: 15mm;
      box-shadow: 0 0 8px rgba(0,0,0,0.1);
      box-sizing: border-box;
    }
    
    @media print {
      body {
        background: white;
        padding: 0;
      }
      
      .print-button {
        display: none;
      }
      
      .document-container {
        box-shadow: none;
        margin: 0;
        padding: 15mm;
      }
    }
  </style>
</head>
<body>
  <button class="print-button" onclick="window.print()">🖨️ Imprimir</button>
  <div class="document-container">
    ${html}
  </div>
</body>
</html>`;

      // Abrir em nova janela
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(fullHtml);
        printWindow.document.close();
      } else {
        alert('Por favor, permita pop-ups para visualizar o documento.');
      }
      
    } catch (error) {
      console.error('Erro ao abrir documento:', error);
      alert('Erro ao abrir documento. Tente novamente.');
    }
  }

  // Exportar HTML para arquivo
  exportToFile(html: string, filename: string, type: 'html' | 'pdf' = 'html'): void {
    if (type === 'pdf') {
      this.exportToPDF(html, filename);
    } else {
      const blob = new Blob([html], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  }
}
