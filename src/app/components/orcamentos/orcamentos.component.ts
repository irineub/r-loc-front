import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrencyBrPipe } from '../../pipes/currency-br.pipe';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OrcamentoService } from '../../services/orcamento.service';
import { ClienteService } from '../../services/cliente.service';
import { EquipamentoService } from '../../services/equipamento.service';
import { LocacaoService } from '../../services/locacao.service';
import { PrintableService } from '../../services/printable.service';
import { NavigationService } from '../../services/navigation.service';
import { Orcamento, Cliente, Equipamento, OrcamentoCreate, ItemOrcamentoCreate, Locacao } from '../../models/index';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-orcamentos',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyBrPipe],
  template: `
    <div class="orcamentos">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Gestão de Orçamentos</h2>
          <button class="btn btn-primary" (click)="showForm = true" *ngIf="!showForm">
            Novo Orçamento
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
                <label for="data_inicio">Data de Início *</label>
                <input type="date" id="data_inicio" name="data_inicio" 
                       [(ngModel)]="formData.data_inicio" required
                       (ngModelChange)="onDateChange()"
                       class="form-control">
                <small class="form-help">Data em que a locação deve começar</small>
                
              </div>
              <div class="form-group">
                <label for="data_fim">Data de Fim *</label>
                <input type="date" id="data_fim" name="data_fim" 
                       [(ngModel)]="formData.data_fim" required
                       (ngModelChange)="onDateChange()"
                       class="form-control">
                <small class="form-help">Data em que a locação deve terminar</small>
              
              </div>
            </div>
            
            <div class="form-row" *ngIf="periodoCalculado">
              <div class="form-group">
                <label>Período Calculado</label>
                <div class="periodo-info">
                  <span class="periodo-dias">{{ periodoCalculado.dias }} dias</span>
                  <span class="periodo-tipo">({{ getTipoCobrancaLabel(periodoCalculado.tipoCobranca).toLowerCase() }})</span>
                </div>
                <small class="form-help">Este período será aplicado automaticamente aos itens</small>
              </div>
            </div>

            <!-- Desconto e Frete -->
            <div class="form-row">
              <div class="form-group">
                <label for="desconto">Desconto (R$) - Opcional</label>
                <input type="number" id="desconto" name="desconto" 
                       [(ngModel)]="formData.desconto" min="0" step="0.01"
                       (ngModelChange)="onDescontoFreteChange()"
                       class="form-control" placeholder="0.00">
                <small class="form-help">Valor do desconto a ser aplicado</small>
              </div>
              <div class="form-group">
                <label for="frete">🚚 Frete/Valor Adicional (R$) - Opcional</label>
                <input type="number" id="frete" name="frete" 
                       [(ngModel)]="formData.frete" min="0" step="0.01"
                       (ngModelChange)="onDescontoFreteChange()"
                       class="form-control" placeholder="0.00">
                <small class="form-help">Valor adicional (frete ou outros custos)</small>
              </div>
            </div>

            <!-- Resumo Total -->
            <div class="form-row" *ngIf="formData.itens.length > 0">
              <div class="form-group total-preview">
                <label>Resumo Financeiro</label>
                <div class="total-breakdown">
                  <div class="total-line">
                    <span>Subtotal dos Itens:</span>
                    <strong>{{ getSubtotalItens() | currencyBr }}</strong>
                  </div>
                  <div class="total-line" *ngIf="formData.desconto > 0">
                    <span>Desconto:</span>
                    <strong class="text-danger">- {{ formData.desconto | currencyBr }}</strong>
                  </div>
                  <div class="total-line" *ngIf="formData.frete > 0">
                    <span>Frete/Adicional:</span>
                    <strong class="text-success">+ {{ formData.frete | currencyBr }}</strong>
                  </div>
                  <div class="total-line total-final">
                    <span>Total Final:</span>
                    <strong>{{ calculateTotal() | currencyBr }}</strong>
                  </div>
                </div>
              </div>
            </div>

            <!-- Items Section -->
            <div class="items-section">
              <h4>Itens do Orçamento</h4>
              
              <div class="item-form">
                <div class="form-row">
                  <div class="form-group">
                    <label for="equipamento_id">Equipamento *</label>
                    <select id="equipamento_id" name="equipamento_id" 
                            [ngModel]="newItem.equipamento_id" (ngModelChange)="onEquipamentoChange($event)" required
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
                           [(ngModel)]="newItem.quantidade" 
                           [max]="getMaxQuantidadeDisponivel()"
                           (ngModelChange)="onQuantidadeChange()"
                           required min="1"
                           class="form-control" 
                           [class.error]="hasQuantidadeExcedida()"
                           placeholder="1">
                    <small class="form-help" *ngIf="getMaxQuantidadeDisponivel() > 0">
                      Máximo disponível: {{ getMaxQuantidadeDisponivel() }}
                    </small>
                    <small class="form-help error" *ngIf="hasQuantidadeExcedida()">
                      Quantidade excede o estoque disponível! Máximo: {{ getMaxQuantidadeDisponivel() }}
                    </small>
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
                      <option value="semanal">Semanal</option>
                      <option value="quinzenal">Quinzenal</option>
                      <option value="mensal">Mensal</option>
                    </select>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>&nbsp;</label>
                    <button type="button" class="btn btn-success" (click)="addItem()">
                      Adicionar Item
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
                      ({{ getTipoCobrancaLabel(item.tipo_cobranca).toLowerCase() }}) = 
                      {{ item.subtotal | currencyBr }}
                    </span>
                  </div>
                  <button type="button" class="btn btn-danger btn-sm" (click)="removeItem(i)">
                    Remover
                  </button>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary" 
                      [disabled]="!isFormValid() || formData.itens.length === 0">
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
                <option *ngFor="let year of availableYears" [value]="year">{{ year }}</option>
              </select>
            </div>
            
            <div class="filter-group">
              <label for="status">Status:</label>
              <select id="status" [(ngModel)]="selectedStatus" class="form-control">
                <option value="">Todos os status</option>
                <option value="pendente">Pendente</option>
                <option value="aprovado">Aprovado</option>
                <option value="rejeitado">Rejeitado</option>
              </select>
            </div>
            
            <div class="filter-group">
              <button class="btn btn-warning" (click)="clearFilters()">
                Limpar Filtros
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
                <td data-label="Total">{{ orcamento.total_final | currencyBr }}</td>
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
                      Aprovar
                    </button>
                    <button class="action-btn reject" (click)="rejeitarOrcamento(orcamento.id)" 
                            *ngIf="orcamento.status === 'pendente'" title="Rejeitar Orçamento">
                      Rejeitar
                    </button>

                    <button class="action-btn view" (click)="viewOrcamento(orcamento)" title="Visualizar Detalhes">
                      Ver
                    </button>
                    <button class="action-btn edit" 
                            [class.disabled]="hasLocacaoForOrcamento(orcamento.id)"
                            [disabled]="hasLocacaoForOrcamento(orcamento.id)"
                            (click)="editOrcamento(orcamento)" 
                            [title]="hasLocacaoForOrcamento(orcamento.id) ? 'Não é possível editar orçamento com contrato gerado' : 'Editar Orçamento'">
                      Editar
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Dialog de Endereço de Entrega -->
    <div class="modal-overlay" *ngIf="showEnderecoDialog" (click)="closeEnderecoDialog()" style="z-index: 2000;">
      <div class="modal-content" (click)="$event.stopPropagation()" style="max-width: 600px;">
        <div class="modal-header">
          <h3>Endereço de Entrega</h3>
          <button class="modal-close" (click)="closeEnderecoDialog()">×</button>
        </div>
        <div class="modal-body">
          <p style="margin-bottom: 1rem; color: #666;">
            Confirme ou edite o endereço onde os equipamentos serão entregues. 
            Este endereço será usado no contrato de locação.
          </p>
          <div class="form-group" style="margin-bottom: 1.5rem;">
            <label for="endereco_entrega" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
              Endereço de Entrega *
            </label>
            <textarea 
              id="endereco_entrega" 
              name="endereco_entrega"
              [(ngModel)]="enderecoEntrega"
              rows="4"
              required
              style="width: 100%; padding: 0.75rem; border: 2px solid #ddd; border-radius: 8px; font-size: 14px; resize: vertical;"
              placeholder="Ex: Av. Paulista, 8659, São Paulo - SP"></textarea>
          </div>
          <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem;">
            <button class="btn btn-secondary" (click)="closeEnderecoDialog()">
              Cancelar
            </button>
            <button class="btn btn-primary" (click)="confirmarEnderecoECriarLocacao()" [disabled]="!enderecoEntrega || enderecoEntrega.trim() === ''">
              Confirmar e Gerar Contrato
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Visualização de Orçamento -->
    <div class="modal-overlay" *ngIf="showViewModal" (click)="closeViewModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Orçamento #{{ selectedOrcamento?.id }}</h3>
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
          <div class="aprovado-section" *ngIf="selectedOrcamento?.status === 'aprovado' && !hasLocacaoForOrcamento(selectedOrcamento?.id)">
            <div class="aprovado-header">
              <h4>Orçamento Aprovado!</h4>
              <p>Este orçamento foi aprovado e está pronto para gerar o contrato de locação.</p>
            </div>
            <div class="aprovado-actions">
              <button class="btn btn-primary btn-lg" (click)="openEnderecoDialog(selectedOrcamento?.id)">
                Gerar Contrato de Locação
              </button>
            </div>
          </div>

          <!-- Mensagem quando já existe locação -->
          <div class="aprovado-section" *ngIf="selectedOrcamento?.status === 'aprovado' && hasLocacaoForOrcamento(selectedOrcamento?.id)">
            <div class="aprovado-header">
              <h4>Locação Já Criada</h4>
              <p>Este orçamento já possui uma locação criada. Verifique a lista de locações para mais detalhes.</p>
            </div>
            <div class="aprovado-actions">
              <button class="btn btn-secondary btn-lg" (click)="irParaLocacoes()">
                Ver Locações
              </button>
            </div>
          </div>

          <div class="itens-section">
            <h4>Itens do Orçamento</h4>
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
                  <td>{{ getTipoCobrancaLabel(item.tipo_cobranca) }}</td>
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
            <div class="total-row" *ngIf="selectedOrcamento && selectedOrcamento.desconto && selectedOrcamento.desconto > 0">
              <strong>Desconto:</strong> {{ selectedOrcamento.desconto | currencyBr }}
            </div>
            <div class="total-row" *ngIf="selectedOrcamento && selectedOrcamento.frete && selectedOrcamento.frete > 0">
              <strong>Frete/Adicional:</strong> {{ selectedOrcamento.frete | currencyBr }}
            </div>
            <div class="total-row final-total">
              <strong>Total Final:</strong> {{ selectedOrcamento?.total_final | currencyBr }}
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-success" (click)="exportToXLSX()">
            Exportar XLSX
          </button>
          <button class="btn btn-primary" (click)="exportToOrcamentoPDF()">
            Orçamento PDF
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

    .card {
      background: white;
      border-radius: 20px;
      box-shadow: 0 12px 48px rgba(220, 53, 69, 0.12);
      overflow: hidden;
      border: 2px solid rgba(220, 53, 69, 0.1);
    }

    .card-header {
      background: linear-gradient(135deg, #dc3545 0%, #c82333 100%) !important;
      color: white !important;
      padding: 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      position: relative;
      overflow: hidden;
    }

    .card-header::before {
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

    .card-title {
      font-size: 1.8rem;
      font-weight: bold;
      margin: 0;
      position: relative;
      z-index: 1;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .form-section {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      padding: 2rem;
      border-radius: 20px;
      margin-top: 1.5rem;
      border: 2px solid rgba(220, 53, 69, 0.1);
      box-shadow: 0 8px 32px rgba(220, 53, 69, 0.08);
      width: 100%;
      box-sizing: border-box;
      overflow-x: hidden;
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
      min-width: 0;
      width: 100%;
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
      width: 100%;
      box-sizing: border-box;
      max-width: 100%;
    }

    .form-control select {
      width: 100%;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
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

    .form-help.error {
      color: #dc3545;
      font-weight: 600;
      font-style: normal;
    }

    .form-control.error {
      border-color: #dc3545;
      box-shadow: 0 0 0 4px rgba(220, 53, 69, 0.25);
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

    .total-preview {
      grid-column: 1 / -1;
    }

    .total-breakdown {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      padding: 1.5rem;
      border-radius: 12px;
      border: 2px solid rgba(220, 53, 69, 0.1);
      box-shadow: 0 4px 20px rgba(220, 53, 69, 0.05);
      margin-top: 0.5rem;
    }

    .total-line {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid rgba(220, 53, 69, 0.1);
      font-size: 0.95rem;
    }

    .total-line:last-child {
      border-bottom: none;
    }

    .total-line.total-final {
      font-size: 1.2rem;
      font-weight: 700;
      color: #dc3545;
      margin-top: 0.5rem;
      padding-top: 1rem;
      border-top: 2px solid #dc3545;
    }

    .total-line span {
      color: #495057;
    }

    .total-line .text-danger {
      color: #dc3545;
    }

    .total-line .text-success {
      color: #28a745;
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
      width: 100%;
      box-sizing: border-box;
      overflow: hidden;
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
        gap: 1rem;
      }
      
      .form-actions {
        flex-direction: column;
      }
      
      .form-actions .btn {
        width: 100%;
      }
      
      .form-control {
        font-size: 16px; /* Previne zoom no iOS */
        padding: 0.875rem 1rem;
        width: 100%;
        box-sizing: border-box;
        max-width: 100%;
      }
      
      .form-section {
        padding: 1.5rem;
        overflow-x: hidden;
      }

      .item-form {
        padding: 1rem;
        width: 100%;
        box-sizing: border-box;
        overflow: hidden;
      }

      .form-group {
        width: 100%;
        min-width: 0;
      }

      .form-row {
        width: 100%;
        box-sizing: border-box;
      }
      
      .table {
        font-size: 0.875rem;
      }
      
      .total-breakdown {
        padding: 1rem;
      }
      
      .total-line {
        font-size: 0.875rem;
      }
      
      .total-line.total-final {
        font-size: 1rem;
      }
    }
    
    @media (max-width: 480px) {
      .form-section {
        padding: 1rem;
      }
      
      .card-header {
        padding: 1.5rem;
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }
      
      .card-title {
        font-size: 1.4rem;
      }
      
      .form-control {
        padding: 0.75rem;
        font-size: 16px;
        width: 100%;
        box-sizing: border-box;
        max-width: 100%;
      }

      .form-section {
        padding: 1rem;
        overflow-x: hidden;
      }

      .item-form {
        padding: 0.875rem;
        width: 100%;
        box-sizing: border-box;
        overflow: hidden;
      }
      
      .items-section h4 {
        font-size: 1rem;
      }
      
      .item-card {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
      }
      
      .item-info {
        margin-right: 0;
        width: 100%;
      }
      
      .total-breakdown {
        padding: 0.875rem;
      }
      
      .total-line {
        font-size: 0.8rem;
        padding: 0.5rem 0;
      }
      
      .total-line.total-final {
        font-size: 0.95rem;
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
      display: none; /* Removendo a linha vermelha */
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

    .action-btn.edit {
      background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
      color: white;
      border: 2px solid transparent;
    }

    .action-btn.edit:hover {
      border-color: rgba(255, 255, 255, 0.3);
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
      min-height: 0;
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
      flex-shrink: 0;
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
      min-height: 0;
      -webkit-overflow-scrolling: touch;
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
      flex-shrink: 0;
      border-top: 1px solid #e9ecef;
    }

    .modal-footer .btn {
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
    }

    @media (max-width: 768px) {
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
      }
      
      .modal-footer .btn {
        width: 100%;
      }
      
      .itens-section {
        overflow-x: auto;
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
  showEnderecoDialog = false;
  enderecoEntrega = '';
  orcamentoIdParaLocacao: number | undefined;
  selectedMonth: string = '';
  selectedYear: string = '';
  selectedStatus: string = '';
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
    private locacaoService: LocacaoService,
    private printableService: PrintableService,
    private router: Router,
    private navigationService: NavigationService
  ) {}

  ngOnInit() {
    this.loadData();
    
    // Verificar se deve abrir modal de orçamento
    this.navigationService.getNavigationState().pipe(take(1)).subscribe(state => {
      if (state.shouldOpenOrcamentoModal && state.orcamentoId !== undefined) {
        const orcamentoId = state.orcamentoId;
        // Limpar estado imediatamente para evitar múltiplas execuções
        this.navigationService.clearNavigationState();
        
        // Aguardar um pouco para garantir que os dados foram carregados
        setTimeout(() => {
          const orcamento = this.orcamentos.find(o => o.id === orcamentoId);
          if (orcamento) {
            this.viewOrcamento(orcamento);
          } else {
            // Se não encontrou, buscar do servidor
            this.orcamentoService.getOrcamento(orcamentoId).subscribe(orc => {
              this.viewOrcamento(orc);
            });
          }
        }, 1000);
      }
    });
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
        } else if (diffDays >= 15) { // 15 dias ou mais (quinzenal)
          tipoCobranca = 'quinzenal';
        } else if (diffDays >= 7) { // 7 dias ou mais (semanal)
          tipoCobranca = 'semanal';
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
        item.tipo_cobranca = this.periodoCalculado!.tipoCobranca as 'diaria' | 'semanal' | 'quinzenal' | 'mensal';
        
        // Recalcular subtotal
        const equipamento = this.equipamentos.find(e => e.id === item.equipamento_id);
        if (equipamento) {
          item.preco_unitario = this.getPrecoPorTipoCobranca(equipamento, item.tipo_cobranca);
          item.subtotal = this.calcularSubtotalPorTipoCobranca(
            item.quantidade,
            equipamento,
            item.dias,
            item.tipo_cobranca
          );
        }
      });
      
      // Aplicar ao novo item
      this.newItem.dias = this.periodoCalculado!.dias;
      this.newItem.tipo_cobranca = this.periodoCalculado!.tipoCobranca as 'diaria' | 'semanal' | 'quinzenal' | 'mensal';
    }
  }

  loadData() {
    // Carregar locações
    this.locacaoService.getLocacoes().subscribe(locacoes => {
      this.locacoes = locacoes;
    });

    // Carregar todos os orçamentos (sem filtrar)
    this.orcamentoService.getOrcamentos().subscribe(data => {
      this.orcamentos = data;
    });

    this.clienteService.getClientes().subscribe(data => {
      this.clientes = data;
    });

    this.equipamentoService.getEquipamentos().subscribe(data => {
      this.equipamentos = data;
      this.printableService.setEquipamentos(data);
    });
  }

  getMaxQuantidadeDisponivel(): number {
    if (!this.newItem.equipamento_id) {
      return 0;
    }
    
    const equipamentoId = Number(this.newItem.equipamento_id);
    const equipamento = this.equipamentos.find(e => e.id === equipamentoId);
    
    if (!equipamento) {
      return 0;
    }
    
    // Obter estoque disponível do equipamento (garantir que é um número)
    const estoqueDisponivel = Number(equipamento.estoque_disponivel) || 0;
    
    // Calcular quantidade já usada no mesmo orçamento para este equipamento
    // Converter todos os IDs e quantidades para números para garantir comparação correta
    const quantidadeJaUsada = this.formData.itens
      .filter(item => Number(item.equipamento_id) === equipamentoId)
      .reduce((sum, item) => sum + (Number(item.quantidade) || 0), 0);
    
    // Retornar o estoque disponível menos o que já foi usado
    const maxDisponivel = Math.max(0, estoqueDisponivel - quantidadeJaUsada);
    
    console.log(`getMaxQuantidadeDisponivel() - Equipamento ID: ${equipamentoId}, Estoque: ${estoqueDisponivel}, Já usado: ${quantidadeJaUsada}, Max disponível: ${maxDisponivel}`);
    
    return maxDisponivel;
  }

  hasQuantidadeExcedida(): boolean {
    if (!this.newItem.equipamento_id || !this.newItem.quantidade) {
      return false;
    }
    
    const maxDisponivel = this.getMaxQuantidadeDisponivel();
    return this.newItem.quantidade > maxDisponivel;
  }

  onQuantidadeChange() {
    const maxDisponivel = this.getMaxQuantidadeDisponivel();
    if (this.newItem.quantidade && this.newItem.quantidade > maxDisponivel) {
      // Ajustar automaticamente para o máximo disponível
      this.newItem.quantidade = maxDisponivel;
      alert(`Quantidade ajustada para o máximo disponível: ${maxDisponivel}`);
    }
  }

  addItem() {
    console.log('addItem() called', this.newItem);
    console.log('equipamentos available:', this.equipamentos);
    
    // Validação básica
    if (!this.newItem.equipamento_id) {
      alert('Selecione um equipamento');
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
    
    if (!equipamento) {
      alert('Equipamento não encontrado');
      return;
    }
    
    // Validação de estoque ANTES de adicionar
    const maxDisponivel = this.getMaxQuantidadeDisponivel();
    const quantidadeSolicitada = Number(this.newItem.quantidade) || 0;
    
    if (quantidadeSolicitada <= 0) {
      alert('Quantidade deve ser maior que 0');
      return;
    }
    
    // Verificar se há estoque disponível
    if (maxDisponivel <= 0) {
      alert(`Não é possível adicionar "${equipamento.descricao}".\n\n` +
            `Estoque disponível: 0 unidades.\n\n` +
            `Este equipamento não possui estoque disponível no momento.`);
      return;
    }
    
    // Verificar se a quantidade solicitada excede o disponível
    if (quantidadeSolicitada > maxDisponivel) {
      const quantidadeJaUsada = this.formData.itens
        .filter(item => Number(item.equipamento_id) === equipamentoId)
        .reduce((sum, item) => sum + (Number(item.quantidade) || 0), 0);
      
      const estoqueTotal = equipamento.estoque_disponivel || 0;
      
      alert(`Quantidade excede o estoque disponível!\n\n` +
            `Equipamento: ${equipamento.descricao}\n` +
            `Quantidade solicitada: ${quantidadeSolicitada}\n` +
            `Estoque total disponível: ${estoqueTotal} unidades\n` +
            `Já usado neste orçamento: ${quantidadeJaUsada} unidades\n` +
            `Máximo que pode adicionar: ${maxDisponivel} unidades\n\n` +
            `Por favor, ajuste a quantidade para ${maxDisponivel} ou menos.`);
      
      // Ajustar automaticamente para o máximo disponível
      this.newItem.quantidade = maxDisponivel;
      // NÃO adicionar o item - o usuário deve ajustar manualmente ou clicar novamente
      return;
    }
    
    // Se chegou aqui, a validação passou - pode adicionar o item
    const precoUnitario = this.getPrecoPorTipoCobranca(equipamento, this.newItem.tipo_cobranca);
    this.newItem.preco_unitario = precoUnitario;
    
    // Calcular subtotal baseado no tipo de cobrança do item
    this.newItem.subtotal = this.calcularSubtotalPorTipoCobranca(
      this.newItem.quantidade,
      equipamento,
      this.newItem.dias,
      this.newItem.tipo_cobranca
    );
    
    console.log('Adding item to formData:', this.newItem);
    this.formData.itens.push({ ...this.newItem });
    this.formData.total_final = this.calculateTotal();
    
    // Aplicar período calculado ao novo item se disponível
    if (this.periodoCalculado) {
      this.aplicarPeriodoCalculado();
    }
    
    // Reset do newItem mantendo o período calculado
    this.newItem = {
      equipamento_id: 0,
      quantidade: 1,
      preco_unitario: 0,
      dias: this.periodoCalculado ? this.periodoCalculado.dias : 1,
      tipo_cobranca: this.periodoCalculado ? (this.periodoCalculado.tipoCobranca as 'diaria' | 'semanal' | 'quinzenal' | 'mensal') : 'diaria',
      subtotal: 0
    };
    console.log('Item added successfully');
  }

  removeItem(index: number) {
    this.formData.itens.splice(index, 1);
    this.formData.total_final = this.calculateTotal();
  }

  isFormValid(): boolean {
    // Verificar campos obrigatórios
    const clienteId = Number(this.formData.cliente_id) || 0;
    if (!clienteId || clienteId <= 0) {
      return false;
    }
    
    if (!this.formData.data_inicio || this.formData.data_inicio.trim() === '') {
      return false;
    }
    
    if (!this.formData.data_fim || this.formData.data_fim.trim() === '') {
      return false;
    }
    
    // Verificar se data fim é depois da data início
    if (this.formData.data_inicio && this.formData.data_fim) {
      const dataInicio = new Date(this.formData.data_inicio);
      const dataFim = new Date(this.formData.data_fim);
      if (isNaN(dataInicio.getTime()) || isNaN(dataFim.getTime())) {
        return false;
      }
      if (dataFim <= dataInicio) {
        return false;
      }
    }
    
    // Verificar se há itens
    if (!this.formData.itens || this.formData.itens.length === 0) {
      return false;
    }
    
    // Verificar se todos os itens têm dados válidos
    for (const item of this.formData.itens) {
      const equipamentoId = Number(item.equipamento_id) || 0;
      const quantidade = Number(item.quantidade) || 0;
      const dias = Number(item.dias) || 0;
      
      if (!equipamentoId || equipamentoId <= 0) {
        return false;
      }
      if (!quantidade || quantidade <= 0) {
        return false;
      }
      if (!dias || dias <= 0) {
        return false;
      }
    }
    
    return true;
  }

  getSubtotalItens(): number {
    return this.formData.itens.reduce((sum, item) => sum + item.subtotal, 0);
  }

  calculateTotal(): number {
    const subtotal = this.getSubtotalItens();
    return subtotal - this.formData.desconto + this.formData.frete;
  }

  onDescontoFreteChange() {
    // Recalcular o total quando desconto ou frete mudarem
    this.formData.total_final = this.calculateTotal();
  }

  onEquipamentoChange(equipamentoId: any) {
    this.newItem.equipamento_id = this.convertToNumber(equipamentoId);
    // Ajustar quantidade se necessário quando trocar equipamento
    if (this.newItem.equipamento_id) {
      const maxDisponivel = this.getMaxQuantidadeDisponivel();
      if (this.newItem.quantidade > maxDisponivel) {
        this.newItem.quantidade = maxDisponivel;
      }
    }
  }

  getEquipamentoName(id: number): string {
    const equipamento = this.equipamentos.find(e => e.id === id);
    return equipamento ? equipamento.descricao : '';
  }

  getEquipamentoPrice(id: number, tipoCobranca: string = 'diaria'): number {
    const equipamento = this.equipamentos.find(e => e.id === id);
    if (!equipamento) return 0;
    return this.getPrecoPorTipoCobranca(equipamento, tipoCobranca);
  }

  getEquipamentoDescricao(equipamentoId: number): string {
    const equipamento = this.equipamentos.find(e => e.id === equipamentoId);
    return equipamento ? equipamento.descricao : 'Equipamento não encontrado';
  }

  getTipoCobrancaLabel(tipoCobranca: string): string {
    switch(tipoCobranca) {
      case 'diaria':
        return 'Diária';
      case 'semanal':
        return 'Semanal';
      case 'quinzenal':
        return 'Quinzenal';
      case 'mensal':
        return 'Mensal';
      default:
        return 'Diária';
    }
  }

  getPrecoPorTipoCobranca(equipamento: Equipamento, tipoCobranca: string): number {
    switch(tipoCobranca) {
      case 'diaria':
        return equipamento.preco_diaria;
      case 'semanal':
        return equipamento.preco_semanal;
      case 'quinzenal':
        return equipamento.preco_quinzenal;
      case 'mensal':
        return equipamento.preco_mensal;
      default:
        return equipamento.preco_diaria;
    }
  }

  calcularSubtotalPorTipoCobranca(quantidade: number, equipamento: Equipamento, dias: number, tipoCobranca: string): number {
    const precoUnitario = this.getPrecoPorTipoCobranca(equipamento, tipoCobranca);
    
    if (tipoCobranca === 'mensal') {
      const meses = Math.ceil(dias / 30);
      return quantidade * precoUnitario * meses;
    } else if (tipoCobranca === 'semanal') {
      const semanas = Math.ceil(dias / 7);
      return quantidade * precoUnitario * semanas;
    } else if (tipoCobranca === 'quinzenal') {
      const quinzenas = Math.ceil(dias / 15);
      return quantidade * precoUnitario * quinzenas;
    } else {
      return quantidade * precoUnitario * dias;
    }
  }

  getOrcamentoSubtotal(orcamento: Orcamento | null): number {
    if (!orcamento || !orcamento.itens) {
      return 0;
    }
    return orcamento.itens.reduce((sum, item) => sum + item.subtotal, 0);
  }

  get availableYears(): number[] {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    // Criar lista de anos: ano atual + 1 (futuro) até 5 anos atrás
    for (let year = currentYear + 1; year >= currentYear - 5; year--) {
      years.push(year);
    }
    return years;
  }

  get filteredOrcamentos(): Orcamento[] {
    let filtered = [...this.orcamentos]; // Criar cópia para não modificar o array original

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

    // Filtrar por status
    if (this.selectedStatus) {
      filtered = filtered.filter(orcamento => {
        return orcamento.status === this.selectedStatus;
      });
    }

    // Ordenar: pendentes primeiro, depois aprovados sem contrato, depois os outros
    filtered.sort((a, b) => {
      const aHasLocacao = this.hasLocacaoForOrcamento(a.id);
      const bHasLocacao = this.hasLocacaoForOrcamento(b.id);
      
      // Definir ordem de prioridade considerando status e presença de contrato
      let priorityA = 999;
      let priorityB = 999;
      
      if (a.status === 'pendente') {
        priorityA = 0;
      } else if (a.status === 'aprovado' && !aHasLocacao) {
        priorityA = 1; // Aprovado sem contrato
      } else if (a.status === 'aprovado' && aHasLocacao) {
        priorityA = 2; // Aprovado com contrato
      } else if (a.status === 'rejeitado') {
        priorityA = 3;
      }
      
      if (b.status === 'pendente') {
        priorityB = 0;
      } else if (b.status === 'aprovado' && !bHasLocacao) {
        priorityB = 1; // Aprovado sem contrato
      } else if (b.status === 'aprovado' && bHasLocacao) {
        priorityB = 2; // Aprovado com contrato
      } else if (b.status === 'rejeitado') {
        priorityB = 3;
      }

      const priorityDiff = priorityA - priorityB;
      
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      // Se mesma prioridade, ordenar por data de criação (mais recente primeiro)
      const dateA = new Date(a.data_criacao).getTime();
      const dateB = new Date(b.data_criacao).getTime();
      return dateB - dateA;
    });

    return filtered;
  }

  clearFilters() {
    this.selectedMonth = '';
    this.selectedYear = '';
    this.selectedStatus = '';
  }

  saveOrcamento() {
    // Validação final: verificar se todos os itens têm estoque disponível
    const itensSemEstoque: string[] = [];
    
    // Se estamos editando um orçamento pendente, precisamos considerar que os itens antigos já estão reservados
    let itensAntigos: any[] = [];
    if (this.editingOrcamento && this.editingOrcamento.status !== 'rejeitado') {
      // Orçamento pendente ou aprovado sem contrato - itens antigos estão reservados
      itensAntigos = this.editingOrcamento.itens || [];
    }
    
    // Calcular quantidades antigas por equipamento
    const equipamentosAntigosQuantidades: { [key: number]: number } = {};
    for (const itemAntigo of itensAntigos) {
      const equipamentoId = Number(itemAntigo.equipamento_id);
      if (!equipamentosAntigosQuantidades[equipamentoId]) {
        equipamentosAntigosQuantidades[equipamentoId] = 0;
      }
      equipamentosAntigosQuantidades[equipamentoId] += Number(itemAntigo.quantidade) || 0;
    }
    
    // Calcular quantidades novas por equipamento
    const equipamentosNovosQuantidades: { [key: number]: number } = {};
    for (const item of this.formData.itens) {
      const equipamentoId = Number(item.equipamento_id);
      if (!equipamentosNovosQuantidades[equipamentoId]) {
        equipamentosNovosQuantidades[equipamentoId] = 0;
      }
      equipamentosNovosQuantidades[equipamentoId] += Number(item.quantidade) || 0;
    }
    
    // Validar estoque considerando que os itens antigos serão liberados
    for (const item of this.formData.itens) {
      const equipamento = this.equipamentos.find(e => e.id === item.equipamento_id);
      if (!equipamento) {
        itensSemEstoque.push(`Equipamento ID ${item.equipamento_id} (não encontrado)`);
        continue;
      }
      
      const equipamentoId = Number(item.equipamento_id);
      const estoqueTotal = equipamento.estoque || 0;
      const estoqueAlugado = equipamento.estoque_alugado || 0;
      const estoqueDisponivelAtual = estoqueTotal - estoqueAlugado;
      
      // Quantidade que será liberada dos itens antigos deste equipamento
      const quantidadeAntiga = equipamentosAntigosQuantidades[equipamentoId] || 0;
      // Estoque disponível após liberar os itens antigos
      const estoqueDisponivelAposLiberacao = estoqueDisponivelAtual + quantidadeAntiga;
      
      const quantidadeTotalNova = equipamentosNovosQuantidades[equipamentoId] || 0;
      
      // Validar apenas uma vez por equipamento (usar a primeira ocorrência)
      if (this.formData.itens.findIndex(i => Number(i.equipamento_id) === equipamentoId) === this.formData.itens.indexOf(item)) {
        if (estoqueDisponivelAposLiberacao <= 0) {
          itensSemEstoque.push(`${equipamento.descricao}: sem estoque disponível (após liberar itens antigos: ${estoqueDisponivelAposLiberacao})`);
        } else if (quantidadeTotalNova > estoqueDisponivelAposLiberacao) {
          itensSemEstoque.push(`${equipamento.descricao}: estoque insuficiente (disponível após liberar itens antigos: ${estoqueDisponivelAposLiberacao}, solicitado: ${quantidadeTotalNova})`);
        }
      }
    }
    
    if (itensSemEstoque.length > 0) {
      alert('Não é possível salvar o orçamento!\n\n' +
            'Os seguintes itens não possuem estoque disponível:\n\n' +
            itensSemEstoque.map(item => `• ${item}`).join('\n') +
            '\n\nPor favor, remova ou ajuste os itens antes de salvar.');
      return;
    }
    
    // Recalcular subtotais dos itens antes de salvar
    for (const item of this.formData.itens) {
      const equipamento = this.equipamentos.find(e => e.id === item.equipamento_id);
      if (equipamento) {
        const precoUnitario = this.getPrecoPorTipoCobranca(equipamento, item.tipo_cobranca);
        item.preco_unitario = precoUnitario;
        item.subtotal = item.quantidade * precoUnitario * item.dias;
      }
    }
    
    this.formData.total_final = this.calculateTotal();
    
    if (this.editingOrcamento) {
      // O backend já vai voltar para pendente automaticamente se estava rejeitado
      this.orcamentoService.updateOrcamento(this.editingOrcamento.id, this.formData).subscribe({
        next: (response) => {
          this.loadData();
          this.cancelForm();
        },
        error: (error) => {
          const errorMessage = error.error?.detail || error.message || 'Erro desconhecido';
          alert('Erro ao atualizar orçamento: ' + errorMessage);
        }
      });
    } else {
      this.orcamentoService.createOrcamento(this.formData).subscribe({
        next: (response) => {
          this.loadData();
          this.cancelForm();
        },
        error: (error) => {
          const errorMessage = error.error?.detail || error.message || 'Erro desconhecido';
          alert('Erro ao criar orçamento: ' + errorMessage);
        }
      });
    }
  }

  // Método auxiliar para gerar contrato e recibo
  private async generateDocumentsFromOrcamento(orcamento: Orcamento, prefix: string = '') {
    try {
      // Criar uma locação temporária baseada no orçamento para gerar os documentos
      const locacaoTemp: any = {
        ...orcamento,
        cliente: orcamento.cliente,
        itens: orcamento.itens
      };

      // Gerar contrato
      const contratoHtml = this.printableService.generateContratoHTML(locacaoTemp);
      const contratoFilename = `contrato_${prefix}${orcamento.id}_${new Date().toISOString().split('T')[0]}.pdf`;
      await this.printableService.exportToPDF(contratoHtml, contratoFilename);

      // Gerar recibo
      const reciboHtml = this.printableService.generateReciboHTML(locacaoTemp);
      const reciboFilename = `recibo_${prefix}${orcamento.id}_${new Date().toISOString().split('T')[0]}.pdf`;
      await this.printableService.exportToPDF(reciboHtml, reciboFilename);

      return true;
    } catch (error) {
      console.error('Erro ao gerar documentos:', error);
      return false;
    }
  }

  async aprovarOrcamento(id: number) {
    this.orcamentoService.aprovarOrcamento(id).subscribe(async () => {
      // Primeiro atualizar o orçamento localmente
      const orcamentoIndex = this.orcamentos.findIndex(o => o.id === id);
      if (orcamentoIndex !== -1) {
        this.orcamentos[orcamentoIndex].status = 'aprovado';
        this.selectedOrcamento = this.orcamentos[orcamentoIndex];
        this.showViewModal = true;
      }
      
      // Depois recarregar os dados para sincronizar com o servidor
      this.loadData();
      
      alert('Orçamento aprovado com sucesso!');
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

  editOrcamento(orcamento: Orcamento) {
    // Verificar se já existe locação para este orçamento
    if (this.hasLocacaoForOrcamento(orcamento.id)) {
      return; // Não fazer nada se tiver contrato gerado (botão já está desabilitado)
    }

    // Se o orçamento foi rejeitado, verificar disponibilidade dos itens
    const isRejeitado = orcamento.status === 'rejeitado';
    const itensValidos: any[] = [];
    const itensRemovidos: string[] = [];

    if (isRejeitado && orcamento.itens) {
      // Garantir que os equipamentos estão carregados
      if (this.equipamentos.length === 0) {
        console.warn('Equipamentos não carregados ainda, recarregando...');
        this.equipamentoService.getEquipamentos().subscribe(data => {
          this.equipamentos = data;
          this.printableService.setEquipamentos(data);
          // Tentar novamente após carregar
          setTimeout(() => this.editOrcamento(orcamento), 100);
        });
        return;
      }

      // Verificar disponibilidade de cada item
      for (const item of orcamento.itens) {
        const equipamento = this.equipamentos.find(e => e.id === item.equipamento_id);
        
        if (!equipamento) {
          // Equipamento não encontrado - remover
          itensRemovidos.push(`Equipamento ID ${item.equipamento_id} (não encontrado)`);
          continue;
        }

        // Calcular estoque disponível corretamente
        const estoqueTotal = equipamento.estoque || 0;
        const estoqueAlugado = equipamento.estoque_alugado || 0;
        const estoqueDisponivel = estoqueTotal - estoqueAlugado;
        const quantidadeSolicitada = Number(item.quantidade) || 0;

        console.log(`Verificando item: ${equipamento.descricao}, Estoque: ${estoqueTotal}, Alugado: ${estoqueAlugado}, Disponível: ${estoqueDisponivel}, Solicitado: ${quantidadeSolicitada}`);

        if (estoqueDisponivel <= 0) {
          // Sem estoque - remover completamente
          itensRemovidos.push(`${equipamento.descricao}: sem estoque disponível (${estoqueDisponivel} unidades) - REMOVIDO`);
        } else if (estoqueDisponivel < quantidadeSolicitada) {
          // Estoque insuficiente - ajustar para o máximo disponível
          const precoUnitario = this.getPrecoPorTipoCobranca(equipamento, item.tipo_cobranca);
          const novoSubtotal = estoqueDisponivel * precoUnitario * item.dias;
          
          itensValidos.push({
            equipamento_id: item.equipamento_id,
            quantidade: estoqueDisponivel, // Ajustar para o máximo disponível
            preco_unitario: precoUnitario,
            dias: item.dias,
            tipo_cobranca: item.tipo_cobranca,
            subtotal: novoSubtotal
          });
          itensRemovidos.push(
            `${equipamento.descricao}: quantidade ajustada de ${quantidadeSolicitada} para ${estoqueDisponivel} (máximo disponível)`
          );
        } else {
          // Item disponível - manter
          itensValidos.push({
            equipamento_id: item.equipamento_id,
            quantidade: item.quantidade,
            preco_unitario: item.preco_unitario,
            dias: item.dias,
            tipo_cobranca: item.tipo_cobranca,
            subtotal: item.subtotal
          });
        }
      }

      // Avisar o usuário sobre itens removidos ou ajustados
      if (itensRemovidos.length > 0) {
        const mensagem = `Orçamento rejeitado editado\n\n` +
          `Alguns itens foram ajustados ou removidos devido à falta de estoque:\n\n` +
          itensRemovidos.map(item => `• ${item}`).join('\n') +
          `\n\nPor favor, revise os itens antes de salvar.`;
        alert(mensagem);
      }

      // Se não sobrou nenhum item válido, avisar e não permitir editar
      if (itensValidos.length === 0) {
        alert('Não é possível editar este orçamento!\n\nTodos os itens foram removidos porque não há estoque disponível.\n\nPor favor, adicione novos itens com estoque disponível.');
        return;
      }
    } else {
      // Se não foi rejeitado, manter todos os itens
      itensValidos.push(...(orcamento.itens?.map(item => ({
        equipamento_id: item.equipamento_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        dias: item.dias,
        tipo_cobranca: item.tipo_cobranca,
        subtotal: item.subtotal
      })) || []));
    }

    // Carregar dados do orçamento no formulário
    this.editingOrcamento = orcamento;
    this.formData = {
      cliente_id: orcamento.cliente_id,
      data_inicio: orcamento.data_inicio.split('T')[0], // Converter para formato de input date
      data_fim: orcamento.data_fim.split('T')[0],
      desconto: orcamento.desconto || 0,
      frete: orcamento.frete || 0,
      total_final: orcamento.total_final,
      observacoes: orcamento.observacoes || '',
      itens: itensValidos
    };

    // Recalcular total com os itens ajustados
    this.formData.total_final = this.calculateTotal();

    // Calcular período
    this.onDateChange();

    // Mostrar formulário
    this.showForm = true;

    // Scroll para o formulário
    setTimeout(() => {
      const formSection = document.querySelector('.form-section');
      if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  viewOrcamento(orcamento: Orcamento) {
    this.selectedOrcamento = orcamento;
    this.showViewModal = true;
  }

  closeViewModal() {
    this.showViewModal = false;
    this.selectedOrcamento = null;
  }

  openEnderecoDialog(orcamentoId: number | undefined) {
    console.log('openEnderecoDialog chamado', { orcamentoId, selectedOrcamento: this.selectedOrcamento });
    if (!orcamentoId || !this.selectedOrcamento) {
      console.log('Validação falhou', { orcamentoId, selectedOrcamento: this.selectedOrcamento });
      return;
    }
    
    // Preencher com o endereço do cliente como padrão
    this.enderecoEntrega = this.selectedOrcamento.cliente?.endereco || '';
    this.orcamentoIdParaLocacao = orcamentoId;
    this.showEnderecoDialog = true;
    console.log('Dialog aberto', { showEnderecoDialog: this.showEnderecoDialog, enderecoEntrega: this.enderecoEntrega });
  }

  closeEnderecoDialog() {
    this.showEnderecoDialog = false;
    this.enderecoEntrega = '';
    this.orcamentoIdParaLocacao = undefined;
  }

  confirmarEnderecoECriarLocacao() {
    console.log('confirmarEnderecoECriarLocacao chamado', {
      orcamentoIdParaLocacao: this.orcamentoIdParaLocacao,
      enderecoEntrega: this.enderecoEntrega
    });
    
    if (!this.orcamentoIdParaLocacao || !this.enderecoEntrega || this.enderecoEntrega.trim() === '') {
      alert('Por favor, informe o endereço de entrega.');
      return;
    }
    
    // Salvar os valores antes de fechar o dialog
    const orcamentoId = this.orcamentoIdParaLocacao;
    const endereco = this.enderecoEntrega.trim();
    
    // Fechar o dialog
    this.showEnderecoDialog = false;
    
    // Criar a locação com os valores salvos
    this.createLocacaoFromOrcamento(orcamentoId, endereco);
  }

  async createLocacaoFromOrcamento(orcamentoId: number | undefined, enderecoEntrega?: string) {
    console.log('createLocacaoFromOrcamento chamado', { orcamentoId, enderecoEntrega, selectedOrcamento: this.selectedOrcamento });
    
    if (!orcamentoId || !this.selectedOrcamento) {
      console.error('Validação falhou em createLocacaoFromOrcamento', { orcamentoId, selectedOrcamento: this.selectedOrcamento });
      alert('Erro: Orçamento não selecionado. Por favor, tente novamente.');
      return;
    }
    
    console.log('Criando locação via API...', { orcamentoId, enderecoEntrega });
    this.locacaoService.createLocacaoFromOrcamento(orcamentoId, enderecoEntrega).subscribe({
      next: async (response) => {
        console.log('Locação criada com sucesso:', response);
        
        // Recarregar dados
        this.loadData();
        
        // Fechar modal do orçamento
        this.closeViewModal();
        
        // Aguardar um pouco para os dados serem carregados
        setTimeout(async () => {
          // Buscar a locação criada
          const locacaoCriada = this.locacoes.find(l => l.orcamento_id === orcamentoId);
          
          if (locacaoCriada) {
            // Gerar contrato e recibo automaticamente
            try {
              // Gerar contrato
              const contratoHtml = this.printableService.generateContratoHTML(locacaoCriada);
              const contratoFilename = `contrato_${locacaoCriada.id}_${new Date().toISOString().split('T')[0]}`;
              this.printableService.exportToPDF(contratoHtml, contratoFilename);

              // Gerar recibo
              const reciboHtml = this.printableService.generateReciboHTML(locacaoCriada);
              const reciboFilename = `recibo_${locacaoCriada.id}_${new Date().toISOString().split('T')[0]}`;
              this.printableService.exportToPDF(reciboHtml, reciboFilename);

              alert('Locação criada com sucesso! Contrato e recibo foram gerados automaticamente. Redirecionando para a página de locações...');
              
              // Definir estado para abrir modal da locação
              this.navigationService.setNavigationState({
                shouldOpenLocacaoModal: true,
                locacaoId: locacaoCriada.id
              });
              
              // Redirecionar para a página de locações
              this.router.navigate(['/locacoes']);
            } catch (error) {
              console.error('Erro ao gerar documentos:', error);
              alert('Locação criada com sucesso, mas houve erro ao gerar os documentos. Redirecionando para a página de locações...');
              this.router.navigate(['/locacoes']);
            }
          } else {
            alert('Locação criada com sucesso! Redirecionando para a página de locações...');
            this.router.navigate(['/locacoes']);
          }
        }, 1000);
      },
      error: (error) => {
        console.error('Erro ao criar locação:', error);
        console.error('Detalhes do erro:', {
          status: error?.status,
          message: error?.message,
          error: error?.error
        });
        
        // Reabrir o dialog em caso de erro
        if (orcamentoId) {
          this.orcamentoIdParaLocacao = orcamentoId;
          this.enderecoEntrega = enderecoEntrega || '';
          this.showEnderecoDialog = true;
        }
        
        let errorMessage = 'Erro ao criar locação, tente novamente';
        if (error?.error?.detail) {
          errorMessage = error.error.detail;
        } else if (error?.message) {
          errorMessage = error.message;
        }
        
        // Mensagens mais amigáveis
        if (errorMessage.includes('Já existe uma locação')) {
          errorMessage = 'Este orçamento já possui uma locação criada. Verifique a lista de locações.';
          this.showEnderecoDialog = false; // Não reabrir se já existe locação
        } else if (errorMessage.includes('Orçamento não encontrado')) {
          errorMessage = 'Orçamento não encontrado. Recarregue a página e tente novamente.';
        } else if (errorMessage.includes('Apenas orçamentos aprovados')) {
          errorMessage = 'Apenas orçamentos aprovados podem gerar locações. Aprove o orçamento primeiro.';
        }
        
        alert(errorMessage);
      }
    });
  }

  hasLocacaoForOrcamento(orcamentoId: number | undefined): boolean {
    if (!orcamentoId) return false;
    return this.locacoes.some(locacao => locacao.orcamento_id === orcamentoId);
  }

  irParaLocacoes() {
    this.closeViewModal();
    this.router.navigate(['/locacoes']);
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



  // Exportar orçamento como PDF usando template personalizado
  exportToOrcamentoPDF() {
    if (!this.selectedOrcamento) {
      alert('Nenhum orçamento selecionado');
      return;
    }

    try {
      const html = this.printableService.generateOrcamentoHTML(this.selectedOrcamento);
      const filename = `orcamento_${this.selectedOrcamento.id}_${new Date().toISOString().split('T')[0]}`;
      this.printableService.exportToPDF(html, filename);
    } catch (error) {
      console.error('Erro ao exportar orçamento:', error);
      alert('Erro ao exportar orçamento. Tente novamente.');
    }
  }

  // Exportar contrato como PDF usando template personalizado
  exportToContratoPDF() {
    if (!this.selectedOrcamento) {
      alert('Nenhum orçamento selecionado');
      return;
    }

    try {
      // Criar uma locação temporária baseada no orçamento para gerar os documentos
      const locacaoTemp: any = {
        ...this.selectedOrcamento,
        cliente: this.selectedOrcamento.cliente,
        itens: this.selectedOrcamento.itens
      };

      // Gerar contrato
      const contratoHtml = this.printableService.generateContratoHTML(locacaoTemp);
      const contratoFilename = `contrato_${this.selectedOrcamento.id}_${new Date().toISOString().split('T')[0]}`;
      this.printableService.exportToPDF(contratoHtml, contratoFilename);

      // Gerar recibo
      const reciboHtml = this.printableService.generateReciboHTML(locacaoTemp);
      const reciboFilename = `recibo_${this.selectedOrcamento.id}_${new Date().toISOString().split('T')[0]}`;
      this.printableService.exportToPDF(reciboHtml, reciboFilename);

      alert('Contrato e recibo gerados com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar documentos:', error);
      alert('Erro ao exportar documentos. Tente novamente.');
    }
  }

  // Método antigo mantido para compatibilidade
  async exportToPDF() {
    if (!this.selectedOrcamento) {
      console.error('Nenhum orçamento selecionado');
      return;
    }

    try {
      // Criar PDF usando jsPDF diretamente
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });
      
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
          addText(this.getTipoCobrancaLabel(item.tipo_cobranca), colPositions[3], yPosition, 8);
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