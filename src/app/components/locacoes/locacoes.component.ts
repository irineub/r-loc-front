import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrencyBrPipe } from '../../pipes/currency-br.pipe';
import { LocacaoService } from '../../services/locacao.service';
import { EquipamentoService } from '../../services/equipamento.service';
import { PrintableService } from '../../services/printable.service';
import { NavigationService } from '../../services/navigation.service';
import { Locacao, Equipamento } from '../../models/index';

import { Router } from '@angular/router';

@Component({
  selector: 'app-locacoes',
  standalone: true,
  imports: [CommonModule, CurrencyBrPipe],
  template: `
    <div class="locacoes">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">🏢 Gestão de Locações</h2>
        </div>

        <!-- Locações List -->
        <div class="table-section">
          <div class="filters-container">
            <div class="filters">
              <button class="filter-btn" (click)="filterStatus = ''" [class.active]="filterStatus === ''">
                📊 Todas
              </button>
              <button class="filter-btn" (click)="filterStatus = 'ativa'" [class.active]="filterStatus === 'ativa'">
                ✅ Ativas
              </button>
              <button class="filter-btn" (click)="filterStatus = 'finalizada'" [class.active]="filterStatus === 'finalizada'">
                🏁 Finalizadas
              </button>
              <button class="filter-btn" (click)="filterStatus = 'atrasada'" [class.active]="filterStatus === 'atrasada'">
                ⚠️ Atrasadas
              </button>
            </div>
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
                <td data-label="Total">{{ locacao.total_final | currencyBr }}</td>
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
                    <button class="action-btn view" (click)="irParaRecebimento(locacao.id)" 
                            *ngIf="locacao.status === 'ativa'" title="Receber/Devolver Itens">
                      ↩️ Receber
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
                  <td>{{ item.preco_unitario | currencyBr }}</td>
                  <td>{{ item.subtotal | currencyBr }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="totals-section">
            <div class="total-row final-total">
              <strong>Total Final:</strong> {{ selectedLocacao?.total_final | currencyBr }}
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-primary" (click)="exportToReciboPDF()">
            📄 Recibo PDF
          </button>
          <button class="btn btn-warning" (click)="exportToContratoPDF()">
            📜 Contrato PDF
          </button>
          <button class="btn btn-secondary" (click)="closeViewModal()">
            Fechar
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .locacoes {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .card {
      background: white;
      border-radius: 20px;
      box-shadow: 0 12px 48px rgba(220, 53, 69, 0.12);
      overflow: hidden;
      border: 2px solid rgba(220, 53, 69, 0.1);
    }

    .card-header {
      background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
      color: white;
      padding: 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .card-title {
      font-size: 1.8rem;
      font-weight: bold;
      margin: 0;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .filters-container {
      padding: 1.5rem;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-bottom: 2px solid rgba(220, 53, 69, 0.1);
    }

    .filters {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      justify-content: center;
    }

    .filter-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border: 2px solid rgba(220, 53, 69, 0.2);
      border-radius: 12px;
      background: white;
      color: #495057;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 0.9rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .filter-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(220, 53, 69, 0.15);
      border-color: #dc3545;
      color: #dc3545;
    }

    .filter-btn.active {
      background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
      color: white;
      border-color: #dc3545;
      box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
    }

    .table-section {
      padding: 2rem;
    }

    .table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(220, 53, 69, 0.08);
      border: 2px solid rgba(220, 53, 69, 0.1);
    }

    .table th {
      background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
      color: white;
      padding: 1.25rem 1rem;
      text-align: left;
      font-weight: 700;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .table td {
      padding: 1.25rem 1rem;
      border-bottom: 1px solid rgba(220, 53, 69, 0.08);
      vertical-align: middle;
    }

    .table tbody tr:hover {
      background: linear-gradient(135deg, rgba(220, 53, 69, 0.03) 0%, rgba(220, 53, 69, 0.01) 100%);
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      justify-content: flex-start;
    }

    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.625rem 1rem;
      border: none;
      border-radius: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-size: 0.85rem;
      text-decoration: none;
      white-space: nowrap;
      min-width: fit-content;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .action-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
    }

    .action-btn.approve {
      background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
      color: white;
      border: 2px solid transparent;
    }

    .action-btn.approve:hover {
      border-color: rgba(255, 255, 255, 0.3);
    }

    .action-btn.reject {
      background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
      color: white;
      border: 2px solid transparent;
    }

    .action-btn.reject:hover {
      border-color: rgba(255, 255, 255, 0.3);
    }

    .action-btn.view {
      background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%);
      color: #212529;
      border: 2px solid transparent;
    }

    .action-btn.view:hover {
      border-color: rgba(0, 0, 0, 0.1);
    }

    .badge {
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: inline-block;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .badge-ativa {
      background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%);
      color: #0c5460;
    }

    .badge-finalizada {
      background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
      color: #155724;
    }

    .badge-cancelada {
      background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
      color: #721c24;
    }

    .badge-atrasada {
      background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
      color: #721c24;
    }

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
      padding: 2rem;
    }

    .modal-content {
      background: white;
      border-radius: 20px;
      max-width: 800px;
      width: 100%;
      max-height: 90vh;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    .modal-header {
      background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
      color: white;
      padding: 1.5rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-radius: 20px 20px 0 0;
      flex-shrink: 0;
    }

    .modal-close {
      background: none;
      border: none;
      color: white;
      font-size: 2rem;
      cursor: pointer;
      padding: 0;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }

    .modal-close:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .modal-body {
      padding: 2rem;
      overflow-y: auto;
      flex-grow: 1;
      min-height: 0;
      -webkit-overflow-scrolling: touch;
    }

    .modal-footer {
      padding: 1.5rem 2rem;
      border-top: 1px solid #e9ecef;
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      flex-shrink: 0;
      background: #f9fafb;
    }

    /* Botões globais */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 1.75rem;
      border: none;
      border-radius: 16px;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-size: 0.95rem;
      position: relative;
      overflow: hidden;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      min-width: 120px;
      justify-content: center;
    }

    .btn:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 35px rgba(0, 0, 0, 0.2);
    }

    .btn:active {
      transform: translateY(-1px);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
    }

    .btn-primary {
      background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
      color: white;
      border: 2px solid transparent;
    }

    .btn-primary:hover {
      background: linear-gradient(135deg, #c82333 0%, #bd2130 100%);
      border-color: rgba(255, 255, 255, 0.3);
    }

    .btn-secondary {
      background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
      color: white;
      border: 2px solid transparent;
    }

    .btn-secondary:hover {
      background: linear-gradient(135deg, #5a6268 0%, #495057 100%);
      border-color: rgba(255, 255, 255, 0.3);
    }

    .btn-success {
      background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
      color: white;
      border: 2px solid transparent;
    }

    .btn-success:hover {
      background: linear-gradient(135deg, #20c997 0%, #17a2b8 100%);
      border-color: rgba(255, 255, 255, 0.3);
    }

    .btn-danger {
      background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
      color: white;
      border: 2px solid transparent;
    }

    .btn-danger:hover {
      background: linear-gradient(135deg, #c82333 0%, #bd2130 100%);
      border-color: rgba(255, 255, 255, 0.3);
    }

    .btn-warning {
      background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%);
      color: #212529;
      border: 2px solid transparent;
    }

    .btn-warning:hover {
      background: linear-gradient(135deg, #e0a800 0%, #d39e00 100%);
      border-color: rgba(0, 0, 0, 0.1);
    }

    .btn-info {
      background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
      color: white;
      border: 2px solid transparent;
    }

    .btn-info:hover {
      background: linear-gradient(135deg, #138496 0%, #117a8b 100%);
      border-color: rgba(255, 255, 255, 0.3);
    }

    .btn-sm {
      padding: 0.5rem 1rem;
      font-size: 0.8rem;
      border-radius: 8px;
    }

    .btn-lg {
      padding: 1rem 2rem;
      font-size: 1.1rem;
      border-radius: 16px;
    }

    .pdf-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
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
      overflow-x: auto;
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
      min-width: 600px;
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

    /* Responsive Design */
    @media (max-width: 768px) {
      .locacoes {
        padding: 1rem;
      }

      .card-header {
        flex-direction: column;
        text-align: center;
      }

      .filters {
        justify-content: center;
      }

      .filter-btn {
        padding: 0.5rem 1rem;
        font-size: 0.8rem;
      }

      .table {
        font-size: 0.9rem;
      }

      .table th,
      .table td {
        padding: 0.75rem 0.5rem;
      }

      .action-buttons {
        flex-direction: column;
        gap: 0.25rem;
      }

      .action-btn {
        padding: 0.4rem 0.6rem;
        font-size: 0.75rem;
      }

      .modal-content {
        margin: 1rem;
        max-height: 95vh;
        width: 95vw;
      }
      
      .modal-body {
        padding: 1rem;
      }
      
      .items-table {
        font-size: 0.8rem;
        min-width: 500px;
      }
      
      .items-table th,
      .items-table td {
        padding: 0.5rem 0.25rem;
      }
      
      .modal-footer {
        flex-direction: column;
        padding: 1rem;
      }
      
      .modal-footer .btn {
        width: 100%;
      }
      
      .itens-section {
        overflow-x: auto;
      }
    }

    @media (max-width: 480px) {
      .table {
        display: block;
        overflow-x: auto;
      }

      .filters {
        flex-direction: column;
        align-items: center;
      }

      .filter-btn {
        width: 100%;
        max-width: 200px;
      }
    }
  `]
})
export class LocacoesComponent implements OnInit {
  locacoes: Locacao[] = [];
  equipamentos: Equipamento[] = [];
  filterStatus = '';
  selectedLocacao: Locacao | null = null;
  showViewModal = false;

  constructor(
    private locacaoService: LocacaoService,
    private equipamentoService: EquipamentoService,
    private printableService: PrintableService,
    private navigationService: NavigationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadData();
    
    // Verificar se deve abrir modal de locação
    this.navigationService.getNavigationState().subscribe(state => {
      if (state.shouldOpenLocacaoModal && state.locacaoId) {
        // Aguardar um pouco para os dados serem carregados
        setTimeout(() => {
          const locacao = this.locacoes.find(l => l.id === state.locacaoId);
          if (locacao) {
            this.viewLocacao(locacao);
          }
          // Limpar o estado
          this.navigationService.clearNavigationState();
        }, 500);
      }
    });
  }

  loadData() {
    this.locacaoService.getLocacoes().subscribe(locacoes => {
      this.locacoes = locacoes;
    });

    this.equipamentoService.getEquipamentos().subscribe(equipamentos => {
      this.equipamentos = equipamentos;
      this.printableService.setEquipamentos(equipamentos);
    });
  }

  get filteredLocacoes(): Locacao[] {
    if (!this.filterStatus) {
      return this.locacoes;
    }
    return this.locacoes.filter(locacao => locacao.status === this.filterStatus);
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



  // Exportar recibo como PDF
  exportToReciboPDF() {
    if (!this.selectedLocacao) {
      alert('Nenhuma locação selecionada');
      return;
    }

    try {
      const html = this.printableService.generateReciboHTML(this.selectedLocacao);
      const filename = `recibo_${this.selectedLocacao.id}_${new Date().toISOString().split('T')[0]}`;
      this.printableService.exportToPDF(html, filename);
    } catch (error) {
      console.error('Erro ao exportar recibo:', error);
      alert('Erro ao exportar recibo. Tente novamente.');
    }
  }



  // Exportar contrato como PDF
  exportToContratoPDF() {
    if (!this.selectedLocacao) {
      alert('Nenhuma locação selecionada');
      return;
    }

    try {
      const html = this.printableService.generateContratoHTML(this.selectedLocacao);
      const filename = `contrato_${this.selectedLocacao.id}_${new Date().toISOString().split('T')[0]}`;
      this.printableService.exportToPDF(html, filename);
    } catch (error) {
      console.error('Erro ao exportar contrato:', error);
      alert('Erro ao exportar contrato. Tente novamente.');
    }
  }

  irParaRecebimento(locacaoId: number) {
    this.router.navigate([`/recebimento/${locacaoId}`]);
  }
} 