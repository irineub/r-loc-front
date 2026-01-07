import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LogService, LogAuditoria } from '../../services/log.service';
import { FuncionarioService, Funcionario } from '../../services/funcionario.service';

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="logs">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">📋 Logs de Auditoria</h2>
          <div class="filters">
            <select [(ngModel)]="selectedFuncionario" (change)="onFilterChange()" class="form-control">
              <option [ngValue]="null">Todos os funcionários</option>
              <option *ngFor="let func of funcionarios" [ngValue]="func.id">{{ func.nome }} ({{ func.username }})</option>
            </select>
            <select [(ngModel)]="selectedEntidade" (change)="onFilterChange()" class="form-control">
              <option [ngValue]="null">Todas as entidades</option>
              <option value="orcamento">Orçamentos</option>
              <option value="locacao">Locações</option>
              <option value="cliente">Clientes</option>
              <option value="equipamento">Equipamentos</option>
            </select>
          </div>
        </div>

        <div class="table-section">
          <div class="loading" *ngIf="isLoading">Carregando logs...</div>
          <table class="table" *ngIf="!isLoading">
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Funcionário</th>
                <th>Ação</th>
                <th>Entidade</th>
                <th>ID</th>
                <th>Detalhes</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let log of logs">
                <td data-label="Data/Hora">{{ formatDateTime(log.data_hora) }}</td>
                <td data-label="Funcionário">
                  <span class="badge badge-info">{{ log.funcionario_username || 'rloc' }}</span>
                </td>
                <td data-label="Ação">
                  <span class="action-badge" [class]="getActionClass(log.acao)">
                    {{ getActionLabel(log.acao) }}
                  </span>
                </td>
                <td data-label="Entidade">
                  <span class="badge badge-secondary">{{ log.entidade }}</span>
                </td>
                <td data-label="ID">{{ log.entidade_id || '-' }}</td>
                <td data-label="Detalhes">{{ log.detalhes || '-' }}</td>
              </tr>
              <tr *ngIf="logs.length === 0">
                <td colspan="6" class="text-center">Nenhum log encontrado</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .logs {
      padding: 2rem;
    }
    .card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .card-header {
      padding: 1.5rem;
      background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
      color: white;
    }
    .card-title {
      margin: 0 0 1rem 0;
      font-size: 1.5rem;
    }
    .filters {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
    }
    .form-control {
      padding: 0.75rem;
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 6px;
      font-size: 1rem;
      background: rgba(255,255,255,0.1);
      color: white;
    }
    .form-control option {
      background: white;
      color: #333;
    }
    .table-section {
      padding: 1.5rem;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
    }
    .table th {
      background: #f8f9fa;
      padding: 1rem;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #dee2e6;
    }
    .table td {
      padding: 1rem;
      border-bottom: 1px solid #dee2e6;
    }
    .table tbody tr:hover {
      background: #f8f9fa;
    }
    .badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 600;
    }
    .badge-info {
      background: #17a2b8;
      color: white;
    }
    .badge-secondary {
      background: #6c757d;
      color: white;
    }
    .action-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 600;
    }
    .action-create {
      background: #28a745;
      color: white;
    }
    .action-update {
      background: #ffc107;
      color: #333;
    }
    .action-delete {
      background: #dc3545;
      color: white;
    }
    .action-approve {
      background: #17a2b8;
      color: white;
    }
    .action-reject {
      background: #6c757d;
      color: white;
    }
    .action-finalize {
      background: #28a745;
      color: white;
    }
    .action-cancel {
      background: #dc3545;
      color: white;
    }
    .loading {
      padding: 2rem;
      text-align: center;
      color: #6c757d;
    }
    .text-center {
      text-align: center;
    }
    @media (max-width: 768px) {
      .logs {
        padding: 1rem;
      }

      .card-header {
        flex-direction: column;
        text-align: center;
      }

      .filters {
        flex-direction: column;
        gap: 0.75rem;
        width: 100%;
      }

      .form-control {
        font-size: 16px;
        padding: 0.875rem 1rem;
        width: 100%;
        box-sizing: border-box;
      }

      .table-section {
        padding: 1rem;
      }

      .table thead {
        display: none;
      }
      
      .table tbody tr {
        display: block;
        margin-bottom: 1rem;
        padding: 1rem;
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        border: 1px solid #e5e7eb;
      }
      
      .table tbody td {
        display: block;
        padding: 0.5rem 0;
        border: none;
        text-align: left;
        word-wrap: break-word;
      }
      
      .table tbody td:before {
        content: attr(data-label) ": ";
        font-weight: 700;
        color: #dc2626;
        margin-right: 0.5rem;
        display: inline-block;
        min-width: 100px;
      }
      
      .table tbody td:first-child {
        font-size: 1rem;
        font-weight: 700;
        color: #dc2626;
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 0.75rem;
        margin-bottom: 0.75rem;
      }

      .table tbody tr:last-child td {
        text-align: center;
        padding: 1rem;
      }
    }

    @media (max-width: 480px) {
      .logs {
        padding: 0.5rem;
      }

      .card-header {
        padding: 1rem;
      }

      .table-section {
        padding: 0.5rem;
      }

      .table tbody tr {
        padding: 0.75rem;
      }

      .table tbody td:before {
        min-width: 80px;
        font-size: 0.85rem;
      }
    }
  `]
})
export class LogsComponent implements OnInit {
  logs: LogAuditoria[] = [];
  funcionarios: Funcionario[] = [];
  selectedFuncionario: number | null = null;
  selectedEntidade: string | null = null;
  isLoading = false;

  constructor(
    private logService: LogService,
    private funcionarioService: FuncionarioService
  ) {}

  ngOnInit() {
    this.loadFuncionarios();
    this.loadLogs();
  }

  loadFuncionarios() {
    this.funcionarioService.getFuncionarios().subscribe({
      next: (data) => {
        this.funcionarios = data;
      },
      error: (error) => {
        console.error('Erro ao carregar funcionários:', error);
      }
    });
  }

  onFilterChange() {
    this.loadLogs();
  }

  loadLogs() {
    this.isLoading = true;
    const funcionarioId = this.selectedFuncionario !== null ? this.selectedFuncionario : undefined;
    const entidade = this.selectedEntidade !== null ? this.selectedEntidade : undefined;
    
    this.logService.getLogs(funcionarioId, entidade).subscribe({
      next: (data) => {
        this.logs = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar logs:', error);
        this.isLoading = false;
      }
    });
  }

  formatDateTime(dateTimeString: string): string {
    if (!dateTimeString) return '-';
    
    try {
      // Converter a string UTC para Date
      // O JavaScript automaticamente converte para o horário local do navegador
      const date = new Date(dateTimeString);
      
      // Verificar se a data é válida
      if (isNaN(date.getTime())) {
        return dateTimeString;
      }
      
      // Formatar no horário local do computador/navegador
      // Se o computador estiver em Manaus (GMT-4), mostrará horário de Manaus
      // Se estiver em outro fuso, mostrará o horário local
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return dateTimeString;
    }
  }

  getActionLabel(acao: string): string {
    const labels: { [key: string]: string } = {
      'criar_orcamento': 'Criar Orçamento',
      'aprovar_orcamento': 'Aprovar Orçamento',
      'rejeitar_orcamento': 'Rejeitar Orçamento',
      'criar_locacao': 'Criar Locação',
      'finalizar_locacao': 'Finalizar Locação',
      'cancelar_locacao': 'Cancelar Locação',
      'criar_cliente': 'Criar Cliente',
      'atualizar_cliente': 'Atualizar Cliente',
      'deletar_cliente': 'Deletar Cliente',
      'criar_equipamento': 'Criar Equipamento',
      'atualizar_equipamento': 'Atualizar Equipamento',
      'deletar_equipamento': 'Deletar Equipamento'
    };
    return labels[acao] || acao;
  }

  getActionClass(acao: string): string {
    if (acao.includes('criar') || acao.includes('aprovar') || acao.includes('finalizar')) {
      return 'action-create';
    }
    if (acao.includes('atualizar')) {
      return 'action-update';
    }
    if (acao.includes('deletar') || acao.includes('cancelar') || acao.includes('rejeitar')) {
      return 'action-delete';
    }
    return 'action-update';
  }
}

