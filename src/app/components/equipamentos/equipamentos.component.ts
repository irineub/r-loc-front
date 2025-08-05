import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EquipamentoService } from '../../services/equipamento.service';
import { Equipamento, EquipamentoCreate } from '../../models/index';

@Component({
  selector: 'app-equipamentos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="equipamentos">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">🏗️ Gestão de Equipamentos</h2>
          <button class="btn btn-primary" (click)="showForm = true" *ngIf="!showForm">
            <span>➕</span> Novo Equipamento
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
                       class="form-control" placeholder="Ex: Betoneira, Escavadeira">
              </div>
              <div class="form-group">
                <label for="unidade">Unidade *</label>
                <input type="text" id="unidade" name="unidade" 
                       [(ngModel)]="formData.unidade" required
                       class="form-control" placeholder="Ex: UN, PC, LT">
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="preco_unitario">Preço Unitário (R$) *</label>
                <input type="number" id="preco_unitario" name="preco_unitario" 
                       [(ngModel)]="formData.preco_unitario" required min="0" step="0.01"
                       class="form-control" placeholder="0.00">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="estoque">Quantidade em Estoque *</label>
                <input type="number" id="estoque" name="estoque" 
                       [(ngModel)]="formData.estoque" required min="1"
                       class="form-control" placeholder="1">
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
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Descrição</th>
                <th>Unidade</th>
                <th>Preço Unitário</th>
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
                <td data-label="Preço Unitário">R$ {{ equipamento.preco_unitario | number:'1.2-2' }}</td>
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
                            title="Editar Equipamento" [disabled]="equipamento.estoque_alugado > 0">
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
  `,
  styles: [`
    .equipamentos {
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

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
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

    .badge-primary {
      background-color: #dbeafe;
      color: #1e40af;
    }

    .badge-secondary {
      background-color: #e5e7eb;
      color: #374151;
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

    .action-btn.edit {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
      border-color: #2563eb;
    }

    .action-btn.edit:hover {
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
    }

    .action-btn.delete {
      background: linear-gradient(135deg, #6b7280, #4b5563);
      color: white;
      border-color: #4b5563;
    }

    .action-btn.delete:hover {
      background: linear-gradient(135deg, #4b5563, #374151);
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

    .action-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none !important;
    }

    .action-btn:disabled:hover {
      transform: none !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
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
  `]
})
export class EquipamentosComponent implements OnInit {
  equipamentos: Equipamento[] = [];
  formData: EquipamentoCreate = {
    descricao: '',
    unidade: '',
    preco_unitario: 0,
    estoque: 1
  };

  editingEquipamento: Equipamento | null = null;
  showForm = false;

  constructor(private equipamentoService: EquipamentoService) {}

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
      this.equipamentoService.updateEquipamento(this.editingEquipamento.id, this.formData).subscribe({
        next: (response) => {
          this.loadData();
          this.cancelForm();
        },
        error: (error) => {
          alert('Erro ao atualizar equipamento: ' + error.message);
        }
      });
    } else {
      this.equipamentoService.createEquipamento(this.formData).subscribe({
        next: (response) => {
          this.loadData();
          this.cancelForm();
        },
        error: (error) => {
          alert('Erro ao criar equipamento: ' + error.message);
        }
      });
    }
  }

  editEquipamento(equipamento: Equipamento) {
    this.editingEquipamento = equipamento;
    this.formData = {
      descricao: equipamento.descricao,
      unidade: equipamento.unidade,
      preco_unitario: equipamento.preco_unitario,
      estoque: equipamento.estoque
    };
    this.showForm = true;
  }

  deleteEquipamento(id: number) {
    if (confirm('Tem certeza que deseja excluir este equipamento?')) {
      this.equipamentoService.deleteEquipamento(id).subscribe({
        next: () => {
          this.loadData();
        },
        error: (error) => {
          alert('Erro ao excluir equipamento: ' + error.message);
        }
      });
    }
  }

  cancelForm() {
    this.editingEquipamento = null;
    this.showForm = false;
    this.formData = {
      descricao: '',
      unidade: '',
      preco_unitario: 0,
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
} 