import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrcamentoService } from '../../services/orcamento.service';
import { ClienteService } from '../../services/cliente.service';
import { EquipamentoService } from '../../services/equipamento.service';
import { LocacaoService } from '../../services/locacao.service';
import { Orcamento, Cliente, Equipamento, OrcamentoCreate, ItemOrcamentoCreate, Locacao } from '../../models/index';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-orcamentos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="orcamentos">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">📋 Gestão de Orçamentos</h2>
          <button class="btn btn-primary" (click)="showForm = true" *ngIf="!showForm">
            <span>➕</span> Novo Orçamento
          </button>
        </div>

        <!-- Form Section -->
        <div class="form-section" *ngIf="showForm">
          <h3>{{ editingOrcamento ? 'Editar' : 'Novo' }} Orçamento</h3>
          <form #form="ngForm" (ngSubmit)="saveOrcamento()">
            <div class="form-row">
              <div class="form-group">
                <label for="cliente_id">Cliente *</label>
                <select id="cliente_id" name="cliente_id" 
                        [(ngModel)]="formData.cliente_id" required
                        class="form-control">
                  <option value="">Selecione um cliente...</option>
                  <option *ngFor="let cliente of clientes" [value]="cliente.id">
                    {{ cliente.nome_razao_social }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label for="observacoes">Observações</label>
                <textarea id="observacoes" name="observacoes" 
                          [(ngModel)]="formData.observacoes"
                          class="form-control" rows="3" 
                          placeholder="Endereço de entrega, observações especiais, condições de pagamento, etc..."></textarea>
               
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
 <label for="data_inicio">📅 Data de Início *</label>
                <input type="date" id="data_inicio" name="data_inicio" 
                       [(ngModel)]="formData.data_inicio" required
                       (ngModelChange)="onDateChange()"
                       class="form-control">
                <small class="form-help">Data em que a locação deve começar</small>
                
              </div>
              <div class="form-group">
                <label for="data_fim">📅 Data de Fim *</label>
                <input type="date" id="data_fim" name="data_fim" 
                       [(ngModel)]="formData.data_fim" required
                       (ngModelChange)="onDateChange()"
                       class="form-control">
                <small class="form-help">Data em que a locação deve terminar</small>
              
              </div>
            </div>
            
            <div class="form-row" *ngIf="periodoCalculado">
              <div class="form-group">
                <label>📊 Período Calculado</label>
                <div class="periodo-info">
                  <span class="periodo-dias">{{ periodoCalculado.dias }} dias</span>
                  <span class="periodo-tipo">({{ periodoCalculado.tipoCobranca }})</span>
                </div>
                <small class="form-help">Este período será aplicado automaticamente aos itens</small>
              </div>
            </div>

            <!-- Items Section -->
            <div class="items-section">
              <h4>📦 Itens do Orçamento</h4>
              
              <div class="item-form">
                <div class="form-row">
                  <div class="form-group">
                    <label for="equipamento_id">Equipamento *</label>
                    <select id="equipamento_id" name="equipamento_id" 
                            [ngModel]="newItem.equipamento_id" (ngModelChange)="newItem.equipamento_id = convertToNumber($event)" required
                            class="form-control">
                      <option value="">Selecione um equipamento...</option>
                      <option *ngFor="let equipamento of equipamentos" [value]="equipamento.id"
                              [disabled]="equipamento.estoque_disponivel === 0">
                        {{ equipamento.descricao }} 
                        ({{ equipamento.estoque_disponivel }} disponível)
                        {{ equipamento.estoque_disponivel === 0 ? ' - SEM ESTOQUE' : '' }}
                      </option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="quantidade">Quantidade *</label>
                    <input type="number" id="quantidade" name="quantidade" 
                           [(ngModel)]="newItem.quantidade" required min="1"
                           class="form-control" placeholder="1">
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="dias">Dias *</label>
                    <input type="number" id="dias" name="dias" 
                           [(ngModel)]="newItem.dias" required min="1"
                           class="form-control" placeholder="1">
                  </div>
                  <div class="form-group">
                    <label for="tipo_cobranca">Tipo de Cobrança *</label>
                    <select id="tipo_cobranca" name="tipo_cobranca" 
                            [(ngModel)]="newItem.tipo_cobranca" required
                            class="form-control">
                      <option value="diaria">Diária</option>
                      <option value="mensal">Mensal</option>
                    </select>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>&nbsp;</label>
                    <button type="button" class="btn btn-success" (click)="addItem()">
                      <span>➕</span> Adicionar Item
                    </button>
                  </div>
                </div>
              </div>

              <!-- Items List -->
              <div class="items-list" *ngIf="formData.itens.length > 0">
                <h5>Itens Adicionados:</h5>
                <div class="item-card" *ngFor="let item of formData.itens; let i = index">
                  <div class="item-info">
                    <strong>{{ getEquipamentoDescricao(item.equipamento_id) }}</strong>
                    <span class="item-details">
                      {{ item.quantidade }} x {{ item.dias }} dias 
                      ({{ item.tipo_cobranca === 'mensal' ? 'mensal' : 'diária' }}) = 
                      R$ {{ item.subtotal | number:'1.2-2' }}
                    </span>
                  </div>
                  <button type="button" class="btn btn-danger btn-sm" (click)="removeItem(i)">
                    <span>🗑️</span>
                  </button>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary" [disabled]="!form.valid || formData.itens.length === 0">
                {{ editingOrcamento ? 'Atualizar' : 'Salvar' }}
              </button>
              <button type="button" class="btn btn-secondary" (click)="cancelForm()">
                Cancelar
              </button>
            </div>
          </form>
        </div>

        <!-- Table Section -->
        <div class="table-section" *ngIf="!showForm">
          <!-- Filtros -->
          <div class="filters-section">
            <div class="filter-group">
              <label for="month">Mês:</label>
              <select id="month" [(ngModel)]="selectedMonth" class="form-control">
                <option value="">Todos os meses</option>
                <option value="01">Janeiro</option>
                <option value="02">Fevereiro</option>
                <option value="03">Março</option>
                <option value="04">Abril</option>
                <option value="05">Maio</option>
                <option value="06">Junho</option>
                <option value="07">Julho</option>
                <option value="08">Agosto</option>
                <option value="09">Setembro</option>
                <option value="10">Outubro</option>
                <option value="11">Novembro</option>
                <option value="12">Dezembro</option>
              </select>
            </div>
            
            <div class="filter-group">
              <label for="year">Ano:</label>
              <select id="year" [(ngModel)]="selectedYear" class="form-control">
                <option value="">Todos os anos</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
              </select>
            </div>
            
            <div class="filter-group">
              <button class="btn btn-warning" (click)="clearFilters()">
                🔄 Limpar Filtros
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
                <th>Data Criação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let orcamento of filteredOrcamentos">
                <td data-label="ID">{{ orcamento.id }}</td>
                                  <td data-label="Cliente">{{ orcamento.cliente.nome_razao_social || 'Cliente não encontrado' }}</td>
                <td data-label="Período">{{ orcamento.data_inicio | date:'dd/MM/yyyy' }} - {{ orcamento.data_fim | date:'dd/MM/yyyy' }}</td>
                <td data-label="Total">R$ {{ orcamento.total_final | number:'1.2-2' }}</td>
                <td data-label="Status">
                  <span class="badge" [class]="'badge-' + orcamento.status">
                    {{ orcamento.status }}
                  </span>
                </td>
                <td data-label="Data Criação">{{ orcamento.data_criacao | date:'dd/MM/yyyy' }}</td>
                <td data-label="Ações">
                  <div class="action-buttons">
                    <button class="action-btn approve" (click)="aprovarOrcamento(orcamento.id)" 
                            *ngIf="orcamento.status === 'pendente'" title="Aprovar Orçamento">
                      ✅ Aprovar
                    </button>
                    <button class="action-btn reject" (click)="rejeitarOrcamento(orcamento.id)" 
                            *ngIf="orcamento.status === 'pendente'" title="Rejeitar Orçamento">
                      ❌ Rejeitar
                    </button>
                    <button class="action-btn create-locacao" (click)="createLocacaoFromOrcamento(orcamento.id)" 
                            *ngIf="orcamento.status === 'aprovado'" title="Criar Locação">
                      📦 Criar Locação
                    </button>
                    <button class="action-btn view" (click)="viewOrcamento(orcamento)" title="Visualizar Detalhes">
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
            <div class="info-row" *ngIf="!selectedOrcamento?.observacoes">
              <strong>Observações:</strong> <em>Nenhuma observação registrada</em>
            </div>
          </div>

          <!-- Seção especial para orçamentos aprovados -->
          <div class="aprovado-section" *ngIf="selectedOrcamento?.status === 'aprovado'">
            <div class="aprovado-header">
              <h4>🎉 Orçamento Aprovado!</h4>
              <p>Este orçamento foi aprovado e está pronto para gerar o contrato de locação.</p>
            </div>
            <div class="aprovado-actions">
              <button class="btn btn-primary btn-lg" (click)="createLocacaoFromOrcamento(selectedOrcamento?.id)">
                📋 Gerar Contrato de Locação
              </button>
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
                  <td>R$ {{ item.preco_unitario | number:'1.2-2' }}</td>
                  <td>R$ {{ item.subtotal | number:'1.2-2' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="totals-section">
            <div class="total-row">
              <strong>Subtotal:</strong> R$ {{ getOrcamentoSubtotal(selectedOrcamento) | number:'1.2-2' }}
            </div>
            <div class="total-row">
              <strong>Desconto:</strong> R$ {{ selectedOrcamento?.desconto | number:'1.2-2' }}
            </div>
            <div class="total-row">
              <strong>Frete:</strong> R$ {{ selectedOrcamento?.frete | number:'1.2-2' }}
            </div>
            <div class="total-row final-total">
              <strong>Total Final:</strong> R$ {{ selectedOrcamento?.total_final | number:'1.2-2' }}
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-success" (click)="exportToXLSX()">
            📊 Exportar XLSX
          </button>
          <button class="btn btn-danger" (click)="exportToPDF()">
            📄 Exportar PDF
          </button>
          <button class="btn btn-secondary" (click)="closeViewModal()">
            Fechar
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .orcamentos {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .form-section {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      padding: 2rem;
      border-radius: 20px;
      margin-top: 1.5rem;
      border: 2px solid rgba(220, 53, 69, 0.1);
      box-shadow: 0 8px 32px rgba(220, 53, 69, 0.08);
    }

    .form-section h3 {
      color: #dc3545;
      margin-bottom: 1.5rem;
      font-size: 1.4rem;
      font-weight: bold;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-group label {
      font-weight: 700;
      margin-bottom: 0.75rem;
      color: #495057;
      font-size: 0.95rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: block;
    }

    .form-control {
      padding: 1rem 1.25rem;
      border: 2px solid #e9ecef;
      border-radius: 16px;
      font-size: 1rem;
      font-weight: 500;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      background: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      color: #495057;
    }

    .form-control:focus {
      outline: none;
      border-color: #dc3545;
      box-shadow: 0 0 0 4px rgba(220, 53, 69, 0.15);
      transform: translateY(-1px);
    }

    .form-control:hover {
      border-color: #dc3545;
      box-shadow: 0 4px 16px rgba(220, 53, 69, 0.1);
    }

    .form-control::placeholder {
      color: #adb5bd;
      font-weight: 400;
    }

    .form-help {
      font-size: 0.8rem;
      color: #6c757d;
      margin-top: 0.25rem;
      font-style: italic;
    }

    .periodo-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
      border-radius: 12px;
      border: 2px solid #2196f3;
      margin-top: 0.5rem;
    }

    .periodo-dias {
      font-weight: 700;
      color: #1976d2;
      font-size: 1.1rem;
    }

    .periodo-tipo {
      font-weight: 600;
      color: #1565c0;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .aprovado-section {
      background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
      border: 2px solid #28a745;
      border-radius: 16px;
      padding: 1.5rem;
      margin: 1.5rem 0;
      box-shadow: 0 8px 25px rgba(40, 167, 69, 0.15);
    }

    .aprovado-header {
      text-align: center;
      margin-bottom: 1.5rem;
    }

    .aprovado-header h4 {
      color: #155724;
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0 0 0.5rem 0;
      text-shadow: 0 2px 4px rgba(21, 87, 36, 0.2);
    }

    .aprovado-header p {
      color: #155724;
      font-size: 1rem;
      margin: 0;
      font-weight: 500;
    }

    .aprovado-actions {
      display: flex;
      justify-content: center;
    }

    .aprovado-actions .btn {
      font-size: 1.1rem;
      padding: 1rem 2rem;
      min-width: 250px;
      box-shadow: 0 8px 25px rgba(40, 167, 69, 0.3);
    }

    .aprovado-actions .btn:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 35px rgba(40, 167, 69, 0.4);
    }

    .items-section {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 2px solid rgba(220, 53, 69, 0.1);
    }

    .items-section h4 {
      color: #dc3545;
      margin-bottom: 1.5rem;
      font-size: 1.2rem;
      font-weight: bold;
    }

    .item-form {
      background: white;
      padding: 1.5rem;
      border-radius: 16px;
      margin-bottom: 1rem;
      border: 2px solid rgba(220, 53, 69, 0.1);
      box-shadow: 0 4px 20px rgba(220, 53, 69, 0.05);
    }

    .items-list {
      margin-top: 1rem;
    }

    .total-section {
      text-align: right;
      padding: 1rem;
      background: #f9fafb;
      border-radius: 8px;
      margin-top: 1rem;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      margin-top: 2rem;
      justify-content: flex-end;
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

    .btn-sm {
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
    }

    @media (max-width: 768px) {
      .form-row {
        grid-template-columns: 1fr;
      }
      
      .form-actions {
        flex-direction: column;
      }
      
      .table {
        font-size: 0.875rem;
      }
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

    .badge-pendente {
      background: linear-gradient(135deg, #fbbf24, #f59e0b);
      color: white;
      border-color: #f59e0b;
    }

    .badge-aprovado {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      border-color: #059669;
    }

    .badge-rejeitado {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
      border-color: #dc2626;
    }

    /* Filtros */
    .filters-section {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
      padding: 1.5rem;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-radius: 16px;
      border: 2px solid rgba(220, 53, 69, 0.1);
      box-shadow: 0 4px 20px rgba(220, 53, 69, 0.05);
      flex-wrap: wrap;
      align-items: end;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      min-width: 200px;
    }

    .filter-group label {
      font-weight: 700;
      font-size: 0.9rem;
      color: #495057;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .filter-group select {
      padding: 1rem 1.25rem;
      border: 2px solid #e9ecef;
      border-radius: 16px;
      background: white;
      font-size: 1rem;
      font-weight: 500;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      color: #495057;
    }

    .filter-group select:focus {
      outline: none;
      border-color: #dc3545;
      box-shadow: 0 0 0 4px rgba(220, 53, 69, 0.15);
      transform: translateY(-1px);
    }

    .filter-group select:hover {
      border-color: #dc3545;
      box-shadow: 0 4px 16px rgba(220, 53, 69, 0.1);
    }

    @media (max-width: 768px) {
      .filters-section {
        flex-direction: column;
        align-items: stretch;
      }

      .filter-group {
        min-width: auto;
      }
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      align-items: center;
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
    }

    .action-btn.reject {
      background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
      color: white;
    }

    .action-btn.view {
      background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%);
      color: #212529;
      border: 2px solid transparent;
    }

    .action-btn.view:hover {
      border-color: rgba(0, 0, 0, 0.1);
    }

    .action-btn.create-locacao {
      background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
      color: white;
      border: 2px solid transparent;
    }

    .action-btn.create-locacao:hover {
      border-color: rgba(255, 255, 255, 0.3);
    }

    .item-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f9fafb;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      margin-bottom: 0.75rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .item-info {
      flex-grow: 1;
      margin-right: 1rem;
    }

    .item-info strong {
      display: block;
      font-size: 0.9rem;
      color: #374151;
      margin-bottom: 0.25rem;
    }

    .item-details {
      font-size: 0.8rem;
      color: #6b7280;
    }

    @media (max-width: 768px) {
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
      backdrop-filter: blur(5px);
    }

    .modal-content {
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 90vw;
      max-height: 90vh;
      width: 800px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
      color: white;
      padding: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top-left-radius: 20px;
      border-top-right-radius: 20px;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
    }

    .modal-header .modal-close {
      background: none;
      border: none;
      font-size: 2rem;
      cursor: pointer;
      color: white;
      transition: color 0.3s ease;
    }

    .modal-header .modal-close:hover {
      color: #fecaca;
    }

    .modal-body {
      padding: 2rem;
      overflow-y: auto;
      flex-grow: 1;
    }

    .modal-body #orcamento-pdf-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      background: white;
      padding: 2rem;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      max-width: 800px;
      margin: 0 auto;
      /* Garantir que o conteúdo seja visível para html2canvas */
      visibility: visible !important;
      opacity: 1 !important;
      position: relative !important;
      z-index: 1;
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
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .items-table td {
      padding: 1rem;
      border-bottom: 1px solid #f3f4f6;
      vertical-align: middle;
    }

    .items-table tr:last-child td {
      border-bottom: none;
    }

    .items-table tr:nth-child(even) {
      background: #f9fafb;
    }

    .totals-section {
      background: #f9fafb;
      padding: 1.5rem;
      border-radius: 10px;
      border: 1px solid #e5e7eb;
      box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
      padding: 0.5rem 0;
      border-bottom: 1px solid #f3f4f6;
    }

    .total-row:last-child {
      border-bottom: none;
      margin-bottom: 0;
    }

    .total-row strong {
      font-weight: 600;
      color: #374151;
    }

    .final-total {
      font-size: 1.5rem;
      font-weight: 700;
      color: #dc2626;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 2px solid #dc2626;
    }

    .modal-footer {
      padding: 1.5rem;
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      background: #f9fafb;
      border-bottom-left-radius: 15px;
      border-bottom-right-radius: 15px;
    }

    .modal-footer .btn {
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
    }

    @media (max-width: 768px) {
      .modal-content {
        width: 95vw;
        max-height: 95vh;
      }
      
      .modal-body {
        padding: 1rem;
      }
      
      .items-table {
        font-size: 0.8rem;
      }
      
      .items-table th,
      .items-table td {
        padding: 0.5rem 0.25rem;
      }
      
      .modal-footer {
        flex-direction: column;
      }
    }
  `]
})
export class OrcamentosComponent implements OnInit {
  orcamentos: Orcamento[] = [];
  clientes: Cliente[] = [];
  equipamentos: Equipamento[] = [];
  locacoes: Locacao[] = [];
  showForm = false;
  editingOrcamento: Orcamento | null = null;
  selectedOrcamento: Orcamento | null = null;
  showViewModal = false;
  selectedMonth: string = '';
  selectedYear: string = '';
  periodoCalculado: { dias: number; tipoCobranca: string } | null = null;
  formData: OrcamentoCreate = {
    cliente_id: 0,
    data_inicio: '',
    data_fim: '',
    desconto: 0,
    frete: 0,
    total_final: 0,
    observacoes: '',
    itens: []
  };
  newItem: ItemOrcamentoCreate = {
    equipamento_id: 0,
    quantidade: 1,
    preco_unitario: 0,
    dias: 1,
    tipo_cobranca: 'diaria',
    subtotal: 0
  };

  constructor(
    private orcamentoService: OrcamentoService,
    private clienteService: ClienteService,
    private equipamentoService: EquipamentoService,
    private locacaoService: LocacaoService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  convertToNumber(value: any): number {
    return Number(value);
  }

  onDateChange() {
    if (this.formData.data_inicio && this.formData.data_fim) {
      const dataInicio = new Date(this.formData.data_inicio);
      const dataFim = new Date(this.formData.data_fim);
      
      if (dataFim > dataInicio) {
        const diffTime = dataFim.getTime() - dataInicio.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
        let tipoCobranca = 'diaria';
        if (diffDays >= 60) { // 2 meses ou mais
          tipoCobranca = 'mensal';
        } else if (diffDays >= 30) { // 1 mês ou mais
          tipoCobranca = 'mensal';
        }
        
        this.periodoCalculado = {
          dias: diffDays,
          tipoCobranca: tipoCobranca
        };
        
        // Aplicar automaticamente aos itens existentes
        this.aplicarPeriodoCalculado();
      } else {
        this.periodoCalculado = null;
      }
    } else {
      this.periodoCalculado = null;
    }
  }

  aplicarPeriodoCalculado() {
    if (this.periodoCalculado) {
      // Aplicar aos itens existentes
      this.formData.itens.forEach(item => {
        item.dias = this.periodoCalculado!.dias;
        item.tipo_cobranca = this.periodoCalculado!.tipoCobranca as 'diaria' | 'mensal';
        
        // Recalcular subtotal
        const equipamento = this.equipamentos.find(e => e.id === item.equipamento_id);
        if (equipamento) {
          // Para simplificar, usamos o preço unitário base
          // Em uma implementação real, você teria preços diferentes para diária/mensal
          item.preco_unitario = equipamento.preco_unitario;
          item.subtotal = item.quantidade * item.dias * equipamento.preco_unitario;
        }
      });
      
      // Aplicar ao novo item
      this.newItem.dias = this.periodoCalculado!.dias;
      this.newItem.tipo_cobranca = this.periodoCalculado!.tipoCobranca as 'diaria' | 'mensal';
    }
  }

  loadData() {
    // Carregar locações primeiro para filtrar orçamentos
    this.locacaoService.getLocacoes().subscribe(locacoes => {
      this.locacoes = locacoes;
      
      // Depois carregar orçamentos e filtrar os que viraram locação
      this.orcamentoService.getOrcamentos().subscribe(data => {
        this.orcamentos = data.filter(orcamento => {
          // Verificar se já existe uma locação para este orçamento
          const hasLocacao = this.locacoes.some(locacao => locacao.orcamento_id === orcamento.id);
          return !hasLocacao; // Retorna apenas orçamentos que NÃO têm locação
        });
      });
    });

    this.clienteService.getClientes().subscribe(data => {
      this.clientes = data;
    });

    this.equipamentoService.getEquipamentos().subscribe(data => {
      this.equipamentos = data;
    });
  }

  addItem() {
    console.log('addItem() called', this.newItem);
    console.log('equipamentos available:', this.equipamentos);
    
    // Validação básica
    if (!this.newItem.equipamento_id) {
      alert('Selecione um equipamento');
      return;
    }
    
    if (!this.newItem.quantidade || this.newItem.quantidade <= 0) {
      alert('Quantidade deve ser maior que 0');
      return;
    }
    
    if (!this.newItem.dias || this.newItem.dias <= 0) {
      alert('Dias deve ser maior que 0');
      return;
    }
    
    // Converter equipamento_id para número se for string
    const equipamentoId = Number(this.newItem.equipamento_id);
    console.log('Looking for equipamento with id:', equipamentoId, 'type:', typeof equipamentoId);
    const equipamento = this.equipamentos.find(e => e.id === equipamentoId);
    console.log('equipamento found:', equipamento);
    
    if (equipamento) {
      this.newItem.preco_unitario = equipamento.preco_unitario;
      
      // Calcular subtotal baseado no tipo de cobrança do item
      if (this.newItem.tipo_cobranca === 'mensal') {
        // Para cobrança mensal, calcular por mês (30 dias)
        const meses = Math.ceil(this.newItem.dias / 30);
        this.newItem.subtotal = this.newItem.quantidade * this.newItem.preco_unitario * meses;
      } else {
        // Para cobrança diária, calcular por dia
        this.newItem.subtotal = this.newItem.quantidade * this.newItem.preco_unitario * this.newItem.dias;
      }
      
      console.log('Adding item to formData:', this.newItem);
      this.formData.itens.push({ ...this.newItem });
      this.formData.total_final = this.calculateTotal();
      
      this.newItem = {
        equipamento_id: 0,
        quantidade: 1,
        preco_unitario: 0,
        dias: 1,
        tipo_cobranca: 'diaria',
        subtotal: 0
      };
      console.log('Item added successfully');
    } else {
      console.log('Equipamento não encontrado. Available equipamentos:', this.equipamentos.map(e => ({ id: e.id, descricao: e.descricao })));
      alert('Equipamento não encontrado');
    }
  }

  removeItem(index: number) {
    this.formData.itens.splice(index, 1);
    this.formData.total_final = this.calculateTotal();
  }

  calculateTotal(): number {
    const subtotal = this.formData.itens.reduce((sum, item) => sum + item.subtotal, 0);
    return subtotal - this.formData.desconto + this.formData.frete;
  }

  getEquipamentoName(id: number): string {
    const equipamento = this.equipamentos.find(e => e.id === id);
    return equipamento ? equipamento.descricao : '';
  }

  getEquipamentoPrice(id: number): number {
    const equipamento = this.equipamentos.find(e => e.id === id);
    return equipamento ? equipamento.preco_unitario : 0;
  }

  getEquipamentoDescricao(equipamentoId: number): string {
    const equipamento = this.equipamentos.find(e => e.id === equipamentoId);
    return equipamento ? equipamento.descricao : 'Equipamento não encontrado';
  }

  getOrcamentoSubtotal(orcamento: Orcamento | null): number {
    if (!orcamento || !orcamento.itens) {
      return 0;
    }
    return orcamento.itens.reduce((sum, item) => sum + item.subtotal, 0);
  }

  get filteredOrcamentos(): Orcamento[] {
    let filtered = this.orcamentos;

    // Filtrar por mês
    if (this.selectedMonth) {
      filtered = filtered.filter(orcamento => {
        const month = new Date(orcamento.data_criacao).getMonth() + 1;
        return month.toString().padStart(2, '0') === this.selectedMonth;
      });
    }

    // Filtrar por ano
    if (this.selectedYear) {
      filtered = filtered.filter(orcamento => {
        const year = new Date(orcamento.data_criacao).getFullYear();
        return year.toString() === this.selectedYear;
      });
    }

    return filtered;
  }

  clearFilters() {
    this.selectedMonth = '';
    this.selectedYear = '';
  }

  saveOrcamento() {
    this.formData.total_final = this.calculateTotal();
    
    if (this.editingOrcamento) {
      this.orcamentoService.updateOrcamento(this.editingOrcamento.id, this.formData).subscribe({
        next: (response) => {
          this.loadData();
          this.cancelForm();
        },
        error: (error) => {
          alert('Erro ao atualizar orçamento: ' + error.message);
        }
      });
    } else {
      this.orcamentoService.createOrcamento(this.formData).subscribe({
        next: (response) => {
          this.loadData();
          this.cancelForm();
        },
        error: (error) => {
          alert('Erro ao criar orçamento: ' + error.message);
        }
      });
    }
  }

  aprovarOrcamento(id: number) {
    this.orcamentoService.aprovarOrcamento(id).subscribe(() => {
      // Primeiro atualizar o orçamento localmente
      const orcamentoIndex = this.orcamentos.findIndex(o => o.id === id);
      if (orcamentoIndex !== -1) {
        this.orcamentos[orcamentoIndex].status = 'aprovado';
        this.selectedOrcamento = this.orcamentos[orcamentoIndex];
        this.showViewModal = true;
      }
      
      // Depois recarregar os dados para sincronizar com o servidor
      this.loadData();
    });
  }

  rejeitarOrcamento(id: number) {
    this.orcamentoService.rejeitarOrcamento(id).subscribe(() => {
      // Atualizar o orçamento localmente
      const orcamentoIndex = this.orcamentos.findIndex(o => o.id === id);
      if (orcamentoIndex !== -1) {
        this.orcamentos[orcamentoIndex].status = 'rejeitado';
      }
      
      // Recarregar os dados para sincronizar com o servidor
      this.loadData();
    });
  }

  viewOrcamento(orcamento: Orcamento) {
    this.selectedOrcamento = orcamento;
    this.showViewModal = true;
  }

  closeViewModal() {
    this.showViewModal = false;
    this.selectedOrcamento = null;
  }

  createLocacaoFromOrcamento(orcamentoId: number | undefined) {
    if (!orcamentoId) return;
    
    this.locacaoService.createLocacaoFromOrcamento(orcamentoId).subscribe({
      next: (response) => {
        console.log('Locação criada com sucesso:', response);
        // Recarregar dados
        this.loadData();
        // Fechar modal
        this.closeViewModal();
        // Mostrar mensagem de sucesso (você pode implementar um toast/notification)
        alert('Locação criada com sucesso!');
      },
      error: (error) => {
        console.error('Erro ao criar locação:', error);
        alert('Erro ao criar locação. Tente novamente.');
      }
    });
  }

  exportToXLSX() {
    if (!this.selectedOrcamento) return;

    const data = [
      ['ORÇAMENTO #' + this.selectedOrcamento.id],
      [''],
      ['Cliente:', this.selectedOrcamento.cliente?.nome_razao_social || 'N/A'],
      ['Data Início:', this.selectedOrcamento.data_inicio],
      ['Data Fim:', this.selectedOrcamento.data_fim],
      ['Status:', this.selectedOrcamento.status],
      [''],
      ['ITENS:'],
      ['Equipamento', 'Quantidade', 'Dias', 'Tipo Cobrança', 'Preço Unitário', 'Subtotal'],
      ...this.selectedOrcamento.itens?.map(item => [
        this.getEquipamentoDescricao(item.equipamento_id),
        item.quantidade,
        item.dias,
        item.tipo_cobranca,
        `R$ ${item.preco_unitario.toFixed(2)}`,
        `R$ ${item.subtotal.toFixed(2)}`
      ]) || [],
      [''],
      ['Subtotal:', `R$ ${this.getOrcamentoSubtotal(this.selectedOrcamento).toFixed(2)}`],
      ['Desconto:', `R$ ${this.selectedOrcamento.desconto?.toFixed(2) || '0.00'}`],
      ['Frete:', `R$ ${this.selectedOrcamento.frete?.toFixed(2) || '0.00'}`],
      ['Total Final:', `R$ ${this.selectedOrcamento.total_final?.toFixed(2) || '0.00'}`]
    ];

    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Orçamento');
    
    XLSX.writeFile(wb, `orcamento_${this.selectedOrcamento.id}.xlsx`);
  }

  async exportToPDF() {
    if (!this.selectedOrcamento) {
      console.error('Nenhum orçamento selecionado');
      return;
    }

    try {
      // Criar PDF usando jsPDF diretamente
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Configurações de página
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 25;
      const contentWidth = pageWidth - (2 * margin);
      
      // Posição inicial
      let yPosition = margin;
      
      // Função para adicionar texto
      const addText = (text: string, x: number, y: number, fontSize: number = 12, isBold: boolean = false, align: string = 'left') => {
        pdf.setFontSize(fontSize);
        if (isBold) {
          pdf.setFont('helvetica', 'bold');
        } else {
          pdf.setFont('helvetica', 'normal');
        }
        
        if (align === 'center') {
          pdf.text(text, x, y, { align: 'center' });
        } else {
          pdf.text(text, x, y);
        }
      };
      
      // Função para adicionar linha
      const addLine = (x1: number, y1: number, x2: number, y2: number) => {
        pdf.line(x1, y1, x2, y2);
      };
      
      // Função para adicionar logo
      const addLogo = async () => {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = '/logo-r-loc.jpg';
          
          return new Promise((resolve) => {
            img.onload = () => {
              const logoWidth = 30;
              const logoHeight = 30;
              const logoX = margin;
              const logoY = yPosition;
              
              pdf.addImage(img, 'JPEG', logoX, logoY, logoWidth, logoHeight);
              resolve(true);
            };
            img.onerror = () => {
              console.warn('Logo não carregado, continuando sem logo');
              resolve(false);
            };
          });
        } catch (error) {
          console.warn('Erro ao carregar logo:', error);
          return false;
        }
      };
      
      // Adicionar logo
      await addLogo();
      
      // Cabeçalho (após o logo)
      addText('Sistema de Locação de Equipamentos', pageWidth / 2, yPosition + 15, 16, true, 'center');
      yPosition += 25;
      
      addText(`ORÇAMENTO #${this.selectedOrcamento.id}`, pageWidth / 2, yPosition, 14, true, 'center');
      yPosition += 8;
      
      addText(`Data: ${new Date(this.selectedOrcamento.data_criacao).toLocaleDateString('pt-BR')}`, pageWidth / 2, yPosition, 10, false, 'center');
      yPosition += 20;
      
      // Informações do orçamento
      addText('INFORMAÇÕES DO ORÇAMENTO', margin, yPosition, 12, true);
      yPosition += 8;
      
      addLine(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;
      
      // Cliente
      addText('Cliente:', margin, yPosition, 10, true);
      const clienteText = this.selectedOrcamento.cliente?.nome_razao_social || 'Cliente não encontrado';
      addText(clienteText, margin + 25, yPosition, 10);
      yPosition += 6;
      
      // Datas
      addText('Data Início:', margin, yPosition, 10, true);
      addText(new Date(this.selectedOrcamento.data_inicio).toLocaleDateString('pt-BR'), margin + 25, yPosition, 10);
      yPosition += 6;
      
      addText('Data Fim:', margin, yPosition, 10, true);
      addText(new Date(this.selectedOrcamento.data_fim).toLocaleDateString('pt-BR'), margin + 25, yPosition, 10);
      yPosition += 6;
      
      // Status
      addText('Status:', margin, yPosition, 10, true);
      addText(this.selectedOrcamento.status.toUpperCase(), margin + 25, yPosition, 10);
      yPosition += 6;
      
      // Observações (se houver)
      if (this.selectedOrcamento.observacoes) {
        addText('Observações:', margin, yPosition, 10, true);
        addText(this.selectedOrcamento.observacoes, margin + 25, yPosition, 10);
        yPosition += 6;
      }
      
      yPosition += 12;
      
      // Tabela de itens
      addText('ITENS DO ORÇAMENTO', margin, yPosition, 12, true);
      yPosition += 8;
      
      addLine(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 6;
      
      // Cabeçalho da tabela
      const colWidths = [50, 15, 15, 20, 25, 25];
      const colPositions = [margin];
      for (let i = 1; i < colWidths.length; i++) {
        colPositions[i] = colPositions[i-1] + colWidths[i-1];
      }
      
      const headers = ['Equipamento', 'Qtd', 'Dias', 'Tipo', 'Preço', 'Subtotal'];
      headers.forEach((header, index) => {
        addText(header, colPositions[index], yPosition, 8, true);
      });
      yPosition += 6;
      
      addLine(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 6;
      
      // Itens da tabela
      if (this.selectedOrcamento.itens && this.selectedOrcamento.itens.length > 0) {
        this.selectedOrcamento.itens.forEach(item => {
          // Verificar se precisa de nova página
          if (yPosition > pageHeight - 80) {
            pdf.addPage();
            yPosition = margin;
          }
          
          addText(this.getEquipamentoDescricao(item.equipamento_id), colPositions[0], yPosition, 8);
          addText(item.quantidade.toString(), colPositions[1], yPosition, 8);
          addText(item.dias.toString(), colPositions[2], yPosition, 8);
          addText(item.tipo_cobranca === 'mensal' ? 'Mensal' : 'Diária', colPositions[3], yPosition, 8);
          addText(`R$ ${item.preco_unitario.toFixed(2)}`, colPositions[4], yPosition, 8);
          addText(`R$ ${item.subtotal.toFixed(2)}`, colPositions[5], yPosition, 8);
          yPosition += 5;
        });
      }
      
      yPosition += 8;
      
      // Totais
      addLine(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;
      
      const subtotal = this.getOrcamentoSubtotal(this.selectedOrcamento);
      addText('Subtotal:', pageWidth - margin - 50, yPosition, 10, true);
      addText(`R$ ${subtotal.toFixed(2)}`, pageWidth - margin - 10, yPosition, 10);
      yPosition += 6;
      
      if (this.selectedOrcamento.desconto) {
        addText('Desconto:', pageWidth - margin - 50, yPosition, 10, true);
        addText(`R$ ${this.selectedOrcamento.desconto.toFixed(2)}`, pageWidth - margin - 10, yPosition, 10);
        yPosition += 6;
      }
      
      if (this.selectedOrcamento.frete) {
        addText('Frete:', pageWidth - margin - 50, yPosition, 10, true);
        addText(`R$ ${this.selectedOrcamento.frete.toFixed(2)}`, pageWidth - margin - 10, yPosition, 10);
        yPosition += 6;
      }
      
      addLine(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;
      
      // Total final
      addText('TOTAL FINAL:', pageWidth - margin - 50, yPosition, 12, true);
      addText(`R$ ${this.selectedOrcamento.total_final.toFixed(2)}`, pageWidth - margin - 10, yPosition, 12, true);
      
      // Salvar o PDF
      pdf.save(`orcamento_${this.selectedOrcamento.id}.pdf`);
      console.log('PDF gerado com sucesso usando jsPDF diretamente');
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    }
  }

  cancelForm() {
    this.showForm = false;
    this.editingOrcamento = null;
    this.formData = {
      cliente_id: 0,
      data_inicio: '',
      data_fim: '',
      desconto: 0,
      frete: 0,
      total_final: 0,
      observacoes: '',
      itens: []
    };
  }
} 