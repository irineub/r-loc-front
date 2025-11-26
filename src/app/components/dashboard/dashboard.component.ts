import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrencyBrPipe } from '../../pipes/currency-br.pipe';
import { Router } from '@angular/router';
import { ClienteService } from '../../services/cliente.service';
import { EquipamentoService } from '../../services/equipamento.service';
import { OrcamentoService } from '../../services/orcamento.service';
import { LocacaoService } from '../../services/locacao.service';
import { NavigationService } from '../../services/navigation.service';
import { Cliente, Equipamento, Orcamento, Locacao } from '../../models/index';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyBrPipe],
  template: `
    <div class="dashboard">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Dashboard - Visão Geral</h2>
        </div>
        
        <!-- Statistics Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-content">
              <h3>{{ clientes.length }}</h3>
              <p>Clientes Cadastrados</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">🔧</div>
            <div class="stat-content">
              <h3>{{ equipamentos.length }}</h3>
              <p>Equipamentos</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">📋</div>
            <div class="stat-content">
              <h3>{{ orcamentos.length }}</h3>
              <p>Orçamentos</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">📦</div>
            <div class="stat-content">
              <h3>{{ locacoesAtivas.length }}</h3>
              <p>Locações Ativas</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Atividade Recente</h2>
        </div>
        
        <div class="activity-section">
          <h3>Orçamentos Pendentes</h3>
          <div class="activity-list" *ngIf="orcamentosPendentes.length > 0; else noPendentes">
            <div class="activity-item" *ngFor="let orcamento of orcamentosPendentes" (click)="viewOrcamento(orcamento)" style="cursor: pointer;">
              <div class="activity-icon">📋</div>
              <div class="activity-content">
                <p><strong>Orçamento #{{ orcamento.id }}</strong> - {{ orcamento.cliente.nome_razao_social || 'Cliente não encontrado' }}</p>
                <small>{{ orcamento.data_criacao | date:'dd/MM/yyyy' }}</small>
              </div>
              <span class="badge badge-pendente">{{ orcamento.status }}</span>
            </div>
          </div>
          <ng-template #noPendentes>
            <p class="no-data">Nenhum orçamento pendente</p>
          </ng-template>
        </div>

        <div class="activity-section">
          <h3>Locações Ativas</h3>
          <div class="activity-list" *ngIf="locacoesAtivas.length > 0; else noLocacoes">
            <div class="activity-item" *ngFor="let locacao of locacoesAtivas">
              <div class="activity-icon">📦</div>
              <div class="activity-content" (click)="viewLocacao(locacao)" style="cursor:pointer; flex: 1;">
                <p><strong>Locação #{{ locacao.id }}</strong> - {{ locacao.cliente.nome_razao_social || 'Cliente não encontrado' }}</p>
                <small>Até {{ locacao.data_fim | date:'dd/MM/yyyy' }}</small>
              </div>
              <div class="activity-actions">
                <span class="badge badge-ativa">{{ locacao.status }}</span>
                <button class="btn btn-recebimento" (click)="abrirRecebimento(locacao.id)" title="Receber Equipamentos">
                  📦 Receber
                </button>
              </div>
            </div>
          </div>
          <ng-template #noLocacoes>
            <p class="no-data">Nenhuma locação ativa</p>
          </ng-template>
        </div>
      </div>

      <!-- Relatórios -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">📊 Relatórios</h2>
        </div>
        
        <div class="reports-grid">
          <div class="report-section">
            <h3>🔧 Produtos Mais Locados</h3>
            <div class="report-list" *ngIf="topEquipamentos.length > 0; else noEquipamentos">
              <div class="report-item" *ngFor="let equipamento of topEquipamentos; let i = index">
                <div class="report-rank">#{{ i + 1 }}</div>
                <div class="report-content">
                  <strong>{{ equipamento.descricao }}</strong>
                  <small>{{ equipamento.totalLocacoes }} locações • {{ equipamento.totalDias }} dias</small>
                </div>
              </div>
            </div>
            <ng-template #noEquipamentos>
              <p class="no-data">Nenhum equipamento locado ainda</p>
            </ng-template>
          </div>

          <div class="report-section">
            <h3>👥 Clientes Mais Ativos</h3>
            <div class="report-list" *ngIf="topClientes.length > 0; else noClientes">
              <div class="report-item" *ngFor="let cliente of topClientes; let i = index">
                <div class="report-rank">#{{ i + 1 }}</div>
                <div class="report-content">
                  <strong>{{ cliente.nome }}</strong>
                  <small>{{ cliente.totalLocacoes }} locações • {{ cliente.totalValor | currencyBr }}</small>
                </div>
              </div>
            </div>
            <ng-template #noClientes>
              <p class="no-data">Nenhum cliente ativo ainda</p>
            </ng-template>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Visualização de Orçamento -->
    <div class="modal-overlay" *ngIf="showViewModal" (click)="closeViewModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>📋 Orçamento #{{ selectedOrcamento?.id }}</h3>
          <button class="modal-close" (click)="closeViewModal()">×</button>
        </div>
        
        <div class="modal-body" id="orcamento-pdf-content">
          <div class="pdf-header">
            <div class="company-info">
              <img src="/logo-r-loc.jpg" alt="R-Loc" class="company-logo">
              <p>Sistema de Locação de Equipamentos</p>
            </div>
            <div class="document-info">
              <h3>ORÇAMENTO #{{ selectedOrcamento?.id }}</h3>
              <p>Data: {{ selectedOrcamento?.data_criacao | date:'dd/MM/yyyy' }}</p>
            </div>
          </div>

          <div class="orcamento-info">
            <div class="info-row">
              <strong>Cliente:</strong> {{ selectedOrcamento?.cliente?.nome_razao_social }}
            </div>
            <div class="info-row">
              <strong>Data Início:</strong> {{ selectedOrcamento?.data_inicio | date:'dd/MM/yyyy' }}
            </div>
            <div class="info-row">
              <strong>Data Fim:</strong> {{ selectedOrcamento?.data_fim | date:'dd/MM/yyyy' }}
            </div>
            <div class="info-row">
              <strong>Status:</strong> 
              <span class="badge" [class]="'badge-' + selectedOrcamento?.status">
                {{ selectedOrcamento?.status }}
              </span>
            </div>
            <div class="info-row" *ngIf="selectedOrcamento?.observacoes">
              <strong>Observações:</strong> {{ selectedOrcamento?.observacoes }}
            </div>
          </div>

          <div class="itens-section">
            <h4>📦 Itens do Orçamento</h4>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Equipamento</th>
                  <th>Quantidade</th>
                  <th>Dias</th>
                  <th>Tipo Cobrança</th>
                  <th>Preço Unitário</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of selectedOrcamento?.itens">
                  <td>{{ getEquipamentoDescricao(item.equipamento_id) }}</td>
                  <td>{{ item.quantidade }}</td>
                  <td>{{ item.dias }}</td>
                  <td>{{ item.tipo_cobranca === 'mensal' ? 'Mensal' : 'Diária' }}</td>
                  <td>{{ item.preco_unitario | currencyBr }}</td>
                  <td>{{ item.subtotal | currencyBr }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="totals-section">
            <div class="total-row">
              <strong>Subtotal:</strong> {{ getOrcamentoSubtotal(selectedOrcamento) | currencyBr }}
            </div>
            <div class="total-row">
              <strong>Desconto:</strong> {{ selectedOrcamento?.desconto | currencyBr }}
            </div>
            <div class="total-row">
              <strong>Frete:</strong> {{ selectedOrcamento?.frete | currencyBr }}
            </div>
            <div class="total-row final-total">
              <strong>Total Final:</strong> {{ selectedOrcamento?.total_final | currencyBr }}
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

    <!-- Modal de Visualização de Locação -->
    <div class="modal-overlay" *ngIf="showLocacaoModal" (click)="closeLocacaoModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>📦 Locação #{{ selectedLocacao?.id }}</h3>
          <button class="modal-close" (click)="closeLocacaoModal()">×</button>
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
          <button class="btn btn-secondary" (click)="closeLocacaoModal()">
            Fechar
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-top: 1rem;
    }

    .stat-card {
      background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
      color: white;
      padding: 1.5rem;
      border-radius: 16px;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 8px 32px rgba(220, 53, 69, 0.2);
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
      animation: shimmer 3s infinite;
    }

    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 40px rgba(220, 53, 69, 0.3);
    }

    .stat-icon {
      font-size: 2rem;
      background: rgba(255, 255, 255, 0.2);
      padding: 1rem;
      border-radius: 50%;
      position: relative;
      z-index: 1;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .stat-content {
      position: relative;
      z-index: 1;
    }

    .stat-content h3 {
      margin: 0;
      font-size: 2.5rem;
      font-weight: 700;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .stat-content p {
      margin: 0;
      opacity: 0.95;
      font-size: 0.9rem;
      font-weight: 500;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }

    .activity-section {
      margin-bottom: 2rem;
    }

    .activity-section h3 {
      color: #dc3545;
      margin-bottom: 1rem;
      font-size: 1.2rem;
      font-weight: 600;
    }

    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .activity-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-radius: 12px;
      border-left: 4px solid #dc3545;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(220, 53, 69, 0.1);
    }

    .activity-item:hover {
      transform: translateX(4px);
      box-shadow: 0 4px 16px rgba(220, 53, 69, 0.15);
      background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
    }

    .activity-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .btn-recebimento {
      background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
      color: white;
      border: 2px solid transparent;
      padding: 0.5rem 1rem;
      font-size: 0.8rem;
      min-width: auto;
    }

    .btn-recebimento:hover {
      background: linear-gradient(135deg, #138496 0%, #117a8b 100%);
      border-color: rgba(255, 255, 255, 0.3);
    }

    .activity-icon {
      font-size: 1.5rem;
      background: rgba(220, 53, 69, 0.1);
      padding: 0.5rem;
      border-radius: 8px;
    }

    .activity-content {
      flex: 1;
    }

    .activity-content p {
      margin: 0;
      font-weight: 600;
      color: #374151;
    }

    .activity-content small {
      color: #6b7280;
      font-weight: 500;
    }

    .no-data {
      color: #6b7280;
      font-style: italic;
      text-align: center;
      padding: 2rem;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-radius: 12px;
      border: 2px dashed rgba(220, 53, 69, 0.2);
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }
      
      .activity-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
      
      .stat-content h3 {
        font-size: 2rem;
      }
      
      .modal-content {
        width: 95vw;
        max-height: 95vh;
        margin: 1rem;
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
      width: 800px;
      position: relative;
      animation: modalSlideIn 0.3s ease-out;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-height: 0;
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
      flex-shrink: 0;
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
      overflow-y: auto;
      flex-grow: 1;
      min-height: 0;
      -webkit-overflow-scrolling: touch;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1.5rem 2rem;
      border-top: 2px solid #f3f4f6;
      background: linear-gradient(135deg, #f8fafc, #f1f5f9);
      border-radius: 0 0 20px 20px;
      flex-shrink: 0;
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

    .orcamento-info {
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

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-secondary {
      background: linear-gradient(135deg, #6b7280, #4b5563);
      color: white;
    }

    .btn-secondary:hover {
      background: linear-gradient(135deg, #4b5563, #374151);
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
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

    .badge-pendente {
      background: linear-gradient(135deg, #fbbf24, #f59e0b);
      color: white;
    }

    .badge-aprovado {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
    }

    .badge-rejeitado {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
    }

    /* Reports Styles */
    .reports-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-top: 1rem;
    }

    .report-section {
      background: #f9fafb;
      padding: 1.5rem;
      border-radius: 10px;
      box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.05);
      border: 1px solid #e5e7eb;
    }

    .report-section h3 {
      color: #dc3545;
      margin-bottom: 1rem;
      font-size: 1.2rem;
      font-weight: 600;
    }

    .report-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .report-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1rem;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-radius: 12px;
      border-left: 4px solid #dc3545;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(220, 53, 69, 0.1);
    }

    .report-item:hover {
      transform: translateX(4px);
      box-shadow: 0 4px 16px rgba(220, 53, 69, 0.15);
      background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
    }

    .report-rank {
      font-size: 1.2rem;
      font-weight: 700;
      color: #dc3545;
      min-width: 30px;
      text-align: center;
    }

    .report-content strong {
      font-size: 1rem;
      font-weight: 600;
      color: #374151;
    }

    .report-content small {
      font-size: 0.8rem;
      color: #6b7280;
    }
  `]
})
export class DashboardComponent implements OnInit {
  clientes: Cliente[] = [];
  equipamentos: Equipamento[] = [];
  orcamentos: Orcamento[] = [];
  locacoes: Locacao[] = [];
  orcamentosPendentes: Orcamento[] = [];
  locacoesAtivas: Locacao[] = [];
  selectedOrcamento: Orcamento | null = null;
  showViewModal = false;
  topEquipamentos: any[] = [];
  topClientes: any[] = [];
  selectedLocacao: Locacao | null = null;
  showLocacaoModal = false;

  private router = inject(Router);

  constructor(
    private clienteService: ClienteService,
    private equipamentoService: EquipamentoService,
    private orcamentoService: OrcamentoService,
    private locacaoService: LocacaoService,
    private navigationService: NavigationService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    // Load all data for dashboard
    this.clienteService.getClientes().subscribe(data => {
      this.clientes = data;
    });

    this.equipamentoService.getEquipamentos().subscribe(data => {
      this.equipamentos = data;
    });

    this.orcamentoService.getOrcamentos().subscribe(data => {
      this.orcamentos = data;
      this.orcamentosPendentes = data.filter(o => o.status === 'pendente');
    });

    this.locacaoService.getLocacoes().subscribe(data => {
      this.locacoes = data;
      this.locacoesAtivas = data.filter(l => l.status === 'ativa');
      this.calculateReports();
    });
  }

  calculateReports() {
    // Calcular produtos mais locados
    const equipamentoStats = new Map<number, { descricao: string, totalLocacoes: number, totalDias: number }>();
    
    this.locacoes.forEach(locacao => {
      locacao.itens?.forEach(item => {
        const equipamento = this.equipamentos.find(e => e.id === item.equipamento_id);
        if (equipamento) {
          const current = equipamentoStats.get(equipamento.id) || {
            descricao: equipamento.descricao,
            totalLocacoes: 0,
            totalDias: 0
          };
          
          current.totalLocacoes += item.quantidade;
          current.totalDias += item.dias;
          equipamentoStats.set(equipamento.id, current);
        }
      });
    });

    this.topEquipamentos = Array.from(equipamentoStats.values())
      .sort((a, b) => b.totalLocacoes - a.totalLocacoes)
      .slice(0, 5);

    // Calcular clientes mais ativos
    const clienteStats = new Map<number, { nome: string, totalLocacoes: number, totalValor: number }>();
    
    this.locacoes.forEach(locacao => {
      const cliente = this.clientes.find(c => c.id === locacao.cliente_id);
      if (cliente) {
        const current = clienteStats.get(cliente.id) || {
          nome: cliente.nome_razao_social,
          totalLocacoes: 0,
          totalValor: 0
        };
        
        current.totalLocacoes += 1;
        current.totalValor += locacao.total_final || 0;
        clienteStats.set(cliente.id, current);
      }
    });

    this.topClientes = Array.from(clienteStats.values())
      .sort((a, b) => b.totalValor - a.totalValor)
      .slice(0, 5);
  }

  viewOrcamento(orcamento: Orcamento) {
    this.selectedOrcamento = orcamento;
    this.showViewModal = true;
  }

  closeViewModal() {
    this.showViewModal = false;
    this.selectedOrcamento = null;
  }

  abrirRecebimento(locacaoId: number) {
    this.router.navigate(['/recebimento', locacaoId]);
  }

  getOrcamentoSubtotal(orcamento: Orcamento | null): number {
    if (!orcamento || !orcamento.itens) return 0;
    return orcamento.itens.reduce((total, item) => total + item.subtotal, 0);
  }

  getEquipamentoDescricao(equipamentoId: number): string {
    if (!this.selectedOrcamento?.itens) return 'Equipamento não encontrado';
    const item = this.selectedOrcamento.itens.find(i => i.equipamento_id === equipamentoId);
    return item?.equipamento?.descricao || 'Equipamento não encontrado';
  }

  viewLocacao(locacao: Locacao) {
    this.selectedLocacao = locacao;
    this.showLocacaoModal = true;
  }
  closeLocacaoModal() {
    this.selectedLocacao = null;
    this.showLocacaoModal = false;
  }
} 