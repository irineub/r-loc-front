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
    selectedPeriod: string = 'today'; // today, week, month, custom

    isLoading = false;

    constructor(
        private logService: LogService,
        private funcionarioService: FuncionarioService,
        private relatorioService: RelatorioService,
        private snackbarService: SnackbarService
    ) { }

    ngOnInit() {
        this.setPeriod('today');
        this.loadFuncionarios();
        this.loadData();
    }

    loadFuncionarios() {
        this.funcionarioService.getFuncionarios().subscribe({
            next: (data) => this.funcionarios = data,
            error: (err) => console.error('Erro ao carregar funcionários', err)
        });
    }

    setPeriod(period: string) {
        this.selectedPeriod = period;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (period === 'today') {
            this.startDate = today.toISOString().split('T')[0];
            this.endDate = today.toISOString().split('T')[0];
        } else if (period === 'week') {
            const firstDay = new Date(today);
            firstDay.setDate(today.getDate() - today.getDay()); // Sunday
            this.startDate = firstDay.toISOString().split('T')[0];
            this.endDate = today.toISOString().split('T')[0];
        } else if (period === 'month') {
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            this.startDate = firstDay.toISOString().split('T')[0];
            this.endDate = today.toISOString().split('T')[0];
        }
        // custom: doesn't change dates automatically

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
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
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
            return this.relatorioData.map(item => ({
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
        }

        if (this.selectedEntidade === 'locacao') {
            return this.relatorioData.map(item => ({
                'ID': item.id,
                'Data Criação': this.formatDateTime(item.data_criacao),
                'Cliente': item.cliente?.nome_razao_social || '',
                'Data Início': this.getDateOnly(item.data_inicio),
                'Data Fim': this.getDateOnly(item.data_fim),
                'Data Devolução': item.data_devolucao ? this.formatDateTime(item.data_devolucao) : 'Não devolvido',
                'Total': this.formatCurrency(item.total_final),
                'Status': item.status,
                'Funcionário': item.funcionario?.nome || 'Desconhecido'
            }));
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
            return this.relatorioData.map(item => ({
                'ID': item.id,
                'Descrição': item.descricao,
                'Preço Diária': this.formatCurrency(item.preco_diaria),
                'Preço Mensal': this.formatCurrency(item.preco_mensal),
                'Estoque Total': item.estoque,
                'Estoque Alugado': item.estoque_alugado,
                'Disponível': item.estoque - item.estoque_alugado
            }));
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
