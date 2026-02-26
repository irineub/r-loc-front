import { Injectable } from '@angular/core';
import { Orcamento, Locacao, Equipamento } from '../models/index';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { WhatsappService } from './whatsapp.service';
import { SnackbarService } from './snackbar.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PrintableService {

  private equipamentos: Equipamento[] = [];
  private timezone = 'America/Manaus';
  private logoDataUrl: string | null = null;

  constructor(
    private apiService: ApiService,
    private whatsappService: WhatsappService,
    private snackbarService: SnackbarService
  ) {
    this.whatsappService.getTimezoneConfig().subscribe({
      next: (config) => {
        if (config && config.timezone) {
          this.timezone = config.timezone;
        }
      },
      error: () => console.log('Usando timezone padrão: America/Manaus')
    });
    // Pre-load logo as data URL so it always works in blob:// pages
    this.preloadLogo();
  }

  /** Fetches the logo and caches it as a base64 data URL */
  private preloadLogo(): void {
    const logoUrl = `${window.location.origin}/logo-r-loc.jpg`;
    fetch(logoUrl)
      .then(r => r.blob())
      .then(blob => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }))
      .then(dataUrl => { this.logoDataUrl = dataUrl; })
      .catch(() => console.warn('Logo não pôde ser pré-carregada'));
  }

  /** Replaces all /logo-r-loc.jpg references with an embedded data URL */
  private injectLogo(html: string): string {
    if (!this.logoDataUrl) return html;
    return html
      .replace(/src="\/logo-r-loc\.jpg"/g, `src="${this.logoDataUrl}"`)
      .replace(/src='\/logo-r-loc\.jpg'/g, `src='${this.logoDataUrl}'`);
  }


  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  formatPhone(phone: string | undefined | null): string {
    if (!phone) return '';
    let num = phone.replace(/\D/g, '');

    // Remove +55 se o usuário digitou
    if (num.startsWith('55') && num.length >= 12) {
      num = num.substring(2);
    }

    if (num.length === 11) {
      return `(${num.substring(0, 2)}) ${num.substring(2, 7)}-${num.substring(7)}`;
    } else if (num.length === 10) {
      return `(${num.substring(0, 2)}) ${num.substring(2, 6)}-${num.substring(6)}`;
    } else if (num.length === 9) {
      return `${num.substring(0, 5)}-${num.substring(5)}`;
    } else if (num.length === 8) {
      return `${num.substring(0, 4)}-${num.substring(4)}`;
    }

    // Retorna original se não tem o tamanho padrão de telefone brasileiro
    return phone;
  }

  // Método para definir os equipamentos disponíveis
  setEquipamentos(equipamentos: Equipamento[]) {
    this.equipamentos = equipamentos;
  }

  // Helper para formatar data de contrato (usa string YYYY-MM-DD para evitar shift de timezone)
  private formatDateForContract(dateStr: string): string {
    if (!dateStr) return '-';
    const datePart = dateStr.split('T')[0];
    const parts = datePart.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return datePart;
  }

  // Helper para formatar data de criação/sistema (usa timezone configurado)
  private formatSystemDate(dateStr: string): string {
    if (!dateStr) return '-';
    // Se a string vier sem offset (naive) e assumimos que é UTC, adicionar Z?
    // Pydantic envia ISO com offset se for aware.
    return new Date(dateStr).toLocaleDateString('pt-BR', { timeZone: this.timezone });
  }

  // Helper para data atual por extenso
  private getCurrentDateExtenso(): string {
    return new Date().toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: this.timezone
    });
  }

  // Helper: retorna a maior data_fim entre os itens (ou fallback se nenhum item tem data_fim)
  private getMaxItemDataFim(itens: Array<{ data_inicio?: string; data_fim?: string; dias?: number }> | undefined, fallback: string): string {
    if (!itens || itens.length === 0) return fallback;
    const datas = itens
      .map(i => this.computeItemDataFim(i, fallback))
      .filter((d): d is string => !!d);
    if (datas.length === 0) return fallback;
    const maxDate = datas.reduce((max, d) => d > max ? d : max);
    return maxDate;
  }

  // Helper: retorna a data_fim do item — se não existir, calcula a partir de data_inicio + dias
  private computeItemDataFim(item: { data_inicio?: string; data_fim?: string; dias?: number }, fallback: string): string {
    if (item.data_fim) return item.data_fim.split('T')[0];
    // Calcular a partir de data_inicio + dias
    const dataInicioStr = item.data_inicio ? item.data_inicio.split('T')[0] : fallback.split('T')[0];
    if (dataInicioStr && item.dias && item.dias > 0) {
      const parts = dataInicioStr.split('-');
      const dt = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      dt.setDate(dt.getDate() + item.dias);
      return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    }
    return fallback;
  }


  // Dados da empresa (configuráveis)
  private empresaData = {
    nome: 'JR Loc',
    endereco: 'Rua Indio Ajuricaba, 1 - Gilberto Mestrinho / Manaus-AM',
    cnpj: '09.181.720/0001-75',
    telefone: '(92) 99153-4302 / 99457-0101'
  };

  // Gerar HTML do orçamento usando o template personalizado
  generateOrcamentoHTML(orcamento: Orcamento): string {
    const dataInicio = this.formatDateForContract(orcamento.data_inicio);
    // Usar a maior data_fim entre os itens como data de devolução do contrato
    const maxDataFimRaw = this.getMaxItemDataFim(orcamento.itens, orcamento.data_fim);
    const dataFim = this.formatDateForContract(maxDataFimRaw);
    const dataCriacao = this.formatSystemDate(orcamento.data_criacao);
    const dataAtual = this.getCurrentDateExtenso();

    // Obter informações do documento do cliente
    const documentoCliente = this.getDocumentoInfo(orcamento.cliente?.cnpj || orcamento.cliente?.cpf);
    const documentoFormatado = documentoCliente.documento.replace(/\D/g, '');

    const celularFormatado = this.formatPhone(orcamento.cliente?.telefone_celular);
    const telComercialFormatado = this.formatPhone(orcamento.cliente?.telefone_comercial);

    // Gerar linhas da tabela de itens com formatação otimizada para impressão
    const itensHTML = orcamento.itens?.map(item => {
      const itemDataInicio = item.data_inicio ? this.formatDateForContract(item.data_inicio) : dataInicio;
      const itemDataFim = this.formatDateForContract(this.computeItemDataFim(item, dataFim));
      return `
      <tr>
        <td style="text-align: left; vertical-align: middle;">${this.getEquipamentoDescricao(item.equipamento_id)}</td>
        <td style="text-align: right; vertical-align: middle;">${this.formatCurrency(item.preco_unitario)}</td>
        <td style="text-align: center; vertical-align: middle;">${item.quantidade}</td>
        <td style="text-align: center; vertical-align: middle;">${itemDataInicio}</td>
        <td style="text-align: center; vertical-align: middle;">${itemDataFim}</td>
        <td style="text-align: center; vertical-align: middle;">${item.dias}</td>
        <td style="text-align: right; vertical-align: middle;">${this.formatCurrency(item.subtotal)}</td>
      </tr>
    `}).join('') || '';

    const subtotal = orcamento.itens?.reduce((sum, item) => sum + item.subtotal, 0) || 0;
    const descontoValor = this.formatCurrency(orcamento.desconto || 0);
    const frete = this.formatCurrency(orcamento.frete || 0);
    const total = this.formatCurrency(orcamento.total_final);

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Orçamento ${orcamento.id}</title>
  <style>
    @page {
      size: A4;
      margin: 1cm;
      page-break-inside: avoid;
    }

    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11pt;
      color: #000;
      margin: 0;
      padding: 0;
      line-height: 1.4;
      background: white;
    }

    .container-orcamento {
      width: 210mm;
      max-width: 800px;
      margin: 0 auto;
      padding: 15mm;
      border: 1px solid #000;
      box-sizing: border-box;
      background: white;
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      page-break-inside: avoid;
    }

    .empresa {
      font-size: 16pt;
      font-weight: bold;
      text-transform: uppercase;
    }

    .info-orcamento {
      text-align: right;
    }

    .info-orcamento p {
      margin: 2px 0;
      font-size: 11pt;
    }

    .titulo {
      text-align: center;
      font-size: 18pt;
      font-weight: bold;
      text-transform: uppercase;
      margin: 20px 0;
      page-break-inside: avoid;
    }

    .dados-empresa {
      margin: 15px 0;
      page-break-inside: avoid;
    }

    .dados-empresa p {
      margin: 2px 0;
      font-size: 10pt;
    }

    .bloco {
      margin: 15px 0;
      page-break-inside: avoid;
    }

    .bloco strong {
      display: block;
      margin-bottom: 5px;
      font-size: 11pt;
    }

    .bloco p {
      margin: 2px 0;
      font-size: 10pt;
    }

    .tabela-materiais {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      page-break-inside: avoid;
    }

    .tabela-materiais th,
    .tabela-materiais td {
      border: 1px solid #000;
      padding: 8px 6px;
      font-size: 10pt;
      vertical-align: middle;
    }

    .tabela-materiais th {
      background-color: #f0f0f0;
      font-weight: bold;
      text-align: center;
    }
    
    .tabela-materiais td {
      text-align: left;
    }
    
    .tabela-materiais td:nth-child(2),
    .tabela-materiais td:nth-child(7) {
      text-align: right;
    }
    
    .tabela-materiais td:nth-child(3),
    .tabela-materiais td:nth-child(4),
    .tabela-materiais td:nth-child(5),
    .tabela-materiais td:nth-child(6) {
      text-align: center;
    }

    .tabela-materiais tbody tr {
      page-break-inside: avoid;
    }

    .resumo {
      margin-top: 20px;
      text-align: right;
      page-break-inside: avoid;
    }

    .resumo p {
      margin: 5px 0;
      font-size: 11pt;
    }

    .resumo .total {
      font-weight: bold;
      font-size: 13pt;
      margin-top: 10px;
      padding-top: 5px;
      border-top: 2px solid #000;
    }

    .rodape {
      margin-top: 40px;
      text-align: center;
      page-break-inside: avoid;
    }

    .rodape img {
      max-height: 60px;
    }

    @media print {
      body {
        background: white;
      }

      .container-orcamento {
        border: none;
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="container-orcamento">

    <!-- Cabeçalho Superior -->
    <div class="header-top">
      <div class="empresa"><img src="/logo-r-loc.jpg" alt="Grupo JR Loc" style="max-height: 60px;"></div>
      <div class="info-orcamento">
        <p><strong>Orçamento: ${orcamento.id}</strong></p>
        <p><strong>Data: ${dataCriacao}</strong></p>
      </div>
    </div>

    <!-- Título -->
    <h1 class="titulo">ORÇAMENTO</h1>

    <!-- Dados da Locadora -->
    <div class="bloco">
      <strong>Locadora:</strong>
      <p>${this.empresaData.nome}</p>
      <p>Endereço: ${this.empresaData.endereco}</p>
      <p>CNPJ: ${this.empresaData.cnpj}</p>
      <p>Telefone: ${this.empresaData.telefone}</p>
    </div>

    <!-- Dados do Locatário -->
    <div class="bloco">
      <strong>Locatário:</strong>
      <p>${orcamento.cliente?.nome_razao_social || 'Cliente não encontrado'}</p>
      <p>Endereço: ${orcamento.cliente?.endereco || 'Endereço não informado'}</p>
      <p>${documentoCliente.tipo}: ${documentoFormatado}</p>
      ${celularFormatado ? `<p>Celular: ${celularFormatado}</p>` : ''}
      ${telComercialFormatado ? `<p>Tel. Comercial: ${telComercialFormatado}</p>` : ''}
    </div>


    <!-- Tabela de Materiais -->
    <table class="tabela-materiais">
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

    <!-- Resumo Financeiro -->
    <div class="resumo">
      <p>Subtotal: ${this.formatCurrency(subtotal)}</p>
      ${orcamento.desconto && orcamento.desconto > 0 ? `<p>Desconto: ${descontoValor}</p>` : ''}
      ${orcamento.frete && orcamento.frete > 0 ? `<p>Frete/Adicional: ${frete}</p>` : ''}
      <p class="total">Total: ${total}</p>
    </div>

    <!-- Rodapé -->
    <div class="rodape">
      <img src="/logo-r-loc.jpg" alt="Grupo JR Loc">
    </div>

  </div>
</body>
</html>`;
  }

  // Gerar HTML do contrato usando o template personalizado
  generateContratoHTML(locacao: Locacao): string {
    const dataInicio = this.formatDateForContract(locacao.data_inicio);
    // Usar a maior data_fim entre os itens como data de devolução do contrato
    const maxDataFimRaw = this.getMaxItemDataFim(locacao.itens, locacao.data_fim);
    const dataFim = this.formatDateForContract(maxDataFimRaw);
    const dataCriacao = this.formatSystemDate(locacao.data_criacao);
    const dataAtual = this.getCurrentDateExtenso();

    // Obter informações do documento do cliente
    const documentoCliente = this.getDocumentoInfo(locacao.cliente?.cnpj || locacao.cliente?.cpf);

    const celularFormatado = this.formatPhone(locacao.cliente?.telefone_celular);
    const telComercialFormatado = this.formatPhone(locacao.cliente?.telefone_comercial);

    // Gerar linhas da tabela de itens com formatação melhorada
    const itensHTML = locacao.itens?.map(item => {
      const itemDataInicio = item.data_inicio ? this.formatDateForContract(item.data_inicio) : dataInicio;
      const itemDataFim = this.formatDateForContract(this.computeItemDataFim(item, dataFim));
      return `
      <tr>
        <td style="text-align: left; vertical-align: middle;">${this.getEquipamentoDescricao(item.equipamento_id)}</td>
        <td style="text-align: right; vertical-align: middle;">${this.formatCurrency(item.preco_unitario)}</td>
        <td style="text-align: center; vertical-align: middle;">${item.quantidade}</td>
        <td style="text-align: center; vertical-align: middle;">${itemDataInicio}</td>
        <td style="text-align: center; vertical-align: middle; white-space: nowrap;">
          <div style="display: block; line-height: 1.3;">${itemDataFim}</div>
        </td>
        <td style="text-align: right; vertical-align: middle;">${this.formatCurrency(item.subtotal)}</td>
      </tr>
    `}).join('') || '';

    // Calcular subtotal, desconto e frete do orçamento
    const subtotal = locacao.itens?.reduce((sum, item) => sum + item.subtotal, 0) || 0;
    const desconto = locacao.orcamento?.desconto || 0;
    const frete = locacao.orcamento?.frete || 0;
    const total = this.formatCurrency(locacao.total_final);
    const subtotalFormatado = this.formatCurrency(subtotal);
    const descontoFormatado = this.formatCurrency(desconto);
    const freteFormatado = this.formatCurrency(frete);

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
      padding: 0;
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
      padding: 0;
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

    th {
      padding: 8px 6px;
      text-align: center;
      font-size: 9pt;
      font-weight: bold;
      background-color: #f0f0f0;
      page-break-inside: avoid;
      vertical-align: middle;
    }

    td {
      padding: 6px 6px;
      text-align: left;
      font-size: 9pt;
      page-break-inside: avoid;
      vertical-align: middle;
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
      margin-top: 20px;
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
      position: relative; /* Para a assinatura Base64 se encaixar bem */
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
        ${celularFormatado ? `<p><strong>Celular:</strong> ${celularFormatado}</p>` : ''}
        ${telComercialFormatado ? `<p><strong>Tel. Comercial:</strong> ${telComercialFormatado}</p>` : ''}
        <br/>
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
            <th style="width: 30%;">Material</th>
            <th style="width: 12%;">Valor Base</th>
            <th style="width: 8%;">Qtd</th>
            <th style="width: 15%;">Data Início</th>
            <th style="width: 20%;">Data Fim</th>
            <th style="width: 15%;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itensHTML}
        </tbody>
      </table>

      <!-- Resumo Financeiro -->
      <div style="margin-top: 15px; text-align: right; page-break-inside: avoid;">
        <p style="margin: 3px 0; font-size: 10pt;"><strong>Subtotal:</strong> ${subtotalFormatado}</p>
        ${desconto > 0 ? `<p style="margin: 3px 0; font-size: 10pt; color: #d32f2f;"><strong>Desconto:</strong> ${descontoFormatado}</p>` : ''}
        ${frete > 0 ? `<p style="margin: 3px 0; font-size: 10pt; color: #2e7d32;"><strong>Frete/Adicional:</strong> ${freteFormatado}</p>` : ''}
        <p style="margin: 8px 0 0 0; font-size: 12pt; font-weight: bold; padding-top: 5px; border-top: 2px solid #000;"><strong>Total:</strong> ${total}</p>
      </div>
    </div>
  </div>

  <!-- PÁGINA 2 -->
  <div class="page page-2">
    <div class="container">
      <p class="section-title">PRAZO E ENTREGA</p>
      <p>O prazo de locação é de ${dataInicio} a ${dataFim}${locacao.itens?.[0]?.dias ? ` (${locacao.itens[0].dias} dias)` : ''}, podendo ser prorrogado mediante acordo entre as partes.</p>
      <p>A entrega dos equipamentos será realizada no endereço: ${locacao.endereco_entrega || locacao.cliente?.endereco || 'A ser definido'}.</p>
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
        <div class="assinaturas" style="display: flex; justify-content: space-between; margin-bottom: 15px;">
          <div style="width: 45%; text-align: center;">
            <div style="height: 50px;"></div>
            <div class="linha-assinatura" style="border-top: 1px solid #000; width: 100%; margin: 0 auto 5px auto;"></div>
            <p style="margin: 2px 0; font-size: 10pt;"><strong>LOCADORA</strong></p>
            <p style="margin: 2px 0; font-size: 10pt;">${this.empresaData.nome.toUpperCase()}</p>
            <p style="margin: 2px 0; font-size: 10pt;">CNPJ: ${this.empresaData.cnpj}</p>
          </div>
          <div style="width: 45%; text-align: center;">
            <div id="assinatura-locataria-container" style="height: 50px; position: relative;">
              ${locacao.assinatura_base64 ? `<img src="${locacao.assinatura_base64}" style="max-height: 150px; max-width: 350px; width: 100%; object-fit: contain; position: absolute; bottom: 0px; left: 50%; transform: translateX(-10%); z-index: 10;">` : ''}
            </div>
            <div class="linha-assinatura" style="border-top: 1px solid #000; width: 100%; margin: 0 auto 5px auto; position: relative; z-index: 1;"></div>
            <p style="margin: 2px 0; font-size: 10pt;"><strong>LOCATÁRIA</strong></p>
            <p style="margin: 2px 0; font-size: 10pt;">${(locacao.cliente?.nome_razao_social || 'Cliente não encontrado').toUpperCase()}</p>
            <p style="margin: 2px 0; font-size: 10pt;">${documentoCliente.tipo}: ${documentoCliente.documento}</p>
            ${celularFormatado ? `<p style="margin: 2px 0; font-size: 10pt;">Celular: ${celularFormatado}</p>` : ''}
            ${telComercialFormatado ? `<p style="margin: 2px 0; font-size: 10pt;">Tel. Comercial: ${telComercialFormatado}</p>` : ''}
          </div>
        </div>

        <div class="assinaturas" style="display: flex; justify-content: space-between;">
          <div style="width: 45%; text-align: center;">
            <div style="height: 40px;"></div>
            <div class="linha-assinatura" style="border-top: 1px solid #000; width: 100%; margin: 0 auto 5px auto;"></div>
            <p style="margin: 2px 0; font-size: 10pt;"><strong>TESTEMUNHA 1</strong></p>
            <p style="margin: 2px 0; font-size: 10pt;">Nome: ________________________</p>
            <p style="margin: 2px 0; font-size: 10pt;">CPF: _________________________</p>
          </div>
          <div style="width: 45%; text-align: center;">
            <div style="height: 40px;"></div>
            <div class="linha-assinatura" style="border-top: 1px solid #000; width: 100%; margin: 0 auto 5px auto;"></div>
            <p style="margin: 2px 0; font-size: 10pt;"><strong>TESTEMUNHA 2</strong></p>
            <p style="margin: 2px 0; font-size: 10pt;">Nome: ________________________</p>
            <p style="margin: 2px 0; font-size: 10pt;">CPF: _________________________</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`
  }

  // Gerar HTML do recibo usando o template personalizado
  generateReciboHTML(locacao: Locacao): string {
    const dataInicio = this.formatDateForContract(locacao.data_inicio);
    // Usar a maior data_fim entre os itens como data de devolução do recibo
    const maxDataFimRaw = this.getMaxItemDataFim(locacao.itens, locacao.data_fim);
    const dataFim = this.formatDateForContract(maxDataFimRaw);
    const dataCriacao = this.formatSystemDate(locacao.data_criacao);
    const dataAtual = this.getCurrentDateExtenso();

    // Obter informações do documento do cliente
    const documentoCliente = this.getDocumentoInfo(locacao.cliente?.cnpj || locacao.cliente?.cpf);

    const celularFormatado = this.formatPhone(locacao.cliente?.telefone_celular);
    const telComercialFormatado = this.formatPhone(locacao.cliente?.telefone_comercial);

    // Gerar linhas da tabela de itens com formatação melhorada
    const itensHTML = locacao.itens?.map(item => {
      const itemDataInicio = item.data_inicio ? this.formatDateForContract(item.data_inicio) : dataInicio;
      const itemDataFim = this.formatDateForContract(this.computeItemDataFim(item, dataFim));
      return `
      <tr>
        <td style="text-align: left; vertical-align: middle;">${this.getEquipamentoDescricao(item.equipamento_id)}</td>
        <td style="text-align: right; vertical-align: middle;">${this.formatCurrency(item.preco_unitario)}</td>
        <td style="text-align: center; vertical-align: middle;">${item.quantidade}</td>
        <td style="text-align: center; vertical-align: middle;">${itemDataInicio}</td>
        <td style="text-align: center; vertical-align: middle; white-space: nowrap;">
          <div style="display: block; line-height: 1.3;">${itemDataFim}</div>
          <div style="display: block; font-size: 8pt; color: #666; margin-top: 1px;">${item.dias} dia${item.dias !== 1 ? 's' : ''}</div>
        </td>
        <td style="text-align: right; vertical-align: middle;">${this.formatCurrency(item.subtotal)}</td>
      </tr>
    `}).join('') || '';

    // Calcular subtotal, desconto e frete do orçamento
    const subtotal = locacao.itens?.reduce((sum, item) => sum + item.subtotal, 0) || 0;
    const desconto = locacao.orcamento?.desconto || 0;
    const frete = locacao.orcamento?.frete || 0;
    const total = this.formatCurrency(locacao.total_final);
    const subtotalFormatado = this.formatCurrency(subtotal);
    const descontoFormatado = this.formatCurrency(desconto);
    const freteFormatado = this.formatCurrency(frete);

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

    th {
      padding: 8px 6px;
      text-align: center;
      font-size: 9pt;
      font-weight: bold;
      background-color: #f0f0f0;
      page-break-inside: avoid;
      vertical-align: middle;
    }

    td {
      padding: 6px 6px;
      text-align: left;
      font-size: 9pt;
      page-break-inside: avoid;
      vertical-align: middle;
    }

    tr {
      page-break-inside: avoid;
    }

    .resumo-financeiro {
      margin-top: 15px;
      text-align: right;
      page-break-inside: avoid;
    }

    .resumo-financeiro p {
      margin: 3px 0;
      font-size: 10pt;
    }

    .resumo-financeiro .total {
      margin-top: 8px;
      padding-top: 5px;
      border-top: 2px solid #000;
      font-size: 12pt;
      font-weight: bold;
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
      ${celularFormatado ? `<p><strong>Celular:</strong> ${celularFormatado}</p>` : ''}
      ${telComercialFormatado ? `<p><strong>Tel. Comercial:</strong> ${telComercialFormatado}</p>` : ''}
      <br/>
      <p><strong>Locadora:</strong> ${this.empresaData.nome}</p>
      <p><strong>Endereço:</strong> ${this.empresaData.endereco}</p>
      <p><strong>CNPJ:</strong> ${this.empresaData.cnpj}</p>
      <p><strong>Telefone:</strong> ${this.empresaData.telefone}</p>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 30%;">Material</th>
          <th style="width: 12%;">Valor Base</th>
          <th style="width: 8%;">Qtd</th>
          <th style="width: 15%;">Data Início</th>
          <th style="width: 20%;">Data Fim</th>
          <th style="width: 15%;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${itensHTML}
      </tbody>
    </table>

    <!-- Resumo Financeiro -->
    <div class="resumo-financeiro">
      <p><strong>Subtotal:</strong> ${subtotalFormatado}</p>
      ${desconto > 0 ? `<p style="color: #d32f2f;"><strong>Desconto:</strong> ${descontoFormatado}</p>` : ''}
      ${frete > 0 ? `<p style="color: #2e7d32;"><strong>Frete/Adicional:</strong> ${freteFormatado}</p>` : ''}
      <p class="total"><strong>Total:</strong> ${total}</p>
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
      // Injetar logo como data URL (funciona em blob://, PDF, etc)
      const htmlComLogo = this.injectLogo(html);
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
    ${htmlComLogo}
  </div>
</body>
</html>`;

      // Abrir em nova aba usando Blob URL (evita interferência com o roteador Angular)
      const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const printWindow = window.open(blobUrl, '_blank');
      if (!printWindow) {
        this.snackbarService.error('Por favor, permita pop-ups para visualizar o documento.');
      }
      // Liberar o objeto URL após um tempo
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);

    } catch (error) {
      console.error('Erro ao abrir documento:', error);
      this.snackbarService.error('Erro ao abrir documento. Tente novamente.');
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

  // Gera um Blob do PDF a partir do HTML usando o backend
  generatePdfBlob(html: string): Observable<Blob> {
    // Injetar logo como data URL antes de enviar ao backend
    const htmlComLogo = this.injectLogo(html);
    const endpoint = '/pdf/generate';
    return this.apiService.postHtmlReturnBlob(endpoint, htmlComLogo);
  }

  // Upload do PDF para o backend
  uploadPDF(blob: Blob, filename: string): Observable<{ url: string }> {
    // Garantir que o blob tenha o tipo correto de PDF
    const pdfBlob = blob.type === 'application/pdf'
      ? blob
      : new Blob([blob], { type: 'application/pdf' });
    const formData = new FormData();
    formData.append('file', pdfBlob, filename);
    return this.apiService.postFile<{ url: string }>('/upload', formData);
  }
}
