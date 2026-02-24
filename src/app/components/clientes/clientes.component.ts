import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ClienteService } from '../../services/cliente.service';
import { Cliente, ClienteCreate } from '../../models/index';
import { SnackbarService } from '../../services/snackbar.service';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="clientes">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Gestão de Clientes</h2>
          <button class="btn btn-primary" (click)="showForm = true" *ngIf="!showForm">
            Novo Cliente
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

        <!-- Search Section -->
        <div class="search-section" *ngIf="!showForm">
          <div class="search-container">
            <input 
              type="text" 
              class="search-input" 
              [(ngModel)]="searchTerm"
              (input)="onSearchChange()"
              placeholder="Pesquisar por nome ou CPF/CNPJ..."
              autocomplete="off">
          </div>
        </div>

        <!-- Cards Section -->
        <div class="cards-section" *ngIf="!showForm">
          <div class="cards-grid">
            <div class="cliente-card" *ngFor="let cliente of filteredClientes">
              <div class="card-header-small">
                <div class="card-id">#{{ cliente.id }}</div>
                <span class="badge" [class]="cliente.tipo_pessoa === 'fisica' ? 'badge-primary' : 'badge-secondary'">
                  {{ cliente.tipo_pessoa === 'fisica' ? 'PF' : 'PJ' }}
                </span>
              </div>
              <div class="card-body-small">
                <h3 class="card-name">{{ cliente.nome_razao_social }}</h3>
                <div class="card-info">
                  <div class="info-item">
                    <span class="info-label">Documento:</span>
                    <span class="info-value">{{ cliente.cpf || cliente.cnpj || '-' }}</span>
                  </div>
                  <div class="info-item" *ngIf="cliente.telefone_comercial || cliente.telefone_celular">
                    <span class="info-label">Telefone:</span>
                    <span class="info-value">{{ cliente.telefone_comercial || cliente.telefone_celular }}</span>
                  </div>
                  <div class="info-item" *ngIf="cliente.email">
                    <span class="info-label">E-mail:</span>
                    <span class="info-value">{{ cliente.email }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Cadastro:</span>
                    <span class="info-value">{{ cliente.data_cadastro | date:'dd/MM/yyyy' }}</span>
                  </div>
                </div>
              </div>
              <div class="card-actions">
                 <button class="action-btn view" (click)="verDetalhes(cliente.id)" title="Ver Detalhes">
                 Ver Detalhes
                </button>
                <button class="action-btn edit" (click)="editCliente(cliente)" title="Editar Cliente">
                  Editar
                </button>
                <button class="action-btn delete" (click)="deleteCliente(cliente.id)" title="Excluir Cliente">
                  Excluir
                </button>
              </div>
            </div>
          </div>
          <div class="no-results" *ngIf="filteredClientes.length === 0">
            <p>Nenhum cliente encontrado.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Confirmação de Exclusão -->
    <div class="modal-overlay" *ngIf="showDeleteModal" (click)="closeDeleteModal()">
      <div class="modal-content confirm-modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Confirmar Exclusão</h3>
          <button class="modal-close" (click)="closeDeleteModal()">×</button>
        </div>
        <div class="modal-body">
          <div class="confirm-warning">
            <p><strong>⚠️ Atenção!</strong></p>
            <p>Você está prestes a excluir o cliente <strong>{{ clienteToDelete?.nome_razao_social }}</strong>.</p>
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
          <button class="btn btn-secondary" (click)="closeDeleteModal()">
            Voltar
          </button>
          <button 
            class="btn btn-danger" 
            (click)="confirmDeleteCliente()"
            [disabled]="!isConfirmTextValid">
            Confirmar Exclusão
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .clientes {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
      width: 100%;
      box-sizing: border-box;
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

    /* Search Section */
    .search-section {
      padding: 1.5rem 2rem;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-bottom: 2px solid rgba(220, 53, 69, 0.1);
    }

    .search-container {
      max-width: 600px;
      margin: 0 auto;
    }

    .search-input {
      width: 100%;
      padding: 0.9375rem 1.25rem;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      font-size: 0.9375rem;
      font-weight: 400;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      background: white;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      color: #1f2937;
      font-family: 'Inter', sans-serif;
      line-height: 1.5;
      letter-spacing: -0.01em;
      box-sizing: border-box;
    }

    .search-input:focus {
      outline: none;
      border-color: #dc3545;
      box-shadow: 0 0 0 4px rgba(220, 53, 69, 0.15);
    }

    .search-input::placeholder {
      color: #9ca3af;
      font-weight: 400;
      opacity: 0.7;
    }

    /* Cards Section */
    .cards-section {
      padding: 2rem;
    }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }

    .cliente-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(220, 53, 69, 0.1);
      border: 2px solid rgba(220, 53, 69, 0.1);
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
    }

    .cliente-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(220, 53, 69, 0.2);
      border-color: rgba(220, 53, 69, 0.3);
    }

    .card-header-small {
      background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
      color: white;
      padding: 1rem 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .card-id {
      font-weight: 700;
      font-size: 0.875rem;
      opacity: 0.9;
    }

    .card-body-small {
      padding: 1.5rem;
      flex: 1;
    }

    .card-name {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1f2937;
      margin: 0 0 1rem 0;
      font-family: 'Inter', sans-serif;
      letter-spacing: -0.02em;
    }

    .card-info {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .info-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .info-value {
      font-size: 0.9375rem;
      font-weight: 500;
      color: #374151;
    }

    .card-actions {
      padding: 1rem 1.5rem;
      border-top: 1px solid #e5e7eb;
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      background: #f9fafb;
    }

    .action-btn.view {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      border: 2px solid transparent;
    }

    .action-btn.view:hover {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      border-color: rgba(255, 255, 255, 0.3);
    }

    .no-results {
      text-align: center;
      padding: 3rem 2rem;
      color: #6b7280;
      font-size: 1rem;
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
      overflow: hidden;
    }

    .table tbody td:last-child {
      max-width: none;
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
      max-width: 100%;
      box-sizing: border-box;
    }

    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.625rem 0.875rem;
      border: none;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-size: 0.8125rem;
      text-decoration: none;
      white-space: nowrap;
      min-width: auto;
      text-transform: none;
      letter-spacing: 0.01em;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
      flex-shrink: 0;
      max-width: 100%;
      box-sizing: border-box;
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

    /* Responsive Design */
    @media (max-width: 768px) {
      .clientes {
        padding: 1rem;
        width: 100%;
        box-sizing: border-box;
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

      .search-section {
        padding: 1rem;
      }

      .cards-section {
        padding: 1rem;
      }

      .cards-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .card-actions {
        flex-direction: column;
      }

      .card-actions .action-btn {
        width: 100%;
        justify-content: center;
      }
    }

    @media (max-width: 480px) {
      .clientes {
        padding: 0.75rem;
      }

      .form-section {
        padding: 1rem;
      }
      
      .card-header {
        padding: 1.25rem;
      }
      
      .form-control {
        padding: 0.75rem;
        font-size: 16px;
      }

      .table-section {
        padding: 0.75rem;
      }

      .table tbody tr {
        padding: 0.875rem;
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

    /* Modal de Confirmação */
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
      max-width: 500px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      display: flex;
      flex-direction: column;
    }

    .confirm-modal {
      max-width: 500px;
    }

    .modal-header {
      background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
      color: white;
      padding: 1.5rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-radius: 20px 20px 0 0;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
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
      flex: 1;
      overflow-y: auto;
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
    }

    .modal-footer .btn {
      min-width: 120px;
    }

    @media (max-width: 768px) {
      .modal-overlay {
        padding: 1rem;
      }

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
export class ClientesComponent implements OnInit {
  clientes: Cliente[] = [];
  filteredClientes: Cliente[] = [];
  searchTerm = '';
  showForm = false;
  editingCliente: Cliente | null = null;
  showDeleteModal = false;
  clienteToDelete: Cliente | null = null;
  confirmText = '';
  isConfirmTextValid = false;
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

  constructor(
    private clienteService: ClienteService,
    private router: Router,
    private snackbarService: SnackbarService
  ) { }

  ngOnInit() {
    this.loadClientes();
  }

  loadClientes() {
    this.clienteService.getClientes().subscribe(data => {
      this.clientes = data;
      this.filteredClientes = data;
    });
  }

  onSearchChange() {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.filteredClientes = this.clientes;
      return;
    }

    const term = this.searchTerm.toLowerCase().trim();
    this.filteredClientes = this.clientes.filter(cliente => {
      const nome = cliente.nome_razao_social?.toLowerCase() || '';
      const cpf = cliente.cpf?.toLowerCase() || '';
      const cnpj = cliente.cnpj?.toLowerCase() || '';
      return nome.includes(term) || cpf.includes(term) || cnpj.includes(term);
    });
  }

  verDetalhes(clienteId: number) {
    this.router.navigate(['/clientes', clienteId]);
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
    const cliente = this.clientes.find(c => c.id === id);
    if (cliente) {
      this.clienteToDelete = cliente;
      this.showDeleteModal = true;
      this.confirmText = '';
      this.isConfirmTextValid = false;
    }
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.clienteToDelete = null;
    this.confirmText = '';
    this.isConfirmTextValid = false;
  }

  onConfirmTextChange() {
    this.isConfirmTextValid = this.confirmText.toLowerCase().trim() === 'cancelar';
  }

  confirmDeleteCliente() {
    if (!this.isConfirmTextValid || !this.clienteToDelete) {
      return;
    }

    this.clienteService.deleteCliente(this.clienteToDelete.id).subscribe({
      next: () => {
        this.loadClientes();
        this.closeDeleteModal();
        this.snackbarService.success('Cliente excluído com sucesso!');
      },
      error: (error) => {
        console.error('Erro ao excluir cliente:', error);
        this.snackbarService.error('Erro ao excluir cliente. Tente novamente.');
      }
    });
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