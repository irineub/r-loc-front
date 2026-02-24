import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrencyBrPipe } from '../../pipes/currency-br.pipe';
import { FormsModule } from '@angular/forms';
import { EquipamentoService } from '../../services/equipamento.service';
import { Equipamento, EquipamentoCreate } from '../../models/index';
import { SnackbarService } from '../../services/snackbar.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-equipamentos',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyBrPipe, MatDialogModule],
  template: `
    <div class="equipamentos">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Gestão de Equipamentos</h2>
          <button class="btn btn-primary" (click)="showForm = true" *ngIf="!showForm">
            Novo Equipamento
          </button>
        </div>

        <!-- Form Section -->
        <div class="form-section" *ngIf="showForm">
          <h3>{{ editingEquipamento ? 'Editar' : 'Novo' }} Equipamento</h3>
          <form #form="ngForm" (ngSubmit)="saveEquipamento()">
            <div class="form-row">
              <div class="form-group">
                <label for="descricao">Descrição *</label>
                <input type="text" id="descricao" name="descricao" 
                       [(ngModel)]="formData.descricao" required
                       class="form-control" placeholder="Ex: Betoneira, Escavadeira"
                       [disabled]="isEditingAlugado()">
              </div>
              <div class="form-group">
                <label for="unidade">Unidade *</label>
                <input type="text" id="unidade" name="unidade" 
                       [(ngModel)]="formData.unidade" required
                       class="form-control" placeholder="Ex: UN, PC, LT"
                       [disabled]="isEditingAlugado()">
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="preco_diaria">Preço Diária (R$) *</label>
                <input type="number" id="preco_diaria" name="preco_diaria" 
                       [(ngModel)]="formData.preco_diaria" required min="0" step="0.01"
                       class="form-control" placeholder="0.00"
                       [disabled]="isEditingAlugado()">
              </div>
              <div class="form-group">
                <label for="preco_semanal">Preço Semanal (R$) *</label>
                <input type="number" id="preco_semanal" name="preco_semanal" 
                       [(ngModel)]="formData.preco_semanal" required min="0" step="0.01"
                       class="form-control" placeholder="0.00"
                       [disabled]="isEditingAlugado()">
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="preco_quinzenal">Preço Quinzenal (R$) *</label>
                <input type="number" id="preco_quinzenal" name="preco_quinzenal" 
                       [(ngModel)]="formData.preco_quinzenal" required min="0" step="0.01"
                       class="form-control" placeholder="0.00"
                       [disabled]="isEditingAlugado()">
              </div>
              <div class="form-group">
                <label for="preco_mensal">Preço Mensal (R$) *</label>
                <input type="number" id="preco_mensal" name="preco_mensal" 
                       [(ngModel)]="formData.preco_mensal" required min="0" step="0.01"
                       class="form-control" placeholder="0.00"
                       [disabled]="isEditingAlugado()">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="estoque">Quantidade em Estoque *</label>
                <input type="number" id="estoque" name="estoque" 
                       [(ngModel)]="formData.estoque" required [min]="getMinEstoque()"
                       class="form-control" placeholder="1"
                       (ngModelChange)="checkEstoqueChange()">
                <small *ngIf="isEditingAlugado()" style="color: #6b7280; margin-top: 0.5rem; font-size: 0.8rem;">
                  Equipamento em uso. Você só pode aumentar a quantidade. (Mínimo: {{ getMinEstoque() }})
                </small>
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary" [disabled]="!form.valid">
                {{ editingEquipamento ? 'Atualizar' : 'Salvar' }}
              </button>
              <button type="button" class="btn btn-secondary" (click)="cancelForm()">
                Cancelar
              </button>
            </div>
          </form>
        </div>

        <!-- Table Section -->
        <div class="table-section" *ngIf="!showForm">
          <div class="table-wrapper">
            <table class="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Descrição</th>
                  <th>Unidade</th>
                  <th class="precos-column">Preços</th>
                  <th>Estoque</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let equipamento of equipamentos">
                  <td data-label="ID">{{ equipamento.id }}</td>
                  <td data-label="Descrição">{{ equipamento.descricao }}</td>
                  <td data-label="Unidade">{{ equipamento.unidade }}</td>
                  <td data-label="Preços" class="precos-cell">
                    <div class="precos-list">
                      <div class="preco-item">
                        <span class="preco-label">Diária:</span>
                        <span class="preco-value">{{ equipamento.preco_diaria | currencyBr }}</span>
                      </div>
                      <div class="preco-item">
                        <span class="preco-label">Semanal:</span>
                        <span class="preco-value">{{ equipamento.preco_semanal | currencyBr }}</span>
                      </div>
                      <div class="preco-item">
                        <span class="preco-label">Quinzenal:</span>
                        <span class="preco-value">{{ equipamento.preco_quinzenal | currencyBr }}</span>
                      </div>
                      <div class="preco-item">
                        <span class="preco-label">Mensal:</span>
                        <span class="preco-value">{{ equipamento.preco_mensal | currencyBr }}</span>
                      </div>
                    </div>
                  </td>
                  <td data-label="Estoque">
                    <div class="estoque-info">
                      <span class="estoque-total">{{ equipamento.estoque }}</span>
                      <span class="estoque-alugado">-{{ equipamento.estoque_alugado }}</span>
                      <span class="estoque-disponivel">={{ equipamento.estoque_disponivel }}</span>
                    </div>
                  </td>
                  <td data-label="Status">
                    <span class="badge" [class]="getStatusClass(equipamento)">
                      {{ getStatusText(equipamento) }}
                    </span>
                  </td>
                  <td data-label="Ações">
                    <div class="action-buttons">
                      <button class="action-btn edit" (click)="editEquipamento(equipamento)" 
                              title="Editar Equipamento">
                        ✏️ Editar
                      </button>
                      <button class="action-btn delete" (click)="deleteEquipamento(equipamento.id)" 
                              title="Excluir Equipamento" [disabled]="equipamento.estoque_alugado > 0">
                        🗑️ Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .equipamentos {
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

    .badge-primary {
      background-color: #dbeafe;
      color: #1e40af;
    }

    .badge-secondary {
      background-color: #e5e7eb;
      color: #374151;
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

    .badge-diaria {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
      border-color: #2563eb;
    }

    .badge-mensal {
      background: linear-gradient(135deg, #6b7280, #4b5563);
      color: white;
      border-color: #4b5563;
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

    .action-btn.edit {
      background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
      color: white;
      border: 2px solid transparent;
    }

    .action-btn.edit:hover {
      border-color: rgba(255, 255, 255, 0.3);
    }

    .action-btn.delete {
      background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
      color: white;
      border: 2px solid transparent;
    }

    .action-btn.delete:hover {
      border-color: rgba(255, 255, 255, 0.3);
    }

    .badge-danger {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
      border-color: #dc2626;
    }

    .badge-warning {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white;
      border-color: #d97706;
    }

    .badge-success {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      border-color: #059669;
    }

    .estoque-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .estoque-total {
      color: #374151;
    }

    .estoque-alugado {
      color: #ef4444;
    }

    .estoque-disponivel {
      color: #10b981;
      font-weight: 700;
    }

    .precos-column {
      min-width: 200px;
      width: 200px;
    }

    .precos-cell {
      padding: 0.75rem;
    }

    .precos-list {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .preco-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.35rem 0.5rem;
      font-size: 0.8rem;
      background: #f8f9fa;
      border-radius: 6px;
      border-left: 3px solid #059669;
      margin-bottom: 0.2rem;
    }

    .preco-item:last-child {
      margin-bottom: 0;
    }

    .preco-label {
      font-weight: 600;
      color: #6b7280;
      text-transform: capitalize;
      min-width: 65px;
      font-size: 0.75rem;
    }

    .preco-value {
      font-weight: 700;
      color: #059669;
      text-align: right;
      font-size: 0.85rem;
    }

    .action-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none !important;
    }

    .action-btn:disabled:hover {
      transform: none !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .equipamentos {
        padding: 1rem;
      }

      .card-header {
        flex-direction: column;
        text-align: center;
      }

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
      }

      .form-section {
        padding: 1.5rem;
      }

      .table {
        font-size: 0.9rem;
      }

      .table th,
      .table td {
        padding: 0.75rem 0.5rem;
      }

      .precos-column {
        min-width: 150px;
      }

      .preco-item {
        padding: 0.3rem 0.4rem;
        font-size: 0.75rem;
      }

      .preco-label {
        font-size: 0.7rem;
        min-width: 55px;
      }

      .preco-value {
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
    }

    @media (max-width: 480px) {
      .form-section {
        padding: 1rem;
      }
      
      .card-header {
        padding: 1.5rem;
      }
      
      .form-control {
        padding: 0.75rem;
        font-size: 16px;
      }

      .action-buttons {
        flex-direction: column;
        width: 100%;
      }

      .action-btn {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class EquipamentosComponent implements OnInit {
  equipamentos: Equipamento[] = [];
  formData: EquipamentoCreate = {
    descricao: '',
    unidade: '',
    preco_diaria: 0,
    preco_semanal: 0,
    preco_quinzenal: 0,
    preco_mensal: 0,
    estoque: 1
  };

  editingEquipamento: Equipamento | null = null;
  showForm = false;

  constructor(
    private equipamentoService: EquipamentoService,
    private snackbarService: SnackbarService,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.equipamentoService.getEquipamentos().subscribe(data => {
      this.equipamentos = data;
    });
  }

  saveEquipamento() {
    if (this.editingEquipamento) {
      if (this.isEditingAlugado() && this.formData.estoque < this.editingEquipamento.estoque) {
        this.snackbarService.error('A quantidade não pode ser menor do que a quantidade atual em estoque quando o equipamento está em uso.');
        return;
      }
      this.equipamentoService.updateEquipamento(this.editingEquipamento.id, this.formData).subscribe({
        next: (response) => {
          this.loadData();
          this.cancelForm();
          this.snackbarService.success('Equipamento atualizado com sucesso!');
        },
        error: (error) => {
          this.snackbarService.error('Erro ao atualizar equipamento: ' + error.message);
        }
      });
    } else {
      this.equipamentoService.createEquipamento(this.formData).subscribe({
        next: (response) => {
          this.loadData();
          this.cancelForm();
          this.snackbarService.success('Equipamento criado com sucesso!');
        },
        error: (error) => {
          this.snackbarService.error('Erro ao criar equipamento: ' + error.message);
        }
      });
    }
  }

  editEquipamento(equipamento: Equipamento) {
    this.editingEquipamento = equipamento;
    this.formData = {
      descricao: equipamento.descricao,
      unidade: equipamento.unidade,
      preco_diaria: equipamento.preco_diaria,
      preco_semanal: equipamento.preco_semanal,
      preco_quinzenal: equipamento.preco_quinzenal,
      preco_mensal: equipamento.preco_mensal,
      estoque: equipamento.estoque
    };
    this.showForm = true;
  }

  deleteEquipamento(id: number) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmar Exclusão',
        message: 'Tem certeza que deseja excluir este equipamento?',
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
        isDestructive: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.equipamentoService.deleteEquipamento(id).subscribe({
          next: () => {
            this.loadData();
            this.snackbarService.success('Equipamento excluído com sucesso!');
          },
          error: (error) => {
            this.snackbarService.error('Erro ao excluir equipamento: ' + error.message);
          }
        });
      }
    });
  }

  cancelForm() {
    this.editingEquipamento = null;
    this.showForm = false;
    this.formData = {
      descricao: '',
      unidade: '',
      preco_diaria: 0,
      preco_semanal: 0,
      preco_quinzenal: 0,
      preco_mensal: 0,
      estoque: 1
    };
  }

  getStatusClass(equipamento: Equipamento): string {
    if (equipamento.estoque_disponivel === 0) {
      return 'badge-danger';
    } else if (equipamento.estoque_disponivel <= equipamento.estoque * 0.2) {
      return 'badge-warning';
    } else {
      return 'badge-success';
    }
  }

  getStatusText(equipamento: Equipamento): string {
    if (equipamento.estoque_disponivel === 0) {
      return 'Sem Estoque';
    } else if (equipamento.estoque_disponivel <= equipamento.estoque * 0.2) {
      return 'Estoque Baixo';
    } else {
      return 'Disponível';
    }
  }

  isEditingAlugado(): boolean {
    return this.editingEquipamento !== null && this.editingEquipamento.estoque_alugado > 0;
  }

  getMinEstoque(): number {
    return this.isEditingAlugado() ? this.editingEquipamento!.estoque : 1;
  }

  checkEstoqueChange() {
    if (this.isEditingAlugado() && this.formData.estoque < this.editingEquipamento!.estoque) {
      // Optional: revert change automatically or just let the form be invalid
      // Setting to min value automatically if user types a lower number:
      // this.formData.estoque = this.editingEquipamento!.estoque;
      // But letting standard angular min validation handle it is fine.
    }
  }
} 