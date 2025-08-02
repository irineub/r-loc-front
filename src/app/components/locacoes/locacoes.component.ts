import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocacaoService } from '../../services/locacao.service';
import { OrcamentoService } from '../../services/orcamento.service';
import { Locacao, Orcamento } from '../../models/index';

@Component({
  selector: 'app-locacoes',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="locacoes">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Gestão de Locações</h2>
          <button class="btn btn-primary" (click)="showOrcamentosAprovados = true" *ngIf="!showOrcamentosAprovados">
            <span>📦</span> Criar Locação
          </button>
        </div>

        <!-- Orçamentos Aprovados for Creating Locação -->
        <div class="form-section" *ngIf="showOrcamentosAprovados">
          <h3>Criar Locação a partir de Orçamento Aprovado</h3>
          <div class="table-section">
            <table class="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Período</th>
                  <th>Total</th>
                  <th>Data Aprovação</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let orcamento of orcamentosAprovados">
                  <td data-label="ID">{{ orcamento.id }}</td>
                  <td data-label="Cliente">{{ orcamento.cliente.nome_razao_social || 'Cliente não encontrado' }}</td>
                  <td data-label="Período">{{ orcamento.data_inicio | date:'dd/MM/yyyy' }} - {{ orcamento.data_fim | date:'dd/MM/yyyy' }}</td>
                  <td data-label="Total">R$ {{ orcamento.total_final | number:'1.2-2' }}</td>
                  <td data-label="Data Aprovação">{{ orcamento.data_criacao | date:'dd/MM/yyyy' }}</td>
                  <td data-label="Ações">
                    <button class="btn btn-success btn-sm" (click)="createLocacao(orcamento.id)">
                      📦 Criar Locação
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" (click)="showOrcamentosAprovados = false">
                Cancelar
              </button>
            </div>
          </div>
        </div>

        <!-- Locações List -->
        <div class="table-section" *ngIf="!showOrcamentosAprovados">
          <div class="filters">
            <button class="btn btn-secondary" (click)="filterStatus = ''" [class.active]="filterStatus === ''">
              Todas
            </button>
            <button class="btn btn-secondary" (click)="filterStatus = 'ativa'" [class.active]="filterStatus === 'ativa'">
              Ativas
            </button>
            <button class="btn btn-secondary" (click)="filterStatus = 'finalizada'" [class.active]="filterStatus === 'finalizada'">
              Finalizadas
            </button>
            <button class="btn btn-secondary" (click)="filterStatus = 'atrasada'" [class.active]="filterStatus === 'atrasada'">
              Atrasadas
            </button>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Período</th>
                <th>Total</th>
                <th>Status</th>
                <th>Data Devolução</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let locacao of filteredLocacoes">
                <td data-label="ID">{{ locacao.id }}</td>
                <td data-label="Cliente">{{ locacao.cliente.nome_razao_social || 'Cliente não encontrado' }}</td>
                <td data-label="Período">{{ locacao.data_inicio | date:'dd/MM/yyyy' }} - {{ locacao.data_fim | date:'dd/MM/yyyy' }}</td>
                <td data-label="Total">R$ {{ locacao.total_final | number:'1.2-2' }}</td>
                <td data-label="Status">
                  <span class="badge" [class]="'badge-' + locacao.status">
                    {{ locacao.status }}
                  </span>
                </td>
                <td data-label="Data Devolução">{{ locacao.data_devolucao ? (locacao.data_devolucao | date:'dd/MM/yyyy') : '-' }}</td>
                <td data-label="Ações">
                  <div class="action-buttons">
                    <button class="action-btn approve" (click)="finalizarLocacao(locacao.id)" 
                            *ngIf="locacao.status === 'ativa'" title="Finalizar Locação">
                      ✅ Finalizar
                    </button>
                    <button class="action-btn reject" (click)="cancelarLocacao(locacao.id)" 
                            *ngIf="locacao.status === 'ativa'" title="Cancelar Locação">
                      ❌ Cancelar
                    </button>
                    <button class="action-btn view" (click)="viewLocacao(locacao)" title="Visualizar Detalhes">
                      👁️ Ver
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal de Visualização de Locação -->
    <div class="modal-overlay" *ngIf="showViewModal" (click)="closeViewModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>📋 Locação #{{ selectedLocacao?.id }}</h3>
          <button class="modal-close" (click)="closeViewModal()">×</button>
        </div>
        
        <div class="modal-body" id="locacao-pdf-content">
          <div class="pdf-header">
            <div class="company-info">
              <img src="/logo-r-loc.jpg" alt="R-Loc" class="company-logo">
              <p>Sistema de Locação de Equipamentos</p>
            </div>
            <div class="document-info">
              <h3>LOCAÇÃO #{{ selectedLocacao?.id }}</h3>
              <p>Data: {{ selectedLocacao?.data_criacao | date:'dd/MM/yyyy' }}</p>
            </div>
          </div>

          <div class="locacao-info">
            <div class="info-row">
              <strong>Cliente:</strong> {{ selectedLocacao?.cliente?.nome_razao_social }}
            </div>
            <div class="info-row">
              <strong>Data Início:</strong> {{ selectedLocacao?.data_inicio | date:'dd/MM/yyyy' }}
            </div>
            <div class="info-row">
              <strong>Data Fim:</strong> {{ selectedLocacao?.data_fim | date:'dd/MM/yyyy' }}
            </div>
            <div class="info-row">
              <strong>Data Devolução:</strong> {{ selectedLocacao?.data_devolucao ? (selectedLocacao?.data_devolucao | date:'dd/MM/yyyy') : 'Não devolvido' }}
            </div>
            <div class="info-row">
              <strong>Status:</strong> 
              <span class="badge" [class]="'badge-' + selectedLocacao?.status">
                {{ selectedLocacao?.status }}
              </span>
            </div>
            <div class="info-row" *ngIf="selectedLocacao?.observacoes">
              <strong>Observações:</strong> {{ selectedLocacao?.observacoes }}
            </div>
          </div>

          <div class="itens-section">
            <h4>📦 Itens da Locação</h4>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Equipamento</th>
                  <th>Quantidade</th>
                  <th>Dias</th>
                  <th>Preço Unitário</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of selectedLocacao?.itens">
                  <td>{{ getEquipamentoDescricao(item.equipamento_id) }}</td>
                  <td>{{ item.quantidade }}</td>
                  <td>{{ item.dias }}</td>
                  <td>R$ {{ item.preco_unitario | number:'1.2-2' }}</td>
                  <td>R$ {{ item.subtotal | number:'1.2-2' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="totals-section">
            <div class="total-row final-total">
              <strong>Total Final:</strong> R$ {{ selectedLocacao?.total_final | number:'1.2-2' }}
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeViewModal()">
            Fechar
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .locacoes {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .form-section {
      background: #f9fafb;
      padding: 1.5rem;
      border-radius: 8px;
      margin-top: 1rem;
    }

    .form-section h3 {
      margin-top: 0;
      margin-bottom: 1.5rem;
      color: #374151;
    }

    .filters {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }

    .filters .btn {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
    }

    .filters .btn.active {
      background: #667eea;
      color: white;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      margin-top: 1.5rem;
    }

    .btn-sm {
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
    }

    .table-section {
      background: white;
      border-radius: 20px;
      box-shadow: 0 8px 32px rgba(220, 38, 38, 0.1);
      border: 1px solid rgba(220, 38, 38, 0.1);
      overflow: hidden;
      margin-top: 1.5rem;
      position: relative;
      padding: 0;
    }

    .table-section::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(135deg, #dc2626, #ef4444);
      z-index: 1;
    }

    .table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      margin: 0;
    }

    .table thead {
      background: linear-gradient(135deg, #f8fafc, #f1f5f9);
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .table thead th {
      padding: 1.25rem 1rem;
      font-weight: 700;
      font-size: 0.875rem;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #374151;
      border-bottom: 2px solid #e5e7eb;
      text-align: left;
      position: relative;
      white-space: nowrap;
    }

    .table thead th:first-child {
      border-top-left-radius: 20px;
    }

    .table thead th:last-child {
      border-top-right-radius: 20px;
    }

    .table thead th::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(135deg, #dc2626, #ef4444);
      opacity: 0.3;
    }

    .table tbody tr {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border-bottom: 1px solid #f3f4f6;
    }

    .table tbody tr:hover {
      background: linear-gradient(135deg, #fef2f2, #fecaca);
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(220, 38, 38, 0.15);
      border-radius: 12px;
      margin: 4px 8px;
    }

    .table tbody tr:nth-child(even) {
      background: linear-gradient(135deg, #fafafa, #f5f5f5);
    }

    .table tbody tr:last-child {
      border-bottom: none;
    }

    .table tbody td {
      padding: 1.25rem 1rem;
      font-size: 0.875rem;
      color: #374151;
      border-bottom: 1px solid #f3f4f6;
      vertical-align: middle;
      position: relative;
      word-wrap: break-word;
      max-width: 200px;
    }

    .table tbody td:first-child {
      font-weight: 600;
      color: #dc2626;
      min-width: 60px;
    }

    .badge {
      font-weight: 700;
      padding: 0.5rem 1rem;
      border-radius: 25px;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      border: 2px solid transparent;
      transition: all 0.3s ease;
      display: inline-block;
    }

    .badge-ativa {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      border-color: #059669;
    }

    .badge-finalizada {
      background: linear-gradient(135deg, #6b7280, #4b5563);
      color: white;
      border-color: #4b5563;
    }

    .badge-cancelada {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
      border-color: #dc2626;
    }

    .badge-atrasada {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white;
      border-color: #d97706;
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      align-items: center;
    }

    .action-btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      white-space: nowrap;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      border: 2px solid transparent;
      min-width: 80px;
      justify-content: center;
    }

    .action-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    }

    .action-btn.approve {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      border-color: #059669;
    }

    .action-btn.approve:hover {
      background: linear-gradient(135deg, #059669, #047857);
    }

    .action-btn.reject {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
      border-color: #dc2626;
    }

    .action-btn.reject:hover {
      background: linear-gradient(135deg, #dc2626, #b91c1c);
    }

    .action-btn.view {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white;
      border-color: #d97706;
    }

    .action-btn.view:hover {
      background: linear-gradient(135deg, #d97706, #b45309);
    }

    .btn-success {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      border: 2px solid #059669;
      padding: 0.5rem 1rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .btn-success:hover {
      background: linear-gradient(135deg, #059669, #047857);
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    }

    @media (max-width: 768px) {
      .filters {
        flex-direction: column;
      }
      
      .form-actions {
        flex-direction: column;
      }
      
      .table {
        font-size: 0.875rem;
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
      }
      
      .table tbody td:before {
        content: attr(data-label) ": ";
        font-weight: 700;
        color: #dc2626;
        margin-right: 0.5rem;
      }
      
      .table tbody td:first-child {
        font-size: 1rem;
        font-weight: 700;
        color: #dc2626;
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 0.75rem;
        margin-bottom: 0.75rem;
      }
      
      .action-buttons {
        flex-direction: row;
        justify-content: flex-start;
        margin-top: 1rem;
      }
      
      .action-btn {
        width: auto;
        padding: 0.5rem 1rem;
      }
    }

    @media (max-width: 480px) {
      .action-buttons {
        flex-direction: column;
        width: 100%;
      }
      
      .action-btn {
        width: 100%;
        justify-content: center;
      }
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
    }

    .modal-content {
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 90vw;
      max-height: 90vh;
      position: relative;
      animation: modalSlideIn 0.3s ease-out;
    }

    @keyframes modalSlideIn {
      from {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
      border-bottom: 2px solid #f3f4f6;
      background: linear-gradient(135deg, #f8fafc, #f1f5f9);
      border-radius: 20px 20px 0 0;
    }

    .modal-header h3 {
      margin: 0;
      color: #374151;
      font-size: 1.5rem;
      font-weight: 700;
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 2rem;
      color: #6b7280;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 50%;
      transition: all 0.3s ease;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal-close:hover {
      background: #f3f4f6;
      color: #dc2626;
      transform: scale(1.1);
    }

    .modal-body {
      padding: 2rem;
      max-height: calc(90vh - 140px);
      overflow-y: auto;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1.5rem 2rem;
      border-top: 2px solid #f3f4f6;
      background: linear-gradient(135deg, #f8fafc, #f1f5f9);
      border-radius: 0 0 20px 20px;
    }

    .pdf-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .company-info .logo {
      font-size: 3rem;
      margin-bottom: 0.5rem;
      display: block;
    }

    .company-info .company-logo {
      width: 80px;
      height: 80px;
      object-fit: contain;
      margin-bottom: 0.5rem;
      display: block;
    }

    .company-info p {
      margin: 0.5rem 0 0;
      font-size: 0.9rem;
      color: #6b7280;
    }

    .document-info h3 {
      margin: 0;
      font-size: 1.2rem;
      color: #374151;
      font-weight: 600;
    }

    .document-info p {
      margin: 0.25rem 0 0;
      font-size: 0.8rem;
      color: #6b7280;
    }

    .locacao-info {
      background: #f9fafb;
      padding: 1.5rem;
      border-radius: 10px;
      box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.05);
      border: 1px solid #e5e7eb;
      margin-bottom: 1.5rem;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
      padding: 0.5rem 0;
      border-bottom: 1px solid #f3f4f6;
    }

    .info-row:last-child {
      border-bottom: none;
      margin-bottom: 0;
    }

    .info-row strong {
      font-weight: 600;
      color: #374151;
      min-width: 120px;
    }

    .itens-section {
      background: #f9fafb;
      padding: 1.5rem;
      border-radius: 10px;
      box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.05);
      border: 1px solid #e5e7eb;
      margin-bottom: 1.5rem;
    }

    .itens-section h4 {
      margin-bottom: 1rem;
      color: #374151;
      font-size: 1.25rem;
      font-weight: 700;
      border-bottom: 2px solid #dc2626;
      padding-bottom: 0.5rem;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
      color: #374151;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .items-table th {
      padding: 1rem;
      font-weight: 700;
      text-align: left;
      background: #dc2626;
      color: white;
    }

    .items-table td {
      padding: 1rem;
      border-bottom: 1px solid #f3f4f6;
    }

    .items-table tr:last-child td {
      border-bottom: none;
    }

    .totals-section {
      background: #f9fafb;
      padding: 1.5rem;
      border-radius: 10px;
      box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.05);
      border: 1px solid #e5e7eb;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      font-size: 1rem;
    }

    .final-total {
      font-size: 1.25rem;
      font-weight: 700;
      color: #dc2626;
      border-top: 2px solid #dc2626;
      margin-top: 0.5rem;
      padding-top: 1rem;
    }
  `]
})
export class LocacoesComponent implements OnInit {
  locacoes: Locacao[] = [];
  orcamentosAprovados: Orcamento[] = [];
  showOrcamentosAprovados = false;
  filterStatus = '';
  selectedLocacao: Locacao | null = null;
  showViewModal = false;

  constructor(
    private locacaoService: LocacaoService,
    private orcamentoService: OrcamentoService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    // Carregar locações primeiro
    this.locacaoService.getLocacoes().subscribe(locacoes => {
      this.locacoes = locacoes;
      
      // Depois carregar orçamentos aprovados e filtrar
      this.orcamentoService.getOrcamentosAprovados().subscribe(orcamentos => {
        // Filtrar apenas orçamentos aprovados que não têm locação criada
        this.orcamentosAprovados = orcamentos.filter(orcamento => {
          // Verificar se já existe uma locação para este orçamento
          const hasLocacao = this.locacoes.some(locacao => locacao.orcamento_id === orcamento.id);
          return !hasLocacao;
        });
      });
    });
  }

  get filteredLocacoes(): Locacao[] {
    if (!this.filterStatus) {
      return this.locacoes;
    }
    return this.locacoes.filter(locacao => locacao.status === this.filterStatus);
  }

  createLocacao(orcamentoId: number) {
    // Verificar se o orçamento está aprovado
    const orcamento = this.orcamentosAprovados.find(o => o.id === orcamentoId);
    if (!orcamento) {
      alert('Orçamento não encontrado ou não está aprovado.');
      return;
    }

    if (orcamento.status !== 'aprovado') {
      alert('Apenas orçamentos aprovados podem gerar locações. Status atual: ' + orcamento.status);
      return;
    }

    this.locacaoService.createLocacaoFromOrcamento(orcamentoId).subscribe({
      next: () => {
        alert('Locação criada com sucesso!');
        this.loadData(); // Recarregar dados para atualizar listas
        this.showOrcamentosAprovados = false;
      },
      error: (error) => {
        console.error('Erro ao criar locação:', error);
        let errorMessage = 'Erro ao criar locação.';
        
        if (error.status === 422) {
          errorMessage = 'Orçamento não está aprovado ou já possui uma locação.';
        } else if (error.status === 500) {
          errorMessage = 'Erro interno do servidor. Tente novamente.';
        } else if (error.status === 0) {
          errorMessage = 'Erro de conexão. Verifique se o servidor está rodando.';
        }
        
        alert(errorMessage);
      }
    });
  }

  finalizarLocacao(id: number) {
    if (confirm('Tem certeza que deseja finalizar esta locação?')) {
      this.locacaoService.finalizarLocacao(id).subscribe(() => {
        this.loadData();
      });
    }
  }

  cancelarLocacao(id: number) {
    if (confirm('Tem certeza que deseja cancelar esta locação?')) {
      this.locacaoService.cancelarLocacao(id).subscribe(() => {
        this.loadData();
      });
    }
  }

  viewLocacao(locacao: Locacao) {
    this.selectedLocacao = locacao;
    this.showViewModal = true;
  }

  closeViewModal() {
    this.showViewModal = false;
    this.selectedLocacao = null;
  }

  getEquipamentoDescricao(equipamentoId: number): string {
    // Buscar a descrição do equipamento nos itens da locação
    if (this.selectedLocacao?.itens) {
      const item = this.selectedLocacao.itens.find(i => i.equipamento_id === equipamentoId);
      return item?.equipamento?.descricao || 'Equipamento não encontrado';
    }
    return 'Equipamento não encontrado';
  }
} 