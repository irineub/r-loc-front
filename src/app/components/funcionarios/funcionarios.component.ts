import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FuncionarioService, Funcionario, FuncionarioCreate, FuncionarioUpdate } from '../../services/funcionario.service';
import { SnackbarService } from '../../services/snackbar.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-funcionarios',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  template: `
    <div class="funcionarios">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Gestão de Funcionários</h2>
          <button class="btn btn-primary" (click)="showForm = true" *ngIf="!showForm">
            Novo Funcionário
          </button>
        </div>

        <!-- Form Section -->
        <div class="form-section" *ngIf="showForm">
          <h3>{{ editingFuncionario ? 'Editar' : 'Novo' }} Funcionário</h3>
          <form #form="ngForm" (ngSubmit)="saveFuncionario()">
            <div class="form-row">
              <div class="form-group">
                <label for="username">Usuário *</label>
                <input type="text" id="username" name="username" 
                       [(ngModel)]="formData.username" required
                       [disabled]="!!editingFuncionario"
                       class="form-control" placeholder="Nome de usuário">
              </div>
              <div class="form-group">
                <label for="nome">Nome Completo *</label>
                <input type="text" id="nome" name="nome" 
                       [(ngModel)]="formData.nome" required
                       class="form-control" placeholder="Nome completo">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="senha">{{ editingFuncionario ? 'Nova Senha (deixe em branco para manter)' : 'Senha *' }}</label>
                <input type="password" id="senha" name="senha" 
                       [(ngModel)]="formData.senha"
                       [required]="!editingFuncionario"
                       class="form-control" placeholder="Mínimo 4 caracteres">
              </div>
              <div class="form-group">
                <label for="ativo">Status</label>
                <select id="ativo" name="ativo" 
                        [(ngModel)]="formData.ativo"
                        class="form-control">
                  <option [value]="true">Ativo</option>
                  <option [value]="false">Inativo</option>
                </select>
              </div>
            </div>

            <div class="error-message" *ngIf="errorMessage">
              {{ errorMessage }}
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary" [disabled]="!form.valid || isLoading">
                <span *ngIf="!isLoading">{{ editingFuncionario ? 'Atualizar' : 'Salvar' }}</span>
                <span *ngIf="isLoading">Salvando...</span>
              </button>
              <button type="button" class="btn btn-secondary" (click)="cancelForm()" [disabled]="isLoading">
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
                <th>Usuário</th>
                <th>Nome</th>
                <th>Status</th>
                <th>Data Cadastro</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let funcionario of funcionarios">
                <td data-label="ID">{{ funcionario.id }}</td>
                <td data-label="Usuário">{{ funcionario.username }}</td>
                <td data-label="Nome">{{ funcionario.nome }}</td>
                <td data-label="Status">
                  <span class="badge" [class.badge-success]="funcionario.ativo" [class.badge-danger]="!funcionario.ativo">
                    {{ funcionario.ativo ? 'Ativo' : 'Inativo' }}
                  </span>
                </td>
                <td data-label="Data Cadastro">{{ funcionario.data_cadastro | date:'dd/MM/yyyy' }}</td>
                <td data-label="Ações">
                  <button class="btn btn-sm btn-primary" (click)="editFuncionario(funcionario)">
                    ✏️ Editar
                  </button>
                  <button class="btn btn-sm btn-danger" (click)="deleteFuncionario(funcionario.id)" 
                          *ngIf="funcionario.username !== 'rloc'">
                    🗑️ Excluir
                  </button>
                </td>
              </tr>
              <tr *ngIf="funcionarios.length === 0">
                <td colspan="6" class="text-center">Nenhum funcionário cadastrado</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .funcionarios {
      padding: 2rem;
    }
    .card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
      color: white;
    }
    .card-title {
      margin: 0;
      font-size: 1.5rem;
    }
    .form-section {
      padding: 1.5rem;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
    }
    .form-group label {
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: #333;
    }
    .form-control {
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 1rem;
    }
    .form-control:focus {
      outline: none;
      border-color: #dc3545;
      box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
    }
    .form-actions {
      display: flex;
      gap: 1rem;
      margin-top: 1.5rem;
    }
    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s;
    }
    .btn-primary {
      background: #dc3545;
      color: white;
    }
    .btn-primary:hover:not(:disabled) {
      background: #c82333;
    }
    .btn-secondary {
      background: #6c757d;
      color: white;
    }
    .btn-secondary:hover:not(:disabled) {
      background: #5a6268;
    }
    .btn-sm {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
    }
    .btn-danger {
      background: #dc3545;
      color: white;
    }
    .btn-danger:hover:not(:disabled) {
      background: #c82333;
    }
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
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
    .badge-success {
      background: #28a745;
      color: white;
    }
    .badge-danger {
      background: #dc3545;
      color: white;
    }
    .error-message {
      background: #dc3545;
      color: white;
      padding: 1rem;
      border-radius: 6px;
      margin-bottom: 1rem;
    }
    .text-center {
      text-align: center;
    }
    @media (max-width: 768px) {
      .funcionarios {
        padding: 1rem;
      }

      .card-header {
        flex-direction: column;
        text-align: center;
        gap: 1rem;
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
        font-size: 16px;
        padding: 0.875rem 1rem;
        width: 100%;
        box-sizing: border-box;
      }

      .form-section {
        padding: 1.5rem;
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
        gap: 0.5rem;
      }

      .btn-sm {
        width: auto;
        padding: 0.5rem 1rem;
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
      
      .btn-sm {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class FuncionariosComponent implements OnInit {
  funcionarios: Funcionario[] = [];
  showForm = false;
  editingFuncionario: Funcionario | null = null;
  isLoading = false;
  errorMessage = '';

  formData: FuncionarioCreate & { ativo?: boolean } = {
    username: '',
    nome: '',
    senha: '',
    ativo: true
  };

  constructor(
    private funcionarioService: FuncionarioService,
    private snackbarService: SnackbarService,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    this.loadFuncionarios();
  }

  loadFuncionarios() {
    this.isLoading = true;
    this.funcionarioService.getFuncionarios().subscribe({
      next: (data) => {
        this.funcionarios = data;
        this.isLoading = false;
      },
      error: (error) => {
        this.snackbarService.error('Erro ao carregar funcionários');
        this.isLoading = false;
      }
    });
  }

  cancelForm() {
    this.showForm = false;
    this.editingFuncionario = null;
    this.formData = {
      username: '',
      nome: '',
      senha: '',
      ativo: true
    };
    this.errorMessage = '';
  }

  editFuncionario(funcionario: Funcionario) {
    this.editingFuncionario = funcionario;
    this.formData = {
      username: funcionario.username,
      nome: funcionario.nome,
      senha: '',
      ativo: funcionario.ativo
    };
    this.showForm = true;
  }

  saveFuncionario() {
    this.isLoading = true;
    this.errorMessage = '';

    if (this.editingFuncionario) {
      const updateData: FuncionarioUpdate = {
        nome: this.formData.nome,
        ativo: this.formData.ativo
      };

      if (this.formData.senha && this.formData.senha.length >= 4) {
        updateData.senha = this.formData.senha;
      }

      this.funcionarioService.updateFuncionario(this.editingFuncionario.id, updateData).subscribe({
        next: () => {
          this.loadFuncionarios();
          this.cancelForm();
        },
        error: (error) => {
          this.snackbarService.error(error?.error?.detail || 'Erro ao atualizar funcionário');
          this.isLoading = false;
        }
      });
    } else {
      if (!this.formData.senha || this.formData.senha.length < 4) {
        this.snackbarService.error('A senha deve ter pelo menos 4 caracteres');
        this.isLoading = false;
        return;
      }

      this.funcionarioService.createFuncionario(this.formData as FuncionarioCreate).subscribe({
        next: () => {
          this.loadFuncionarios();
          this.cancelForm();
        },
        error: (error) => {
          this.snackbarService.error(error?.error?.detail || 'Erro ao criar funcionário');
          this.isLoading = false;
        }
      });
    }
  }

  deleteFuncionario(id: number) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Excluir Funcionário',
        message: 'Tem certeza que deseja excluir este funcionário?',
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
        isDestructive: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;
        this.funcionarioService.deleteFuncionario(id).subscribe({
          next: () => {
            this.loadFuncionarios();
            this.snackbarService.success('Funcionário excluído com sucesso!');
          },
          error: (error) => {
            this.snackbarService.error(error?.error?.detail || 'Erro ao excluir funcionário');
            this.isLoading = false;
          }
        });
      }
    });
  }
}

