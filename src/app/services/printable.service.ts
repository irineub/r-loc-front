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

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

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

  // Gerar HTML do orçamento usando o template personalizado (similar ao recibo)
  generateOrcamentoHTML(orcamento: Orcamento): string {
    const dataInicio = new Date(orcamento.data_inicio).toLocaleDateString('pt-BR');
    const dataFim = new Date(orcamento.data_fim).toLocaleDateString('pt-BR');
    const dataCriacao = new Date(orcamento.data_criacao).toLocaleDateString('pt-BR');
    const dataAtual = new Date().toLocaleDateString('pt-BR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });

    // Obter informações do documento do cliente
    const documentoCliente = this.getDocumentoInfo(orcamento.cliente?.cnpj || orcamento.cliente?.cpf);

    // Gerar linhas da tabela de itens
    const itensHTML = orcamento.itens?.map(item => `
      <tr>
        <td>${this.getEquipamentoDescricao(item.equipamento_id)}</td>
        <td>${this.formatCurrency(item.preco_unitario)}</td>
        <td>${item.quantidade}</td>
        <td>${dataInicio}</td>
        <td>${dataFim}</td>
        <td>${item.dias}</td>
        <td>${this.formatCurrency(item.subtotal)}</td>
      </tr>
    `).join('') || '';

    const subtotal = orcamento.itens?.reduce((sum, item) => sum + item.subtotal, 0) || 0;
    const descontoValor = this.formatCurrency(orcamento.desconto);
    const frete = this.formatCurrency(orcamento.frete);
    const total = this.formatCurrency(orcamento.total_final);

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Orçamento</title>
  <style>
    @page {
      size: A4;
      margin: 1cm;
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
      <h1>ORÇAMENTO</h1>
    </div>

    <div class="info">
      <p><strong>N. Orçamento:</strong> ${orcamento.id}</p>
      <p><strong>Data:</strong> ${dataCriacao}</p>
      <p><strong>Cliente:</strong> ${orcamento.cliente?.nome_razao_social || 'Cliente não encontrado'}</p>
      <p><strong>Endereço:</strong> ${orcamento.cliente?.endereco || 'Endereço não informado'}</p>
      <p><strong>${documentoCliente.tipo}:</strong> ${documentoCliente.documento}</p>
      <p><strong>Período:</strong> ${dataInicio} a ${dataFim}</p>
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
      <p><strong>Subtotal:</strong> ${this.formatCurrency(subtotal)}</p>
      <p><strong>Desconto:</strong> R$ ${descontoValor}</p>
      <p><strong>Frete:</strong> R$ ${frete}</p>
      <p><strong>Total:</strong> R$ ${total}</p>
    </div>

    <div class="observacao">
      <p><strong>OBSERVAÇÃO:</strong></p>
      <p>${orcamento.observacoes || 'Este orçamento tem validade de 30 dias a partir da data de emissão. Os valores estão sujeitos a alteração sem aviso prévio.'}</p>
    </div>

    <div class="footer">
      <p>Manaus, ${dataAtual}</p>
    </div>

  </div>
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
        <td>${this.formatCurrency(item.preco_unitario)}</td>
        <td>${item.quantidade}</td>
        <td>${dataInicio}</td>
        <td>${dataFim}</td>
        <td>${item.dias}</td>
        <td>${this.formatCurrency(item.subtotal)}</td>
      </tr>
    `).join('') || '';

    const total = this.formatCurrency(locacao.total_final);

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Contrato de Locação</title>
  <style>
    @page {
      size: A4;
      margin: 10mm; /* margens menores e consistentes */
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

    .page {
      width: 100%;
      padding: 6mm 0; /* remover sobra lateral, usar container centralizado */
      margin: 0 auto;
      background: white;
      position: relative;
      page-break-after: avoid;
    }

    .page:last-child {
      page-break-after: avoid;
    }

    /* Ajustes específicos para a segunda página */
    .page.page-2 {
      padding-top: 4mm;
      padding-bottom: 8mm;
    }
    .page.page-2 * {
      line-height: 1.35;
    }
    .page.page-2 .section-title {
      margin-top: 10px;
      margin-bottom: 8px;
    }
    .page.page-2 p {
      margin: 3px 0;
      font-size: 11pt;
    }
    .page.page-2 .footer {
      margin-top: 15px;
      margin-bottom: 20px;
    }
    .page.page-2 .assinaturas-container {
      margin-top: 35px;
    }
    .page.page-2 .assinaturas div {
      width: 48%;
      font-size: 11pt;
    }
    .page.page-2 .assinaturas .linha-assinatura {
      border-bottom: 1px solid #000;
      height: 1px;
      margin-bottom: 10px;
      width: 100%;
      display: block;
      white-space: nowrap;
    }
    .linha-assinatura {
      margin-top: 20px;
    }

    .container {
      width: 100%;
      max-width: 180mm; /* conteúdo centralizado e largura confortável */
      margin: 0 auto;
    }

    .header {
      text-align: center;
      margin-bottom: 12px; /* reduzir espaço abaixo do cabeçalho */
      page-break-inside: avoid;
    }

    .header img {
      max-height: 64px; /* logo mais compacto */
      margin-bottom: 8px;
    }

    .header h1 {
      font-size: 15pt;
      margin: 0;
    }

    .header h2 {
      font-size: 11pt;
      margin: 0;
      font-weight: normal;
    }

    .info {
      margin: 8px 0;
      page-break-inside: avoid;
    }

    .info p {
      margin: 2px 0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
      page-break-inside: avoid;
    }

    table, th, td {
      border: 1px solid #000;
    }

    th, td {
      padding: 5px 6px;
      text-align: left;
      font-size: 10pt;
      page-break-inside: avoid;
    }

    tr {
      page-break-inside: avoid;
    }

    .section-title {
      font-weight: bold;
      margin-top: 10px;
      text-transform: uppercase;
      page-break-after: avoid;
      text-align: center; /* melhor alinhamento visual */
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
      margin-top: 16px; /* reduzir espaço para evitar pular página cedo */
      text-align: center;
      page-break-inside: avoid;
    }

    .linha {
      margin-top: 50px;
      text-align: center;
    }

    .page-number {
      position: absolute;
      bottom: 20mm;
      right: 20mm;
      font-size: 10px;
      color: #666;
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
  <!-- PÁGINA 1 -->
  <div class="page">
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

      <p><strong>Total:</strong> ${total}</p>

      

      <div class="page-number">1</div>
    </div>
  </div>

  <!-- PÁGINA 2 -->
  <div class="page page-2">
    <div class="container">
      <p class="section-title">PRAZO E ENTREGA</p>
      <p>O prazo de locação é de ${dataInicio} a ${dataFim}, podendo ser prorrogado mediante acordo entre as partes.</p>
      <p>A entrega dos equipamentos será realizada no endereço: ${locacao.cliente?.endereco || 'A ser definido'}.</p>
      <p>A devolução dos equipamentos deverá ser realizada no endereço da LOCADORA: ${this.empresaData.endereco}.</p>

      <p class="section-title">VALOR E FORMA DE PAGAMENTO</p>
      <p>O valor total da presente locação é de ${total}.</p>
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
            <div class="linha-assinatura"></div>
            <p><strong>LOCADORA</strong></p>
            <p>${this.empresaData.nome.toUpperCase()}</p>
            <p>CNPJ: ${this.empresaData.cnpj}</p>
          </div>
          <div>
            <div class="linha-assinatura"></div>
            <p><strong>LOCATÁRIA</strong></p>
            <p>${(locacao.cliente?.nome_razao_social || 'Cliente não encontrado').toUpperCase()}</p>
            <p>${documentoCliente.tipo}: ${documentoCliente.documento}</p>
          </div>
        </div>

        <div class="assinaturas">
          <div>
            <div class="linha-assinatura"></div>
            <p><strong>TESTEMUNHA 1</strong></p>
            <p>Nome: ________________________</p>
            <p>CPF: _________________________</p>
          </div>
          <div>
            <div class="linha-assinatura"></div>
            <p><strong>TESTEMUNHA 2</strong></p>
            <p>Nome: ________________________</p>
            <p>CPF: _________________________</p>
          </div>
        </div>
      </div>

      <div class="page-number">2</div>
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
        <td>${this.formatCurrency(item.preco_unitario)}</td>
        <td>${item.quantidade}</td>
        <td>${dataInicio}</td>
        <td>${dataFim}</td>
        <td>${item.dias}</td>
        <td>${this.formatCurrency(item.subtotal)}</td>
      </tr>
    `).join('') || '';

    const total = this.formatCurrency(locacao.total_final);

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
      <p><strong>Total:</strong> ${total}</p>
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
