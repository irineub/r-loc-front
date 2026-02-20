import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LogService, LogAuditoria } from '../../services/log.service';
import { FuncionarioService, Funcionario } from '../../services/funcionario.service';
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
        private funcionarioService: FuncionarioService
    ) { }

    ngOnInit() {
        this.setPeriod('today');
        this.loadFuncionarios();
        this.loadLogs();
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
            this.loadLogs();
        }
    }

    onFilterChange() {
        if (this.selectedPeriod === 'custom' && (!this.startDate || !this.endDate)) {
            return;
        }
        this.loadLogs();
    }

    loadLogs() {
        this.isLoading = true;

        // Helper: format a Date as a local ISO-8601 string (no TZ suffix)
        // so the backend treats it as naive local time — matching how logs are stored.
        const toLocalISO = (d: Date, endOfDay = false): string => {
            if (endOfDay) {
                d = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
            } else {
                d = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
            }
            const pad = (n: number, len = 2) => String(n).padStart(len, '0');
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T` +
                `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        };

        let startDateTime: string | undefined;
        let endDateTime: string | undefined;

        if (this.startDate) {
            const parts = this.startDate.split('-').map(Number);
            startDateTime = toLocalISO(new Date(parts[0], parts[1] - 1, parts[2]), false);
        }
        if (this.endDate) {
            const parts = this.endDate.split('-').map(Number);
            endDateTime = toLocalISO(new Date(parts[0], parts[1] - 1, parts[2]), true);
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

    exportToXLSX() {
        const data = this.logs.map(log => ({
            'Data/Hora': this.formatDateTime(log.data_hora),
            'Funcionário': log.funcionario_username || 'rloc',
            'Ação': log.acao,
            'Entidade': log.entidade,
            'ID Entidade': log.entidade_id || '',
            'Detalhes': log.detalhes || ''
        }));

        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Relatório');

        const fileName = `relatorio_${this.startDate}_${this.endDate}.xlsx`;
        XLSX.writeFile(wb, fileName);
    }

    exportToCSV() {
        const data = this.logs.map(log => ({
            'Data/Hora': this.formatDateTime(log.data_hora),
            'Funcionario': log.funcionario_username || 'rloc',
            'Acao': log.acao,
            'Entidade': log.entidade,
            'ID Entidade': log.entidade_id || '',
            'Detalhes': log.detalhes || ''
        }));

        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
        const csv = XLSX.utils.sheet_to_csv(ws);

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `relatorio_${this.startDate}_${this.endDate}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
