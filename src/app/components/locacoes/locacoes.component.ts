import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CurrencyBrPipe } from '../../pipes/currency-br.pipe';
import { LocacaoService } from '../../services/locacao.service';
import { EquipamentoService } from '../../services/equipamento.service';
import { PrintableService } from '../../services/printable.service';
import { NavigationService } from '../../services/navigation.service';
import { Locacao, Equipamento } from '../../models/index';

import { Router } from '@angular/router';
import { WhatsappService } from '../../services/whatsapp.service';
import { SnackbarService } from '../../services/snackbar.service';
import { AuthService } from '../../services/auth.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../shared/confirm-dialog/confirm-dialog.component';
import { DocumentViewerComponent, ViewerDocument, ViewerAction } from '../shared/document-viewer/document-viewer.component';

@Component({
  selector: 'app-locacoes',
  standalone: true,
  imports: [CommonModule, CurrencyBrPipe, FormsModule, MatDialogModule, DocumentViewerComponent],
  template: `
    <div class="locacoes">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Gestão de Locações</h2>
        </div>

        <!-- Locações List -->
        <div class="table-section">
          <div class="filters-container">
            <div class="filters">
              <button class="filter-btn" (click)="filterStatus = ''" [class.active]="filterStatus === ''">
                Todas
              </button>
              <button class="filter-btn" (click)="filterStatus = 'ativa'" [class.active]="filterStatus === 'ativa'">
                Ativas
              </button>
              <button class="filter-btn" (click)="filterStatus = 'finalizada'" [class.active]="filterStatus === 'finalizada'">
                Finalizadas
              </button>
              <button class="filter-btn" (click)="filterStatus = 'atrasada'" [class.active]="filterStatus === 'atrasada'">
                Atrasadas
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
                  <span class="badge badge-info" *ngIf="locacao.locacao_original_id" style="margin-left: 5px; font-size: 0.65rem;">
                    (RENOVADA)
                  </span>
                  <span class="badge badge-secondary" *ngIf="foiRenovada(locacao)" style="margin-left: 5px; font-size: 0.65rem;">
                    (RENOVOU)
                  </span>
                </td>
                <td data-label="Data Devolução">{{ locacao.data_devolucao ? (locacao.data_devolucao | date:'dd/MM/yyyy') : '-' }}</td>
                <td data-label="Ações">
                  <div class="action-buttons">
                    <button class="action-btn approve" (click)="finalizarLocacao(locacao.id)" 
                            *ngIf="locacao.status === 'ativa'" title="Finalizar Locação">
                      Finalizar
                    </button>
                    <button class="action-btn receive" (click)="irParaRecebimento(locacao.id)" 
                            *ngIf="locacao.status === 'ativa'" title="Receber/Devolver Itens">
                      Receber
                    </button>
                    <button class="action-btn reject" (click)="cancelarLocacao(locacao.id)" 
                            *ngIf="locacao.status === 'ativa'" title="Cancelar Locação">
                      Cancelar
                    </button>
                    <button class="action-btn view" (click)="viewLocacao(locacao)" title="Visualizar Detalhes">
                      Ver
                    </button>
                    <button class="action-btn" style="background: linear-gradient(135deg, #17a2b8 0%, #138496 100%); color: white;" 
                            (click)="openRenewModal(locacao)" *ngIf="canRenew(locacao)" title="Renovar Locação">
                      Renovar
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal de Confirmação de Cancelamento -->
    <div class="modal-overlay" *ngIf="showCancelModal" (click)="closeCancelModal()">
      <div class="modal-content confirm-modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Confirmar Cancelamento</h3>
          <button class="modal-close" (click)="closeCancelModal()">×</button>
        </div>
        <div class="modal-body">
          <div class="confirm-warning">
            <p><strong>⚠️ Atenção!</strong></p>
            <p>Você está prestes a cancelar a locação <strong>#{{ locacaoToCancel?.id }}</strong>.</p>
            <p>Esta ação não pode ser desfeita.</p>
          </div>
          <div class="confirm-input-section">
            <label for="confirm-text">Digite <strong>"cancelar"</strong> para confirmar:</label>
            <input 
              type="text" 
              id="confirm-text"
              [(ngModel)]="confirmText" 
              (input)="onConfirmTextChange()"
              placeholder="Digite 'cancelar' aqui"
              class="form-control confirm-input"
              autocomplete="off">
            <p class="confirm-hint" *ngIf="confirmText && !isConfirmTextValid">
              O texto digitado não corresponde. Digite exatamente "cancelar".
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeCancelModal()">
            Voltar
          </button>
          <button 
            class="btn btn-danger" 
            (click)="confirmCancelLocacao()"
            [disabled]="!isConfirmTextValid">
            Confirmar Cancelamento
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Visualização de Locação -->
    <div class="modal-overlay" *ngIf="showViewModal" (click)="closeViewModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Locação #{{ selectedLocacao?.id }}</h3>
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
            <div class="info-row" *ngIf="selectedLocacao">
              <strong>Assinatura Realizada:</strong>
              <button class="btn btn-sm btn-outline-secondary" style="margin-left: 10px; padding: 2px 8px; font-size: 12px;" (click)="toggleAssinatura(selectedLocacao)">
                <i class="fas" [ngClass]="selectedLocacao.assinatura_realizada ? 'fa-undo' : 'fa-check'"></i>
                {{ selectedLocacao.assinatura_realizada ? 'Marcar Pendente' : 'Marcar Papel Assinado' }}
              </button>
              <span class="badge" [ngClass]="selectedLocacao.assinatura_realizada ? 'badge-ativa' : 'badge-cancelada'">
                <i class="fas" [ngClass]="selectedLocacao.assinatura_realizada ? 'fa-check-circle' : 'fa-times-circle'"></i>
                {{ selectedLocacao.assinatura_realizada ? 'Sim' : 'Não' }}
              </span>
            </div>
            <div class="info-row" *ngIf="selectedLocacao?.observacoes">
              <strong>Observações:</strong> {{ selectedLocacao?.observacoes }}
            </div>
          </div>

          <div class="itens-section">
            <h4>Itens da Locação</h4>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Equipamento</th>
                  <th>Quantidade</th>
                  <th>Dias</th>
                  <th>Dt. Início</th>
                  <th>Dt. Fim</th>
                  <th>Preço Unitário</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of selectedLocacao?.itens">
                  <td>{{ getEquipamentoDescricao(item.equipamento_id) }}</td>
                  <td>{{ item.quantidade }}</td>
                  <td>{{ item.dias }}</td>
                  <td>{{ item.data_inicio ? (item.data_inicio | date:'dd/MM/yyyy') : '-' }}</td>
                  <td>{{ item.data_fim ? (item.data_fim | date:'dd/MM/yyyy') : '-' }}</td>
                  <td>{{ item.preco_unitario | currencyBr }}</td>
                  <td>{{ item.subtotal | currencyBr }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="totals-section">
            <div class="total-row">
              <strong>Subtotal:</strong> {{ getLocacaoSubtotal(selectedLocacao) | currencyBr }}
            </div>
            <div class="total-row" *ngIf="(selectedLocacao?.orcamento?.desconto ?? 0) > 0">
              <strong>Desconto:</strong> {{ selectedLocacao?.orcamento?.desconto | currencyBr }}
            </div>
            <div class="total-row" *ngIf="(selectedLocacao?.frete ?? 0) > 0">
              <strong>Frete/Adicional:</strong> {{ selectedLocacao?.frete | currencyBr }}
            </div>
            <div class="total-row final-total">
              <strong>Total Final:</strong> {{ selectedLocacao?.total_final | currencyBr }}
            </div>
          </div>

          <div class="whatsapp-buttons" style="margin-top: 10px; display: flex; gap: 10px; justify-content: flex-end; width: 100%; align-items: center;">
            <span *ngIf="whatsappStatus" style="font-size: 13px; color: #666;">{{ whatsappStatus }}</span>
            <button class="btn btn-info" (click)="openDocumentViewer('view')">
              <i class="fas fa-file-pdf"></i> Ver Documentos
            </button>
            <button class="btn" [ngClass]="selectedLocacao?.assinatura_realizada ? 'btn-secondary' : 'btn-warning'" (click)="openDocumentViewer('sign')">
              <i class="fas fa-signature"></i> {{ selectedLocacao?.assinatura_realizada ? 'Refazer Assinatura' : 'Assinar Contrato' }}
            </button>
            <button type="button" class="btn btn-success" (click)="sendReciboWhatsapp()" [disabled]="isSendingWhatsapp">
              <i class="fab fa-whatsapp"></i> {{ isSendingWhatsapp ? '...' : 'WhatsApp Recibo' }}
            </button>
            <button type="button" class="btn btn-success" (click)="sendContratoWhatsapp()" [disabled]="isSendingWhatsapp">
              <i class="fab fa-whatsapp"></i> {{ isSendingWhatsapp ? '...' : 'WhatsApp Contrato' }}
            </button>
          </div>
        </div>

        <div class="modal-footer" [ngStyle]="{'justify-content': (selectedLocacao && (foiRenovada(selectedLocacao) || selectedLocacao.locacao_original_id)) ? 'space-between' : 'flex-end'}">
          <div *ngIf="selectedLocacao && (foiRenovada(selectedLocacao) || selectedLocacao.locacao_original_id)" style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
             <ng-container *ngIf="foiRenovada(selectedLocacao)">
                 <span style="color: #dc3545; font-weight: bold; font-size: 0.9rem;">⚠️ LOCAÇÃO RENOVADA</span>
                 <button class="btn btn-info btn-sm" (click)="viewRenovacao(selectedLocacao)">
                    Ver Nova
                 </button>
             </ng-container>
             <ng-container *ngIf="selectedLocacao.locacao_original_id">
                 <span style="color: #17a2b8; font-weight: bold; font-size: 0.9rem;">ℹ️ ORIGINADA DE RENOVAÇÃO</span>
                 <button class="btn btn-secondary btn-sm" (click)="viewLocacaoAnterior(selectedLocacao)">
                    Ver Anterior
                 </button>
             </ng-container>
          </div>
          <button class="btn btn-secondary" (click)="closeViewModal()">
            Fechar
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Renovação de Locação -->
    <div class="modal-overlay" *ngIf="showRenewModal" (click)="closeRenewModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Renovar Locação #{{ renewLocacao?.id }}</h3>
          <button class="modal-close" (click)="closeRenewModal()">×</button>
        </div>
        
        <div class="modal-body">
          <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 200px;">
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Data de Início do Novo Contrato</label>
              <input type="date" class="form-control" style="width: 100%; padding: 0.75rem; border: 1px solid #ced4da; border-radius: 8px;" [(ngModel)]="renewRequest.data_inicio" (ngModelChange)="recalcularTodosItens()" [min]="renewMinDate">
            </div>
            <div style="flex: 1; min-width: 200px;">
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Data de Fim (Geral)</label>
              <input type="date" class="form-control" style="width: 100%; padding: 0.75rem; border: 1px solid #ced4da; border-radius: 8px;" [(ngModel)]="renewRequest.data_fim" (ngModelChange)="onGlobalDateFimChange($event)" [min]="renewRequest.data_inicio">
            </div>
          </div>
          
          <div class="itens-section">
            <h4>Itens a serem renovados</h4>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Equipamento</th>
                  <th>Cobrança</th>
                  <th>Data de Fim (Específica)</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of renewRequest.itens">
                  <td>{{ item.descricao }}</td>
                  <td>
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                      <select class="form-control" style="padding: 0.5rem; border: 1px solid #ced4da; border-radius: 8px; width: 110px;" 
                              [(ngModel)]="item.tipo_cobranca" (ngModelChange)="recalcularItem(item)">
                        <option value="diaria">Diária</option>
                        <option value="semanal">Semanal</option>
                        <option value="quinzenal">Quinzenal</option>
                        <option value="mensal">Mensal</option>
                      </select>
                      <small style="color: #6c757d; font-weight: bold;">Val: {{ item.preco_unitario | currencyBr }}</small>
                    </div>
                  </td>
                  <td>
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                      <input type="date" class="form-control" style="padding: 0.5rem; border: 1px solid #ced4da; border-radius: 8px;" 
                             [(ngModel)]="item.data_fim" (ngModelChange)="onItemDateFimChange(item, $event)" [min]="renewRequest.data_inicio">
                      <small *ngIf="!item.data_fim && renewRequest.data_fim" style="color: #6c757d; font-size: 0.75rem;">
                        (Geral: {{ renewRequest.data_fim | date:'dd/MM/yyyy' : 'UTC' }})
                      </small>
                    </div>
                  </td>
                  <td><strong>{{ item.subtotal | currencyBr }}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1.5rem;">
            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
              <div class="form-group" style="flex: 1; min-width: 200px;">
                <label for="renewDesconto" style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Desconto (%) - Opcional</label>
                <input type="number" id="renewDesconto" name="renewDesconto" 
                       [(ngModel)]="renewDescontoPorcentagem" min="0" max="100" step="0.1"
                       (ngModelChange)="onRenewDescontoPercentualChange()"
                       class="form-control" style="border: 1px solid #ced4da; border-radius: 8px; padding: 0.75rem;" placeholder="0.0%">
                <small *ngIf="renewRequest.desconto > 0" style="color: #6c757d; font-size: 0.85rem; display: block; margin-top: 0.25rem;">
                  Valor: {{ renewRequest.desconto | currencyBr }}
                </small>
              </div>
              
              <div class="form-group" style="flex: 1; min-width: 200px;">
                <label for="renewFrete" style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Frete / Adicionais - Opcional</label>
                <div class="input-group">
                  <span class="input-group-text">R$</span>
                  <input type="number" id="renewFrete" name="renewFrete" 
                         [(ngModel)]="renewRequest.frete" min="0" step="0.01"
                         class="form-control" style="border: 1px solid #ced4da; border-radius: 0 8px 8px 0; padding: 0.75rem;" placeholder="0,00">
                </div>
              </div>
            </div>

            <div class="form-group total-preview" style="width: 100%;">
              <label style="font-weight: 600; display: block; margin-bottom: 0.5rem; color: #495057;">Resumo Financeiro</label>
              <div class="total-breakdown" style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: white; padding: 1.5rem; border-radius: 12px; border: 1px solid #334155; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);">
                <div class="total-line" style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1); font-size: 0.95rem;">
                  <span style="color: #cbd5e1;">Subtotal dos Itens:</span>
                  <strong>{{ getRenewSubtotal() | currencyBr }}</strong>
                </div>
                <div class="total-line" *ngIf="renewRequest.desconto > 0" style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1); font-size: 0.95rem;">
                  <span style="color: #cbd5e1;">Desconto:</span>
                  <strong style="color: #f87171 !important;">- {{ renewRequest.desconto | currencyBr }}</strong>
                </div>
                <div class="total-line" *ngIf="renewRequest.frete > 0" style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1); font-size: 0.95rem;">
                  <span style="color: #cbd5e1;">Frete / Adicionais:</span>
                  <strong style="color: #4ade80 !important;">+ {{ renewRequest.frete | currencyBr }}</strong>
                </div>
                <div class="total-line total-final" style="display: flex; justify-content: space-between; align-items: center; font-size: 1.2rem; font-weight: 700; color: #38bdf8; margin-top: 0.5rem; padding-top: 1rem; border-top: 2px solid #38bdf8;">
                  <span>Total Final:</span>
                  <strong>{{ (getRenewSubtotal() - (renewRequest.desconto || 0) + (renewRequest.frete || 0)) | currencyBr }}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.75rem;">
          <button class="btn btn-secondary" style="font-weight: 600;" (click)="closeRenewModal()">Cancelar</button>
          <button class="btn btn-success" style="font-weight: 600;" (click)="confirmRenew()">Confirmar Renovação</button>
        </div>
      </div>
    </div>

    <!-- Modal de Senha para Desconto Renovação -->
    <div class="modal-overlay" *ngIf="showRenewDiscountModal">
      <div class="modal-content auth-modal">
        <div class="modal-header">
          <h3>Autorizar Desconto (Renovação)</h3>
          <button class="modal-close" (click)="closeRenewDiscountModal()">×</button>
        </div>
        
        <div class="modal-body auth-body">
          <div class="form-group">
            <label>Ao digitar a senha e confirmar, o desconto de <strong>{{ pendingRenewDiscountPercentage }}%</strong> será autorizado.</label>
          </div>
          
          <p class="mt-3" style="text-align: right; color: #dc3545; font-weight: bold;" *ngIf="pendingRenewDiscountPercentage > 0">
             Valor do desconto: {{ ((getRenewSubtotal() * pendingRenewDiscountPercentage) / 100) | currencyBr }}
          </p>

          <ng-container>
             <div class="alert alert-warning mt-3">
               O desconto solicitado é de <strong>{{ pendingRenewDiscountPercentage }}%</strong>, o que é maior que 10%. Digite a senha para autorizar.
             </div>
             
             <div class="form-group">
               <label>Senha de Autorização</label>
               <input type="password" class="form-control" [(ngModel)]="renewDiscountPassword">
             </div>
          </ng-container>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeRenewDiscountModal()">Cancelar</button>
          <button class="btn btn-primary" (click)="confirmRenewDiscount()">Confirmar Desconto</button>
        </div>
      </div>
    </div>

    <!-- Document Viewer -->
    <app-document-viewer
      *ngIf="showDocumentViewer"
      [documents]="viewerDocuments"
      [mode]="viewerMode"
      [locadoraSignature]="locadoraSignature"
      (closeViewer)="closeDocumentViewer()"
      (onAction)="handleViewerAction($event)">
    </app-document-viewer>
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
      background: linear-gradient(135deg, #e0a800 0%, #d39e00 100%);
      border-color: rgba(0, 0, 0, 0.1);
    }

    .action-btn.receive {
      background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
      color: white;
      border: 2px solid transparent;
    }

    .action-btn.receive:hover {
      background: linear-gradient(135deg, #138496 0%, #117a8b 100%);
      border-color: rgba(255, 255, 255, 0.3);
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
      padding: 1rem;
      overscroll-behavior: contain;
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
        flex-wrap: wrap;
      }

      .action-btn {
        padding: 0.5rem 1rem;
        font-size: 0.75rem;
        width: auto;
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
      .filters {
        flex-direction: column;
        align-items: center;
      }

      .filter-btn {
        width: 100%;
        max-width: 200px;
      }
    }

    /* Modal de Confirmação */
    .confirm-modal {
      max-width: 500px;
    }

    .confirm-warning {
      background: #fff3cd;
      border: 2px solid #ffc107;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .confirm-warning p {
      margin: 0.5rem 0;
      color: #856404;
      font-size: 0.9375rem;
    }

    .confirm-warning p:first-child {
      font-size: 1.0625rem;
      font-weight: 600;
    }

    .confirm-input-section {
      margin-top: 1.5rem;
    }

    .confirm-input-section label {
      display: block;
      margin-bottom: 0.75rem;
      font-weight: 600;
      color: #374151;
      font-size: 0.9375rem;
    }

    .confirm-input {
      width: 100%;
      padding: 0.9375rem 1.25rem;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      font-size: 1rem;
      transition: all 0.25s ease;
      box-sizing: border-box;
    }

    .confirm-input:focus {
      outline: none;
      border-color: #dc3545;
      box-shadow: 0 0 0 4px rgba(220, 53, 69, 0.15);
    }

    .confirm-input:invalid,
    .confirm-input.error {
      border-color: #dc3545;
    }

    .confirm-hint {
      margin-top: 0.5rem;
      font-size: 0.875rem;
      color: #dc3545;
      font-weight: 500;
    }

    .modal-footer {
      display: flex;
      gap: 1rem;
      padding: 1.5rem 2rem;
      border-top: 1px solid #e5e7eb;
      justify-content: flex-end;
      flex-shrink: 0;
    }

    .modal-footer .btn {
      min-width: 120px;
    }

    @media (max-width: 768px) {
      .confirm-modal {
        max-width: 95vw;
      }

      .modal-footer {
        flex-direction: column;
        padding: 1rem;
      }

      .modal-footer .btn {
        width: 100%;
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
  showCancelModal = false;
  locacaoToCancel: Locacao | null = null;
  confirmText = '';
  isConfirmTextValid = false;

  showRenewModal = false;
  renewLocacao: Locacao | null = null;
  renewMinDate: string = '';
  renewRequest: any = {
    data_inicio: '',
    data_fim: '',
    itens: [],
    desconto_percentual: 0,
    desconto: 0,
    frete: 0
  };

  showRenewDiscountModal = false;
  pendingRenewDiscountPercentage = 0;
  renewDiscountPassword = '';
  renewDescontoPorcentagem: number = 0;

  showDocumentViewer = false;
  viewerDocuments: ViewerDocument[] = [];
  viewerMode: 'view' | 'sign' = 'view';
  locadoraSignature: string = '';

  constructor(
    private router: Router,
    private locacaoService: LocacaoService,
    private equipamentoService: EquipamentoService,
    private printableService: PrintableService,
    private navigationService: NavigationService,
    private whatsappService: WhatsappService,
    private snackbarService: SnackbarService,
    private authService: AuthService,
    private dialog: MatDialog
  ) { }

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
            if (state.shouldOpenDocumentViewer) {
              this.openDocumentViewer('view');
            }
          }
          // Limpar o estado
          this.navigationService.clearNavigationState();
        }, 500);
      }
    });
  }

  loadData() {
    this.locacaoService.getLocacoes().subscribe({
      next: (locacoes) => {
        this.locacoes = locacoes || [];
        console.log('Locações carregadas:', this.locacoes.length);
      },
      error: (error) => {
        console.error('Erro ao carregar locações:', error);
        this.locacoes = [];
      }
    });

    this.equipamentoService.getEquipamentos().subscribe({
      next: (equipamentos) => {
        this.equipamentos = equipamentos || [];
        this.printableService.setEquipamentos(this.equipamentos);
      },
      error: (error) => {
        console.error('Erro ao carregar equipamentos:', error);
        this.equipamentos = [];
      }
    });
  }

  get filteredLocacoes(): Locacao[] {
    if (!this.filterStatus) {
      return this.locacoes;
    }
    return this.locacoes.filter(locacao => locacao.status === this.filterStatus);
  }



  finalizarLocacao(id: number) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Finalizar Locação',
        message: 'Tem certeza que deseja finalizar esta locação?',
        confirmText: 'Finalizar',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.locacaoService.finalizarLocacao(id).subscribe(() => {
          this.loadData();
          this.snackbarService.success('Locação finalizada com sucesso!');
        });
      }
    });
  }

  cancelarLocacao(id: number) {
    const locacao = this.locacoes.find(l => l.id === id);
    if (locacao) {
      this.locacaoToCancel = locacao;
      this.showCancelModal = true;
      this.confirmText = '';
      this.isConfirmTextValid = false;
    }
  }

  closeCancelModal() {
    this.showCancelModal = false;
    this.locacaoToCancel = null;
    this.confirmText = '';
    this.isConfirmTextValid = false;
  }

  onConfirmTextChange() {
    this.isConfirmTextValid = this.confirmText.toLowerCase().trim() === 'cancelar';
  }

  confirmCancelLocacao() {
    if (!this.isConfirmTextValid || !this.locacaoToCancel) {
      return;
    }

    this.locacaoService.cancelarLocacao(this.locacaoToCancel.id).subscribe({
      next: () => {
        this.loadData();
        this.closeCancelModal();
        this.snackbarService.success('Locação cancelada com sucesso!');
      },
      error: (error) => {
        console.error('Erro ao cancelar locação:', error);
        this.snackbarService.error('Erro ao cancelar locação. Tente novamente.');
      }
    });
  }

  viewLocacao(locacao: Locacao) {
    this.selectedLocacao = locacao;
    this.showViewModal = true;
  }

  canRenew(locacao: Locacao): boolean {
    return ['ativa', 'finalizada', 'atrasada'].includes(locacao.status.toLowerCase()) && !this.foiRenovada(locacao);
  }

  foiRenovada(locacao: Locacao): boolean {
    return this.locacoes.some(l => l.locacao_original_id === locacao.id);
  }

  openRenewModal(locacao: Locacao) {
    this.renewLocacao = locacao;

    // Default to today or locacao end date
    const today = new Date().toISOString().split('T')[0];
    const oldEnd = locacao.data_fim ? locacao.data_fim.split('T')[0] : today;
    const start = oldEnd >= today ? oldEnd : today;

    this.renewMinDate = oldEnd;

    this.renewRequest = {
      data_inicio: start,
      data_fim: '',
      itens: locacao.itens.map(item => {
        // Try to infer billing type from original if price matches, or default to monthly
        const equipamento = this.equipamentos.find(e => e.id === item.equipamento_id);
        let tipoCobranca: 'diaria' | 'semanal' | 'quinzenal' | 'mensal' = 'mensal';
        if (equipamento) {
          if (item.preco_unitario === equipamento.preco_diaria) tipoCobranca = 'diaria';
          else if (item.preco_unitario === equipamento.preco_semanal) tipoCobranca = 'semanal';
          else if (item.preco_unitario === equipamento.preco_quinzenal) tipoCobranca = 'quinzenal';
          else if (item.preco_unitario === equipamento.preco_mensal) tipoCobranca = 'mensal';
        }

        return {
          equipamento_id: item.equipamento_id,
          descricao: this.getEquipamentoDescricao(item.equipamento_id),
          data_fim: '', // will be set by user or default
          quantidade: item.quantidade,
          tipo_cobranca: tipoCobranca,
          preco_unitario: item.preco_unitario,
          subtotal: 0
        };
      })
    };
    this.renewRequest.desconto = 0;
    this.renewRequest.desconto_percentual = 0;
    this.renewRequest.frete = 0;
    this.renewDescontoPorcentagem = 0;
    this.showRenewModal = true;
  }

  recalcularItem(item: any) {
    if (!this.renewRequest.data_inicio) return;

    // Fallback pra data final geral se a específica não estiver preenchida
    const dataFim = item.data_fim || this.renewRequest.data_fim;
    if (!dataFim) {
      item.subtotal = 0;
      return;
    }

    // Obter preço base do equipamento
    const equipamento = this.equipamentos.find(e => e.id === item.equipamento_id);
    if (equipamento) {
      switch (item.tipo_cobranca) {
        case 'diaria': item.preco_unitario = equipamento.preco_diaria; break;
        case 'semanal': item.preco_unitario = equipamento.preco_semanal; break;
        case 'quinzenal': item.preco_unitario = equipamento.preco_quinzenal; break;
        case 'mensal': item.preco_unitario = equipamento.preco_mensal; break;
      }
    }

    // Calcular dias (no mínimo 1)
    const d1 = new Date(this.renewRequest.data_inicio);
    const d2 = new Date(dataFim);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    let dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (dias < 1) dias = 1;

    // A lógica de negócio original calcula proporção conforme o tipo de cobrança, vamos simplificar estimando de forma linear baseado no tipo, ou melhor ainda, 
    // a aproximação padrão que a pessoa inseriu no sistema. O backend irá recalcular baseado nos dias exatos de qualquer forma.
    let basePeriodo = 30;
    if (item.tipo_cobranca === 'diaria') basePeriodo = 1;
    if (item.tipo_cobranca === 'semanal') basePeriodo = 7;
    if (item.tipo_cobranca === 'quinzenal') basePeriodo = 15;

    const fator = Number((dias / basePeriodo).toFixed(2)) || Math.ceil(dias / basePeriodo);
    item.subtotal = item.preco_unitario * Math.max(1, Math.ceil(fator)) * item.quantidade;
  }

  onGlobalDateFimChange(newDate: string) {
    if (!newDate) return;
    const maxItemDate = this.getMaxItemDate();
    if (maxItemDate && newDate < maxItemDate) {
      setTimeout(() => { this.renewRequest.data_fim = maxItemDate; this.recalcularTodosItens(); });
    } else {
      this.recalcularTodosItens();
    }
  }

  onItemDateFimChange(item: any, newDate: string) {
    if (newDate && (!this.renewRequest.data_fim || newDate > this.renewRequest.data_fim)) {
      setTimeout(() => { this.renewRequest.data_fim = newDate; this.recalcularTodosItens(); });
    } else {
      this.recalcularItem(item);
    }
  }

  recalcularTodosItens() {
    this.renewRequest.itens.forEach((item: any) => this.recalcularItem(item));
    this.recalcularDescontoRenew();
  }

  getRenewSubtotal(): number {
    if (!this.renewRequest || !this.renewRequest.itens) return 0;
    return this.renewRequest.itens.reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0);
  }

  recalcularDescontoRenew() {
    const subtotal = this.getRenewSubtotal();
    this.renewRequest.desconto = (subtotal * this.renewRequest.desconto_percentual) / 100;
  }

  onRenewDescontoPercentualChange() {
    if (this.renewDescontoPorcentagem < 0) this.renewDescontoPorcentagem = 0;
    if (this.renewDescontoPorcentagem > 100) this.renewDescontoPorcentagem = 100;

    const subtotal = this.getRenewSubtotal();
    const proposedValue = (subtotal * this.renewDescontoPorcentagem) / 100;

    if (this.renewDescontoPorcentagem > 10) {
      this.pendingRenewDiscountPercentage = this.renewDescontoPorcentagem;
      // Revert the input briefly until authorized
      setTimeout(() => {
        this.renewDescontoPorcentagem = this.renewRequest.desconto_percentual || 0;
      });
      this.renewDiscountPassword = '';
      this.showRenewDiscountModal = true;
    } else {
      this.renewRequest.desconto_percentual = this.renewDescontoPorcentagem;
      this.renewRequest.desconto = proposedValue;
    }
  }

  closeRenewDiscountModal() {
    this.showRenewDiscountModal = false;
    this.renewDiscountPassword = '';
  }

  onPendingRenewDiscountChange() {
    if (this.pendingRenewDiscountPercentage < 0) this.pendingRenewDiscountPercentage = 0;
    if (this.pendingRenewDiscountPercentage > 100) this.pendingRenewDiscountPercentage = 100;
  }

  confirmRenewDiscount() {
    if (this.pendingRenewDiscountPercentage > 10) {
      if (!this.renewDiscountPassword) {
        this.snackbarService.error('Senha de autorização é obrigatória para descontos acima de 10%');
        return;
      }

      const isValid = this.authService.verifyDiscountPassword(this.renewDiscountPassword);
      if (isValid) {
        this.aplicarDescontoRenew();
      } else {
        this.snackbarService.error('Senha de autorização incorreta');
      }
    } else {
      this.aplicarDescontoRenew();
    }
  }

  aplicarDescontoRenew() {
    this.renewRequest.desconto_percentual = this.pendingRenewDiscountPercentage;
    this.renewDescontoPorcentagem = this.pendingRenewDiscountPercentage;
    this.recalcularDescontoRenew();
    this.closeRenewDiscountModal();
    this.snackbarService.success('Desconto autorizado e aplicado com sucesso!');
  }

  getMaxItemDate(): string | null {
    let max = '';
    for (const item of this.renewRequest.itens) {
      if (item.data_fim && item.data_fim > max) {
        max = item.data_fim;
      }
    }
    return max || null;
  }

  closeRenewModal() {
    this.showRenewModal = false;
    this.renewLocacao = null;
  }

  confirmRenew() {
    if (!this.renewRequest.data_inicio || !this.renewRequest.data_fim) {
      this.snackbarService.error('Selecione data de início e fim do contrato.');
      return;
    }

    const total_final = this.getRenewSubtotal() - (this.renewRequest.desconto || 0) + (this.renewRequest.frete || 0);

    const payload = {
      data_inicio: this.renewRequest.data_inicio + 'T00:00:00',
      data_fim: this.renewRequest.data_fim + 'T23:59:59',
      desconto: this.renewRequest.desconto || 0,
      desconto_percentual: this.renewRequest.desconto_percentual || 0,
      frete: this.renewRequest.frete || 0,
      total_final: total_final,
      itens: this.renewRequest.itens.map((item: any) => ({
        equipamento_id: item.equipamento_id,
        data_fim: (item.data_fim || this.renewRequest.data_fim) + 'T23:59:59',
        tipo_cobranca: item.tipo_cobranca,
        preco_unitario: item.preco_unitario,
        subtotal: item.subtotal
      }))
    };

    this.locacaoService.renovarLocacao(this.renewLocacao!.id, payload).subscribe({
      next: (response) => {
        this.snackbarService.success('Locação renovada com sucesso!');
        this.closeRenewModal();
        this.loadData();

        if (response.locacao) {
          this.viewLocacao(response.locacao);
          setTimeout(() => {
            this.openDocumentViewer('view');
          }, 100);
        }
      },
      error: (err) => {
        console.error('Erro ao renovar locação:', err);
        this.snackbarService.error('Erro ao renovar locação.');
      }
    });
  }

  closeViewModal() {
    this.showViewModal = false;
    this.selectedLocacao = null;
  }

  viewRenovacao(locacao: Locacao) {
    const child = this.locacoes.find(l => l.locacao_original_id === locacao.id);
    if (child) {
      this.viewLocacao(child);
    } else {
      this.locacaoService.getRenovacoes(locacao.id).subscribe({
        next: (renovacoes) => {
          if (renovacoes && renovacoes.length > 0) {
            this.viewLocacao(renovacoes[0]);
          } else {
            this.snackbarService.error('Locação renovada não encontrada.');
          }
        },
        error: () => this.snackbarService.error('Erro ao buscar locação renovada.')
      });
    }
  }

  viewLocacaoAnterior(locacao: Locacao) {
    if (!locacao.locacao_original_id) return;
    const parent = this.locacoes.find(l => l.id === locacao.locacao_original_id);
    if (parent) {
      this.viewLocacao(parent);
    } else {
      this.locacaoService.getLocacao(locacao.locacao_original_id).subscribe({
        next: (res) => {
          if (res) this.viewLocacao(res);
        },
        error: () => this.snackbarService.error('Locação anterior não encontrada.')
      });
    }
  }

  getEquipamentoDescricao(equipamentoId: number): string {
    // Buscar a descrição do equipamento nos itens da locação selecionada ou na locação a ser renovada
    const locacao = this.selectedLocacao || this.renewLocacao;
    if (locacao?.itens) {
      const item = locacao.itens.find(i => i.equipamento_id === equipamentoId);
      if (item?.equipamento?.descricao) {
        return item.equipamento.descricao;
      }
    }

    // Fallback para a lista global de equipamentos
    const equipamento = this.equipamentos.find(e => e.id === equipamentoId);
    return equipamento?.descricao || 'Equipamento não encontrado';
  }

  getLocacaoSubtotal(locacao: Locacao | null): number {
    if (!locacao || !locacao.itens) {
      return 0;
    }
    return locacao.itens.reduce((sum, item) => sum + item.subtotal, 0);
  }



  // Exportar recibo como PDF
  exportToReciboPDF() {
    if (!this.selectedLocacao) {
      this.snackbarService.error('Nenhuma locação selecionada');
      return;
    }

    try {
      const html = this.printableService.generateReciboHTML(this.selectedLocacao);
      const filename = `recibo_${this.selectedLocacao.id}_${new Date().toISOString().split('T')[0]}`;
      this.printableService.exportToPDF(html, filename);
    } catch (error) {
      console.error('Erro ao exportar recibo:', error);
      this.snackbarService.error('Erro ao exportar recibo. Tente novamente.');
    }
  }



  // Exportar contrato como PDF
  exportToContratoPDF() {
    if (!this.selectedLocacao) {
      this.snackbarService.error('Nenhuma locação selecionada');
      return;
    }

    try {
      const html = this.printableService.generateContratoHTML(this.selectedLocacao);
      const filename = `contrato_${this.selectedLocacao.id}_${new Date().toISOString().split('T')[0]}`;
      this.printableService.exportToPDF(html, filename);
    } catch (error) {
      console.error('Erro ao exportar contrato:', error);
      this.snackbarService.error('Erro ao exportar contrato. Tente novamente.');
    }
  }

  openDocumentViewer(mode: 'view' | 'sign') {
    if (!this.selectedLocacao) return;

    this.viewerMode = mode;
    this.viewerDocuments = [];

    try {
      if (mode === 'view') {
        const contratoHtml = this.printableService.generateContratoHTML(this.selectedLocacao);
        this.viewerDocuments.push({
          id: 'contrato',
          title: 'Contrato',
          type: 'contrato',
          html: contratoHtml
        });

        const reciboHtml = this.printableService.generateReciboHTML(this.selectedLocacao);
        this.viewerDocuments.push({
          id: 'recibo',
          title: 'Recibo',
          type: 'recibo',
          html: reciboHtml
        });

        // Se houver orçamento, podemos incluir
        if (this.selectedLocacao.orcamento) {
          const orcamentoHtml = this.printableService.generateOrcamentoHTML(this.selectedLocacao.orcamento);
          this.viewerDocuments.push({
            id: 'orcamento',
            title: 'Orçamento',
            type: 'orcamento',
            html: orcamentoHtml
          });
        }

        // Se este contrato tiver sido renovado a partir de outro (é um filho), buscar o "Contrato Anterior"
        if (this.selectedLocacao.locacao_original_id) {
          this.locacaoService.getLocacao(this.selectedLocacao.locacao_original_id).subscribe({
            next: (parent) => {
              if (parent) {
                this.viewerDocuments = [...this.viewerDocuments, {
                  id: 'contrato_anterior_' + parent.id,
                  title: 'Contrato Anterior',
                  type: 'contrato',
                  html: this.printableService.generateContratoHTML(parent)
                }];
              }
            }
          });
        }

        // Buscar contratos renovados derivados deste (filhos)
        this.locacaoService.getRenovacoes(this.selectedLocacao.id).subscribe({
          next: (renovacoes) => {
            if (renovacoes.length > 0) {
              const novasAbas: ViewerDocument[] = renovacoes.map((renovacao, index) => ({
                id: 'renovacao_' + renovacao.id,
                title: 'Contrato Novo/Renovado (' + renovacao.id + ')',
                type: 'contrato',
                html: this.printableService.generateContratoHTML(renovacao)
              }));
              this.viewerDocuments = [...this.viewerDocuments, ...novasAbas];
            }
          }
        });
      } else if (mode === 'sign') {
        // Load locadora signature from config before opening
        this.whatsappService.getSignatureConfig().subscribe({
          next: (config) => {
            this.locadoraSignature = config?.assinatura_base64 || '';
            const contratoHtml = this.printableService.generateContratoHTML(this.selectedLocacao!);
            this.viewerDocuments.push({
              id: 'contrato',
              title: 'Contrato',
              type: 'contrato',
              html: contratoHtml
            });
            this.showDocumentViewer = true;
          },
          error: () => {
            this.locadoraSignature = '';
            const contratoHtml = this.printableService.generateContratoHTML(this.selectedLocacao!);
            this.viewerDocuments.push({
              id: 'contrato',
              title: 'Contrato',
              type: 'contrato',
              html: contratoHtml
            });
            this.showDocumentViewer = true;
          }
        });
        return; // Don't set showDocumentViewer here, wait for async
      }
      this.showDocumentViewer = true;
    } catch (error) {
      console.error('Erro ao gerar documentos para visualização:', error);
      this.snackbarService.error('Erro ao gerar documentos.');
    }
  }

  closeDocumentViewer() {
    this.showDocumentViewer = false;
    this.viewerDocuments = [];
  }

  handleViewerAction(event: ViewerAction) {
    if (event.action === 'download-pdf' && event.docHtml) {
      const docType = event.docType || 'documento';
      const filename = `${docType}_${this.selectedLocacao?.id || ''}_${new Date().toISOString().split('T')[0]}`;
      this.printableService.exportToPDF(event.docHtml, filename);
      return;
    }

    if (!this.selectedLocacao || !event.signature) return;

    const base64Signature = event.signature;

    // Primeiro salva na API
    this.locacaoService.updateAssinatura(this.selectedLocacao.id, {
      assinatura_realizada: true,
      assinatura_base64: base64Signature
    }).subscribe({
      next: (updatedLocacao) => {
        // Atualiza objeto local e gera HTML com nova assinatura salva
        this.selectedLocacao = updatedLocacao;

        // Agora o HTML gerado vai trazer a imagem Base64 da locação injetada de forma clean em cima da linha
        const signedHtml = this.printableService.generateContratoHTML(this.selectedLocacao!);

        if (event.action === 'whatsapp') {
          // Reusa pipeline do WhatsApp
          this.sendDocumentWhatsapp('contrato', signedHtml, true);
        } else if (event.action === 'download') {
          const filename = `contrato_assinado_${this.selectedLocacao!.id}_${new Date().toISOString().split('T')[0]}`;
          this.printableService.exportToPDF(signedHtml, filename);
        } else if ((event.action as any) === 'save') {
          this.snackbarService.success('Assinatura salva com sucesso!');
        }

        this.loadData();
      },
      error: (err) => {
        console.error('Erro ao salvar assinatura', err);
        this.snackbarService.error('Erro ao salvar assinatura permanentemente.');
      }
    });
  }

  irParaRecebimento(locacaoId: number) {
    this.router.navigate([`/recebimento/${locacaoId}`]);
  }

  toggleAssinatura(locacao: Locacao) {
    const newValue = !locacao.assinatura_realizada;
    this.locacaoService.updateAssinatura(locacao.id, {
      assinatura_realizada: newValue,
      assinatura_base64: locacao.assinatura_base64 || null // Keep existing
    }).subscribe({
      next: () => {
        locacao.assinatura_realizada = newValue;
        this.snackbarService.success(`Assinatura marcada como ${newValue ? 'Realizada' : 'Pendente'}`);
      },
      error: (err) => {
        console.error('Erro ao alternar assinatura', err);
        this.snackbarService.error('Erro ao atualizar status de assinatura.');
      }
    });
  }

  // Enviar Recibo via WhatsApp
  sendReciboWhatsapp() {
    this.sendDocumentWhatsapp('recibo');
  }

  // Enviar Contrato via WhatsApp
  sendContratoWhatsapp() {
    this.sendDocumentWhatsapp('contrato');
  }

  isSendingWhatsapp = false;
  whatsappStatus = '';

  private sendDocumentWhatsapp(type: 'recibo' | 'contrato', htmlOverride?: string, isSigned: boolean = false) {
    if (!this.selectedLocacao) return;
    if (this.isSendingWhatsapp) return;

    const clientPhone = this.selectedLocacao.cliente?.telefone_celular || this.selectedLocacao.cliente?.telefone_comercial;
    if (!clientPhone) {
      this.snackbarService.error('Cliente não possui telefone cadastrado.');
      return;
    }

    const docName = isSigned ? 'Contrato Assinado' : (type === 'recibo' ? 'Recibo' : 'Contrato');

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Enviar Whatsapp',
        message: `Deseja enviar o <b>${docName}</b> via WhatsApp para <b>${this.selectedLocacao.cliente.nome_razao_social}</b>?`,
        confirmText: 'Enviar'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      if (!this.selectedLocacao) return; // Fix TypeScript null check

      this.isSendingWhatsapp = true;
      this.whatsappStatus = 'Gerando PDF...';

      const isRecibo = type === 'recibo';
      const html = htmlOverride || (isRecibo
        ? this.printableService.generateReciboHTML(this.selectedLocacao)
        : this.printableService.generateContratoHTML(this.selectedLocacao));

      // Formatar data como DD-MM-AAAA para nome amigável
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yyyy = now.getFullYear();
      const dataFormatada = `${dd}-${mm}-${yyyy}`;

      const filenamePrefix = isSigned ? 'contrato_assinado' : type;
      const filename = `${filenamePrefix}-${dataFormatada}.pdf`;
      const caption = `${docName} da Locação #${this.selectedLocacao.id}`;

      // Limpar telefone (apenas números)
      let phone = clientPhone.replace(/\D/g, '');
      // Adicionar 55 se não tiver (assumindo BR)
      if (phone.length <= 11) {
        phone = '55' + phone;
      }

      this.printableService.generatePdfBlob(html).subscribe({
        next: (blob) => {
          this.whatsappStatus = 'Gerando anexo...';

          // O app.component já vai puxar isso, mas para ter certeza localmente no serviço de zap, pedimos de novo (ou faz da config)
          this.whatsappService.getUploadConfig().subscribe(uploadConf => {

            const _sendPipeline = (pdfUriOuUrl: string, usingBase64: boolean) => {
              this.whatsappStatus = 'Enviando saudação...';

              this.whatsappService.getTimezoneConfig().subscribe((tzConf) => {
                const timeZoneKey = tzConf.timezone || 'America/Manaus';
                const dateNow = new Date();
                const hourStr = new Intl.DateTimeFormat('pt-BR', { timeZone: timeZoneKey, hour: 'numeric', hourCycle: 'h23' }).format(dateNow);
                const hour = parseInt(hourStr, 10);

                let saudacaoTime = 'Olá';
                if (hour >= 5 && hour < 12) {
                  saudacaoTime = 'Bom dia';
                } else if (hour >= 12 && hour < 18) {
                  saudacaoTime = 'Boa tarde';
                } else {
                  saudacaoTime = 'Boa noite';
                }

                const clientName = this.selectedLocacao?.cliente?.nome_razao_social || 'Cliente';
                const introMessage = isRecibo
                  ? `${saudacaoTime}, Sr(a) ${clientName}. Segue o seu Recibo de locação.`
                  : `${saudacaoTime}, Sr(a) ${clientName}. Segue o seu Contrato de locação.`;

                // Dispara primeiro a Saudação Personalizada
                this.whatsappService.sendMessage(phone, introMessage).subscribe({
                  next: () => {
                    this.whatsappStatus = 'Enviando anexo...';
                    // Dispara o PDF
                    this.whatsappService.sendPdf(phone, pdfUriOuUrl, filename, caption).subscribe({
                      next: (res) => {
                        this.whatsappStatus = 'Enviando encerramento...';
                        const endMessage = `A JR Loc agradece a preferência! 🤝`;

                        this.whatsappService.sendMessage(phone, endMessage).subscribe({
                          next: () => {
                            this.isSendingWhatsapp = false;
                            this.whatsappStatus = '';
                            this.snackbarService.success(`${isRecibo ? 'Recibo' : 'Contrato'} enviado com sucesso via WhatsApp! ✅`);
                          },
                          error: () => { // se falhar msg final paciencia, anexo foi
                            this.isSendingWhatsapp = false;
                            this.whatsappStatus = '';
                            this.snackbarService.success(`${isRecibo ? 'Recibo' : 'Contrato'} enviado com sucesso (sem msg final)!`);
                          }
                        });
                      },
                      error: (err) => {
                        console.error('Erro ao enviar WhatsApp PDF:', err);
                        this.isSendingWhatsapp = false;
                        this.whatsappStatus = '';
                        let errorMsg = 'Erro ao enviar o PDF no WhatsApp. Verifique o console.';

                        if (err.error && typeof err.error.error === 'string') {
                          errorMsg = `Erro na API do WhatsApp (PDF): ${err.error.error}`;
                        } else if (err.status === 413) {
                          errorMsg = 'Erro: O PDF é muito grande para ser enviado.';
                        }

                        this.snackbarService.error(errorMsg);
                      }
                    });
                  },
                  error: (err) => {
                    console.error('Erro ao enviar WhatsApp Saudação:', err);
                    this.isSendingWhatsapp = false;
                    this.whatsappStatus = '';
                    let errorMsg = 'Erro ao enviar saudação no WhatsApp. Verifique o console.';

                    if (err.error && typeof err.error.error === 'string') {
                      if (err.error.error.includes('is not on WhatsApp')) {
                        errorMsg = 'Erro: O número de telefone desse cliente não possui uma conta WhatsApp válida ou está com o formato incorreto (faltando dígito 9, etc). Verifique o cadastro do cliente!';
                      } else {
                        errorMsg = `Erro na API do WhatsApp: ${err.error.error}`;
                      }
                    } else if (err.status === 401) {
                      errorMsg = 'Erro: Token ou URL do WhatsApp UazAPI inválidos. Verifique as configurações.';
                    }

                    this.snackbarService.error(errorMsg);
                  }
                });
              });
            };

            if (uploadConf.use_base64) {
              const reader = new FileReader();
              reader.readAsDataURL(blob);
              reader.onloadend = () => {
                const base64data = reader.result as string;
                _sendPipeline(base64data, true);
              };
            } else {
              this.printableService.uploadPDF(blob, filename).subscribe({
                next: (response) => {
                  console.log('PDF Uploaded:', response.url);
                  _sendPipeline(response.url, false);
                },
                error: (err) => {
                  console.error('Erro no upload:', err);
                  this.isSendingWhatsapp = false;
                  this.whatsappStatus = '';
                  this.snackbarService.error('Erro ao fazer upload do arquivo PDF para a URL Pública/Privada configurada.');
                }
              });
            }
          });
        },
        error: (err) => {
          console.error('Erro ao gerar PDF:', err);
          this.isSendingWhatsapp = false;
          this.whatsappStatus = '';
          this.snackbarService.error('Erro ao gerar o PDF no backend.');
        }
      });
    });
  }
}