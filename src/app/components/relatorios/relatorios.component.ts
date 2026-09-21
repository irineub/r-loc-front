import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LogService, LogAuditoria } from '../../services/log.service';
import { FuncionarioService, Funcionario } from '../../services/funcionario.service';
import { RelatorioService } from '../../services/relatorio.service';
import { SnackbarService } from '../../services/snackbar.service';
import * as XLSX from 'xlsx';

@Component({
    selector: 'app-relatorios',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './relatorios.component.html',
    styleUrls: ['./relatorios.component.scss']
})
export class RelatoriosComponent implements OnInit {
    logs: LogAuditoria[] = [];
    relatorioData: any[] = [];
    funcionarios: Funcionario[] = [];

    // Filters
    selectedFuncionario: number | null = null;
    selectedEntidade: string | null = null;
    startDate: string = '';
    endDate: string = '';
    /** today | last7 | last30 | month | custom */
    selectedPeriod: string = 'last30';

    isLoading = false;

    constructor(
        private logService: LogService,
        private funcionarioService: FuncionarioService,
        private relatorioService: RelatorioService,
        private snackbarService: SnackbarService
    ) { }

    ngOnInit() {
        this.setPeriod('last30');
        this.loadFuncionarios();
        this.loadData();
    }

    /** Texto amigável do período atual (aparece abaixo dos botões) */
    get periodoResumo(): string {
        if (!this.startDate || !this.endDate) {
            return '';
        }
        const ini = this.formatarDataBr(this.startDate);
        const fim = this.formatarDataBr(this.endDate);
        if (this.startDate === this.endDate) {
            return `Só o dia ${ini}.`;
        }
        return `De ${ini} até ${fim} (inclusive).`;
    }

    private formatarDataBr(isoDate: string): string {
        const p = isoDate.split('-').map(Number);
        if (p.length !== 3 || p.some((n) => !Number.isFinite(n))) {
            return isoDate;
        }
        const d = String(p[2]).padStart(2, '0');
        const m = String(p[1]).padStart(2, '0');
        return `${d}/${m}/${p[0]}`;
    }

    get tipoRelatorioLabel(): string {
        switch (this.selectedEntidade) {
            case 'orcamento':
                return 'Orçamentos';
            case 'locacao':
                return 'Contratos de locação';
            case 'cliente':
                return 'Clientes';
            case 'equipamento':
                return 'Equipamentos';
            default:
                return 'Movimentação no sistema';
        }
    }

    get podeExportar(): boolean {
        return (this.selectedEntidade ? this.relatorioData.length : this.logs.length) > 0;
    }

    get contagemLinhas(): number {
        return this.selectedEntidade ? this.relatorioData.length : this.logs.length;
    }

    loadFuncionarios() {
        this.funcionarioService.getFuncionarios(undefined, 0, 1000).subscribe({
            next: (response) => this.funcionarios = response.items || [],
            error: (err) => console.error('Erro ao carregar funcionários', err)
        });
    }

    setPeriod(period: string) {
        this.selectedPeriod = period;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const toIso = (d: Date) => d.toISOString().split('T')[0];

        if (period === 'today') {
            this.startDate = toIso(today);
            this.endDate = toIso(today);
        } else if (period === 'last7') {
            const start = new Date(today);
            start.setDate(start.getDate() - 6);
            this.startDate = toIso(start);
            this.endDate = toIso(today);
        } else if (period === 'last30') {
            const start = new Date(today);
            start.setDate(start.getDate() - 29);
            this.startDate = toIso(start);
            this.endDate = toIso(today);
        } else if (period === 'month') {
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            this.startDate = toIso(firstDay);
            this.endDate = toIso(today);
        }
        // custom: não altera as datas

        if (period !== 'custom') {
            this.loadData();
        }
    }

    onFilterChange() {
        if (this.selectedPeriod === 'custom' && (!this.startDate || !this.endDate)) {
            return;
        }
        this.loadData();
    }

    loadData() {
        this.isLoading = true;

        if (this.selectedEntidade) {
            this.loadRelatorio(this.selectedEntidade);
        } else {
            this.loadLogs();
        }
    }

    formatIsoDateTimeForBackend(dateStr: string, endOfDay = false): string {
        const parts = dateStr.split('-').map(Number);
        let d;
        if (endOfDay) {
            d = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999);
        } else {
            d = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
        }
        const pad = (n: number, len = 2) => String(n).padStart(len, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T` +
            `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }

    loadRelatorio(entidade: string) {
        let startDateTime: string | undefined;
        let endDateTime: string | undefined;

        if (this.startDate) {
            startDateTime = this.formatIsoDateTimeForBackend(this.startDate, false);
        }
        if (this.endDate) {
            endDateTime = this.formatIsoDateTimeForBackend(this.endDate, true);
        }

        this.relatorioService.getRelatorio(entidade, startDateTime, endDateTime, this.selectedFuncionario).subscribe({
            next: (data) => {
                this.relatorioData = data;
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Erro ao carregar relatorio', err);
                this.snackbarService.error('Erro ao carregar relatório. Tente novamente.');
                this.isLoading = false;
            }
        });
    }

    loadLogs() {
        let startDateTime: string | undefined;
        let endDateTime: string | undefined;

        if (this.startDate) {
            startDateTime = this.formatIsoDateTimeForBackend(this.startDate, false);
        }
        if (this.endDate) {
            endDateTime = this.formatIsoDateTimeForBackend(this.endDate, true);
        }

        this.logService.getLogs(
            this.selectedFuncionario || undefined,
            this.selectedEntidade || undefined,
            startDateTime,
            endDateTime
        ).subscribe({
            next: (data) => {
                this.logs = data;
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Erro ao carregar logs', err);
                this.snackbarService.error('Erro ao carregar os registros de auditoria. Tente novamente.');
                this.isLoading = false;
            }
        });
    }

    formatDateTime(dateTimeString: string): string {
        if (!dateTimeString) return '-';
        try {
            const date = new Date(dateTimeString);
            if (isNaN(date.getTime())) return dateTimeString;

            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');

            return `${day}/${month}/${year} ${hours}:${minutes}`;
        } catch {
            return dateTimeString;
        }
    }

    getDateOnly(dateTimeString: string): string {
        if (!dateTimeString) return '-';
        try {
            const date = new Date(dateTimeString);
            if (isNaN(date.getTime())) return dateTimeString;
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        } catch {
            return dateTimeString;
        }
    }

    formatCurrency(value: number): string {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
    }

    private somaCampo(campo: string): number {
        return this.relatorioData.reduce((acc, item) => acc + (Number(item?.[campo]) || 0), 0);
    }

    get resumoOrcamentos() {
        const total = this.somaCampo('total_final');
        const desconto = this.somaCampo('desconto');
        const frete = this.somaCampo('frete');
        const porStatus = this.contarPor('status');
        return {
            quantidade: this.relatorioData.length,
            total,
            desconto,
            frete,
            ticketMedio: this.relatorioData.length ? total / this.relatorioData.length : 0,
            pendentes: porStatus['pendente'] || 0,
            aprovados: porStatus['aprovado'] || 0,
            rejeitados: porStatus['rejeitado'] || 0
        };
    }

    get resumoLocacoes() {
        const total = this.somaCampo('total_final');
        const desconto = this.somaCampo('desconto');
        const frete = this.somaCampo('frete');
        const porStatus = this.contarPor('status');
        return {
            quantidade: this.relatorioData.length,
            total,
            desconto,
            frete,
            ticketMedio: this.relatorioData.length ? total / this.relatorioData.length : 0,
            ativas: porStatus['ativa'] || 0,
            finalizadas: porStatus['finalizada'] || 0,
            canceladas: porStatus['cancelada'] || 0,
            atrasadas: porStatus['atrasada'] || 0
        };
    }

    get resumoClientes() {
        const fisica = this.relatorioData.filter((c) => c.tipo_pessoa === 'fisica').length;
        const juridica = this.relatorioData.filter((c) => c.tipo_pessoa === 'juridica').length;
        return { quantidade: this.relatorioData.length, fisica, juridica };
    }

    get resumoEquipamentos() {
        const estoque = this.somaCampo('estoque');
        const alugado = this.somaCampo('estoque_alugado');
        const valorMensalEstoque = this.relatorioData.reduce(
            (acc, item) => acc + (Number(item.preco_mensal) || 0) * (Number(item.estoque) || 0),
            0
        );
        const valorMensalAlugado = this.relatorioData.reduce(
            (acc, item) => acc + (Number(item.preco_mensal) || 0) * (Number(item.estoque_alugado) || 0),
            0
        );
        return {
            quantidade: this.relatorioData.length,
            estoque,
            alugado,
            livres: estoque - alugado,
            valorMensalEstoque,
            valorMensalAlugado
        };
    }

    get resumoLogs() {
        const porAcao: Record<string, number> = {};
        for (const log of this.logs) {
            const acao = log.acao || 'outros';
            porAcao[acao] = (porAcao[acao] || 0) + 1;
        }
        const topAcoes = Object.entries(porAcao)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4);
        return {
            quantidade: this.logs.length,
            colaboradores: new Set(this.logs.map((l) => l.funcionario_username || 'rloc')).size,
            topAcoes
        };
    }

    private contarPor(campo: string): Record<string, number> {
        const mapa: Record<string, number> = {};
        for (const item of this.relatorioData) {
            const chave = String(item?.[campo] || '').toLowerCase();
            if (!chave) continue;
            mapa[chave] = (mapa[chave] || 0) + 1;
        }
        return mapa;
    }

    getExportName(entidade: string | null): string {
        if (!entidade) return `Relatorio_Atividades_${this.startDate}_${this.endDate}`;
        if (entidade === 'orcamento') return `Relatorio_de_Orcamentos_${this.startDate}_${this.endDate}`;
        if (entidade === 'locacao') return `Relatorio_de_Contratos_${this.startDate}_${this.endDate}`;
        if (entidade === 'cliente') return `Relatorio_de_Clientes_${this.startDate}_${this.endDate}`;
        if (entidade === 'equipamento') return `Relatorio_de_Equipamentos_${this.startDate}_${this.endDate}`;
        return `Relatorio_${entidade}_${this.startDate}_${this.endDate}`;
    }

    getExportSheetName(entidade: string | null): string {
        if (!entidade) return 'Atividades';
        if (entidade === 'orcamento') return 'Orcamentos';
        if (entidade === 'locacao') return 'Contratos';
        if (entidade === 'cliente') return 'Clientes';
        if (entidade === 'equipamento') return 'Equipamentos';
        return 'Relatorio';
    }

    getExportData() {
        if (!this.selectedEntidade) {
            return this.logs.map(log => ({
                'Data/Hora': this.formatDateTime(log.data_hora),
                'Funcionário': log.funcionario_username || 'rloc',
                'Ação': log.acao,
                'Entidade': log.entidade,
                'ID Entidade': log.entidade_id || '',
                'Detalhes': log.detalhes || ''
            }));
        }

        if (this.selectedEntidade === 'orcamento') {
            const rows = this.relatorioData.map(item => ({
                'ID': item.id,
                'Data Criação': this.formatDateTime(item.data_criacao),
                'Cliente': item.cliente?.nome_razao_social || '',
                'Data Início': this.getDateOnly(item.data_inicio),
                'Data Fim': this.getDateOnly(item.data_fim),
                'Total': this.formatCurrency(item.total_final),
                'Desconto': this.formatCurrency(item.desconto),
                'Frete': this.formatCurrency(item.frete),
                'Status': item.status,
                'Funcionário': item.funcionario?.nome || 'Desconhecido'
            }));
            const r = this.resumoOrcamentos;
            rows.push({
                'ID': 'TOTAL',
                'Data Criação': `${r.quantidade} orçamento(s)`,
                'Cliente': `Pend. ${r.pendentes} · Aprov. ${r.aprovados} · Rej. ${r.rejeitados}`,
                'Data Início': '',
                'Data Fim': '',
                'Total': this.formatCurrency(r.total),
                'Desconto': this.formatCurrency(r.desconto),
                'Frete': this.formatCurrency(r.frete),
                'Status': '',
                'Funcionário': `Ticket médio ${this.formatCurrency(r.ticketMedio)}`
            });
            return rows;
        }

        if (this.selectedEntidade === 'locacao') {
            const rows = this.relatorioData.map(item => ({
                'ID': item.id,
                'Data Criação': this.formatDateTime(item.data_criacao),
                'Cliente': item.cliente?.nome_razao_social || '',
                'Data Início': this.getDateOnly(item.data_inicio),
                'Data Fim': this.getDateOnly(item.data_fim),
                'Data Devolução': item.data_devolucao ? this.formatDateTime(item.data_devolucao) : 'Não devolvido',
                'Desconto': this.formatCurrency(item.desconto),
                'Frete': this.formatCurrency(item.frete),
                'Total': this.formatCurrency(item.total_final),
                'Status': item.status,
                'Funcionário': item.funcionario?.nome || 'Desconhecido'
            }));
            const r = this.resumoLocacoes;
            rows.push({
                'ID': 'TOTAL',
                'Data Criação': `${r.quantidade} contrato(s)`,
                'Cliente': `Ativas ${r.ativas} · Final. ${r.finalizadas} · Canc. ${r.canceladas} · Atras. ${r.atrasadas}`,
                'Data Início': '',
                'Data Fim': '',
                'Data Devolução': '',
                'Desconto': this.formatCurrency(r.desconto),
                'Frete': this.formatCurrency(r.frete),
                'Total': this.formatCurrency(r.total),
                'Status': '',
                'Funcionário': `Ticket médio ${this.formatCurrency(r.ticketMedio)}`
            });
            return rows;
        }

        if (this.selectedEntidade === 'cliente') {
            return this.relatorioData.map(item => ({
                'ID': item.id,
                'Nome/Razão Social': item.nome_razao_social,
                'Data Cadastro': this.formatDateTime(item.data_cadastro),
                'Tipo': item.tipo_pessoa,
                'CPF/CNPJ': item.cpf || item.cnpj || '',
                'Telefone': item.telefone_comercial || item.telefone_celular || '',
                'Email': item.email || '',
                'Estado': item.estado || '',
                'Cidade': item.cidade || ''
            }));
        }

        if (this.selectedEntidade === 'equipamento') {
            const rows = this.relatorioData.map(item => ({
                'ID': item.id,
                'Descrição': item.descricao,
                'Preço Diária': this.formatCurrency(item.preco_diaria),
                'Preço Mensal': this.formatCurrency(item.preco_mensal),
                'Estoque Total': item.estoque,
                'Estoque Alugado': item.estoque_alugado,
                'Disponível': item.estoque - item.estoque_alugado
            }));
            const r = this.resumoEquipamentos;
            rows.push({
                'ID': 'TOTAL',
                'Descrição': `${r.quantidade} equipamento(s)`,
                'Preço Diária': '',
                'Preço Mensal': `Potencial ${this.formatCurrency(r.valorMensalEstoque)}`,
                'Estoque Total': r.estoque,
                'Estoque Alugado': r.alugado,
                'Disponível': r.livres
            });
            return rows;
        }

        return [];
    }

    exportToXLSX() {
        const data = this.getExportData();
        if (data.length === 0) return;

        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, this.getExportSheetName(this.selectedEntidade));

        const fileName = `${this.getExportName(this.selectedEntidade)}.xlsx`;
        XLSX.writeFile(wb, fileName);
    }

    exportToCSV() {
        const data = this.getExportData();
        if (data.length === 0) return;

        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
        const csv = XLSX.utils.sheet_to_csv(ws);

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `${this.getExportName(this.selectedEntidade)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
