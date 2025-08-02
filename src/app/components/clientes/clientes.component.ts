import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClienteService } from '../../services/cliente.service';
import { Cliente, ClienteCreate } from '../../models/index';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="clientes">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">👥 Gestão de Clientes</h2>
          <button class="btn btn-primary" (click)="showForm = true" *ngIf="!showForm">
            <span>➕</span> Novo Cliente
          </button>
        </div>

        <!-- Form Section -->
        <div class="form-section" *ngIf="showForm">
          <h3>{{ editingCliente ? 'Editar' : 'Novo' }} Cliente</h3>
          <form #form="ngForm" (ngSubmit)="saveCliente()">
            <div class="form-row">
              <div class="form-group">
                <label for="nome_razao_social">Nome/Razão Social *</label>
                <input type="text" id="nome_razao_social" name="nome_razao_social" 
                       [(ngModel)]="formData.nome_razao_social" required
                       class="form-control" placeholder="Nome completo ou razão social">
              </div>
              <div class="form-group">
                <label for="tipo_pessoa">Tipo de Pessoa *</label>
                <select id="tipo_pessoa" name="tipo_pessoa" 
                        [(ngModel)]="formData.tipo_pessoa" required
                        class="form-control">
                  <option value="">Selecione...</option>
                  <option value="fisica">Pessoa Física</option>
                  <option value="juridica">Pessoa Jurídica</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="cpf" *ngIf="formData.tipo_pessoa === 'fisica'">CPF *</label>
                <label for="cnpj" *ngIf="formData.tipo_pessoa === 'juridica'">CNPJ *</label>
                <input type="text" id="cpf" name="cpf" 
                       [(ngModel)]="formData.cpf" 
                       *ngIf="formData.tipo_pessoa === 'fisica'"
                       class="form-control" placeholder="000.000.000-00">
                <input type="text" id="cnpj" name="cnpj" 
                       [(ngModel)]="formData.cnpj" 
                       *ngIf="formData.tipo_pessoa === 'juridica'"
                       class="form-control" placeholder="00.000.000/0000-00">
              </div>
              <div class="form-group">
                <label for="rg" *ngIf="formData.tipo_pessoa === 'fisica'">RG</label>
                <label for="inscricao_estadual" *ngIf="formData.tipo_pessoa === 'juridica'">Inscrição Estadual</label>
                <input type="text" id="rg" name="rg" 
                       [(ngModel)]="formData.rg" 
                       *ngIf="formData.tipo_pessoa === 'fisica'"
                       class="form-control" placeholder="RG">
                <input type="text" id="inscricao_estadual" name="inscricao_estadual" 
                       [(ngModel)]="formData.inscricao_estadual" 
                       *ngIf="formData.tipo_pessoa === 'juridica'"
                       class="form-control" placeholder="Inscrição Estadual">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="telefone_comercial">Telefone Comercial</label>
                <input type="tel" id="telefone_comercial" name="telefone_comercial" 
                       [(ngModel)]="formData.telefone_comercial"
                       class="form-control" placeholder="(00) 0000-0000">
              </div>
              <div class="form-group">
                <label for="telefone_celular">Telefone Celular</label>
                <input type="tel" id="telefone_celular" name="telefone_celular" 
                       [(ngModel)]="formData.telefone_celular"
                       class="form-control" placeholder="(00) 00000-0000">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="email">E-mail</label>
                <input type="email" id="email" name="email" 
                       [(ngModel)]="formData.email"
                       class="form-control" placeholder="email@exemplo.com">
              </div>
              <div class="form-group">
                <label for="endereco">Endereço</label>
                <input type="text" id="endereco" name="endereco" 
                       [(ngModel)]="formData.endereco"
                       class="form-control" placeholder="Endereço completo">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="observacoes">Observações</label>
                <textarea id="observacoes" name="observacoes" 
                          [(ngModel)]="formData.observacoes"
                          class="form-control" rows="3" 
                          placeholder="Observações sobre o cliente..."></textarea>
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary" [disabled]="!form.valid">
                {{ editingCliente ? 'Atualizar' : 'Salvar' }}
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
                <th>Nome/Razão Social</th>
                <th>Tipo</th>
                <th>Documento</th>
                <th>Telefone</th>
                <th>E-mail</th>
                <th>Data Cadastro</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let cliente of clientes">
                <td data-label="ID">{{ cliente.id }}</td>
                <td data-label="Nome/Razão Social">{{ cliente.nome_razao_social }}</td>
                <td data-label="Tipo">
                  <span class="badge" [class]="cliente.tipo_pessoa === 'fisica' ? 'badge-primary' : 'badge-secondary'">
                    {{ cliente.tipo_pessoa === 'fisica' ? 'PF' : 'PJ' }}
                  </span>
                </td>
                <td data-label="Documento">{{ cliente.cpf || cliente.cnpj || '-' }}</td>
                <td data-label="Telefone">{{ cliente.telefone_comercial || cliente.telefone_celular || '-' }}</td>
                <td data-label="E-mail">{{ cliente.email || '-' }}</td>
                <td data-label="Data Cadastro">{{ cliente.data_cadastro | date:'dd/MM/yyyy' }}</td>
                <td data-label="Ações">
                  <div class="action-buttons">
                    <button class="action-btn edit" (click)="editCliente(cliente)" title="Editar Cliente">
                      ✏️ Editar
                    </button>
                    <button class="action-btn delete" (click)="deleteCliente(cliente.id)" title="Excluir Cliente">
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
    .clientes {
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

    .badge-primary {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
      border-color: #2563eb;
    }

    .badge-secondary {
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
export class ClientesComponent implements OnInit {
  clientes: Cliente[] = [];
  showForm = false;
  editingCliente: Cliente | null = null;
  formData: ClienteCreate = {
    nome_razao_social: '',
    tipo_pessoa: 'fisica',
    endereco: '',
    telefone_comercial: '',
    telefone_celular: '',
    cpf: '',
    cnpj: '',
    rg: '',
    inscricao_estadual: '',
    email: '',
    cidade: '',
    estado: '',
    cep: '',
    observacoes: ''
  };

  constructor(private clienteService: ClienteService) {}

  ngOnInit() {
    this.loadClientes();
  }

  loadClientes() {
    this.clienteService.getClientes().subscribe(data => {
      this.clientes = data;
    });
  }

  saveCliente() {
    if (this.editingCliente) {
      this.clienteService.updateCliente(this.editingCliente.id, this.formData).subscribe(() => {
        this.loadClientes();
        this.cancelForm();
      });
    } else {
      this.clienteService.createCliente(this.formData).subscribe(() => {
        this.loadClientes();
        this.cancelForm();
      });
    }
  }

  editCliente(cliente: Cliente) {
    this.editingCliente = cliente;
    this.formData = { ...cliente };
    this.showForm = true;
  }

  deleteCliente(id: number) {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      this.clienteService.deleteCliente(id).subscribe(() => {
        this.loadClientes();
      });
    }
  }

  cancelForm() {
    this.showForm = false;
    this.editingCliente = null;
    this.formData = {
      nome_razao_social: '',
      tipo_pessoa: 'fisica',
      endereco: '',
      telefone_comercial: '',
      telefone_celular: '',
      cpf: '',
      cnpj: '',
      rg: '',
      inscricao_estadual: '',
      email: '',
      cidade: '',
      estado: '',
      cep: '',
      observacoes: ''
    };
  }
} 