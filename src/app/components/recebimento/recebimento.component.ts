import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrencyBrPipe } from '../../pipes/currency-br.pipe';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LocacaoService } from '../../services/locacao.service';
import { EquipamentoService } from '../../services/equipamento.service';
import { Locacao, ItemLocacao, Equipamento } from '../../models/index';
import { forkJoin } from 'rxjs';

interface ItemRecebimento extends ItemLocacao {
  devolvido: boolean;
  observacoes?: string;
  danificado?: boolean;
  devolverQuantidade?: number;
  quantidade_devolvida?: number;
}

@Component({
  selector: 'app-recebimento',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyBrPipe],
  template: `
    <div class="recebimento">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">📦 Recebimento de Equipamentos</h2>
          <button class="btn btn-secondary" (click)="voltar()">
            ← Voltar
          </button>
        </div>

        <div class="content" *ngIf="locacao">
          <!-- Informações da Locação -->
          <div class="locacao-info">
            <h3>📋 Informações da Locação</h3>
            <div class="info-grid">
              <div class="info-item">
                <strong>ID da Locação:</strong> {{ locacao.id }}
              </div>
              <div class="info-item">
                <strong>Cliente:</strong> {{ locacao.cliente.nome_razao_social }}
              </div>
              <div class="info-item">
                <strong>Data Início:</strong> {{ locacao.data_inicio | date:'dd/MM/yyyy' }}
              </div>
              <div class="info-item">
                <strong>Data Fim:</strong> {{ locacao.data_fim | date:'dd/MM/yyyy' }}
              </div>
              <div class="info-item">
                <strong>Status:</strong> 
                <span class="badge badge-ativa">{{ locacao.status }}</span>
              </div>
            </div>
          </div>

          <!-- Checklist de Equipamentos -->
          <div class="checklist-section">
            <h3>✅ Checklist de Recebimento</h3>
            <p class="instructions">
              Marque os equipamentos que foram devolvidos e adicione observações se necessário.
            </p>

            <div class="equipamentos-list">
              <div class="equipamento-item" *ngFor="let item of itensRecebimento; let i = index">
                <div class="equipamento-header">
                  <div class="equipamento-info">
                    <h4>{{ getEquipamentoDescricao(item.equipamento_id) }}</h4>
                    <div class="equipamento-details">
                      <span class="quantidade">Qtd locada: {{ item.quantidade }}</span>
                      <span class="quantidade">Qtd devolvida: {{ item.quantidade_devolvida || 0 }}</span>
                      <span class="quantidade">Qtd pendente: {{ item.quantidade - (item.quantidade_devolvida || 0) }}</span>
                      <span class="preco">Preço: {{ item.preco_unitario | currencyBr }}</span>
                    </div>
                  </div>
                </div>

                <div class="status-selection">
                  <h5>Status do Equipamento:</h5>
                  <div class="status-options">
                    <label class="status-option devolvido" [class.selected]="item.devolvido">
                      <input type="radio" 
                             name="status-{{i}}" 
                             [value]="true"
                             [(ngModel)]="item.devolvido" 
                             (change)="onStatusChange(item)">
                      <div class="status-content">
                        <span class="status-icon">✅</span>
                        <span class="status-label">Devolvido</span>
                        <span class="status-description">Equipamento retornado</span>
                      </div>
                    </label>
                    
                    <label class="status-option nao-devolvido" [class.selected]="!item.devolvido">
                      <input type="radio" 
                             name="status-{{i}}" 
                             [value]="false"
                             [(ngModel)]="item.devolvido" 
                             (change)="onStatusChange(item)">
                      <div class="status-content">
                        <span class="status-icon">❌</span>
                        <span class="status-label">Não Devolvido</span>
                        <span class="status-description">Equipamento não retornado</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div class="equipamento-details-expanded" *ngIf="item.devolvido">
                  <div class="form-group">
                    <label for="qtd-{{i}}">Quantidade a devolver:</label>
                    <input id="qtd-{{i}}" type="number" class="form-control"
                           [(ngModel)]="item.devolverQuantidade"
                           [min]="0" [max]="item.quantidade - (item.quantidade_devolvida || 0)" />
                  </div>
                  <div class="form-group">
                    <label>
                      <input type="checkbox" [(ngModel)]="item.danificado">
                      Equipamento danificado
                    </label>
                  </div>
                  <div class="form-group">
                    <label for="observacoes-{{i}}">Observações:</label>
                    <textarea id="observacoes-{{i}}" 
                              [(ngModel)]="item.observacoes"
                              class="form-control" 
                              rows="2" 
                              placeholder="Descreva o estado do equipamento, danos, etc..."></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Resumo do Recebimento -->
          <div class="resumo-section" [class.todos-devolvidos]="getTotalNaoDevolvidos() === 0">
            <h3>📊 Resumo do Recebimento</h3>
            
            <!-- Indicação de todos devolvidos -->
            <div class="status-completo" *ngIf="getTotalNaoDevolvidos() === 0">
              <div class="status-icon">🎉</div>
              <div class="status-text">
                <h4>Todos os equipamentos foram devolvidos!</h4>
                <p>A locação pode ser finalizada.</p>
              </div>
            </div>

            <div class="resumo-grid">
              <div class="resumo-item">
                <span class="resumo-label">Total de Itens:</span>
                <span class="resumo-value">{{ itensRecebimento.length }}</span>
              </div>
              <div class="resumo-item">
                <span class="resumo-label">Devolvidos:</span>
                <span class="resumo-value devolvidos">{{ getTotalDevolvidos() }}</span>
              </div>
              <div class="resumo-item">
                <span class="resumo-label">Não Devolvidos:</span>
                <span class="resumo-value nao-devolvidos">{{ getTotalNaoDevolvidos() }}</span>
              </div>
              <div class="resumo-item">
                <span class="resumo-label">Danificados:</span>
                <span class="resumo-value danificados">{{ getTotalDanificados() }}</span>
              </div>
            </div>
          </div>

          <!-- Ações -->
          <div class="actions-section">
            <div class="warning" *ngIf="getTotalNaoDevolvidos() > 0">
              ⚠️ Atenção: {{ getTotalNaoDevolvidos() }} item(ns) não foi(ram) devolvido(s).
            </div>
            
            <div class="actions">
              <button class="btn btn-primary" 
                      [class.btn-success]="getTotalNaoDevolvidos() === 0"
                      (click)="finalizarRecebimento()"
                      [disabled]="getTotalDevolvidos() === 0">
                <span *ngIf="getTotalNaoDevolvidos() === 0">🎉 Finalizar Locação</span>
                <span *ngIf="getTotalNaoDevolvidos() > 0">✅ Finalizar Recebimento</span>
              </button>
              <button class="btn btn-secondary" (click)="voltar()">
                Cancelar
              </button>
            </div>
          </div>
        </div>

        <div class="loading" *ngIf="!locacao">
          <div class="spinner"></div>
          <p>Carregando informações da locação...</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .recebimento {
      padding: 2rem;
      max-width: 1200px;
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

    .content {
      padding: 2rem;
    }

    .locacao-info {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      padding: 1.5rem;
      border-radius: 16px;
      margin-bottom: 2rem;
      border: 2px solid rgba(220, 53, 69, 0.1);
      box-shadow: 0 4px 20px rgba(220, 53, 69, 0.05);
    }

    .locacao-info h3 {
      color: #dc3545;
      margin-bottom: 1rem;
      font-size: 1.3rem;
      font-weight: bold;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .info-item strong {
      color: #495057;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
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

    .badge-ativa {
      background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
      color: white;
      border-color: #20c997;
    }

    .checklist-section {
      margin-bottom: 2rem;
    }

    .checklist-section h3 {
      color: #dc3545;
      margin-bottom: 1rem;
      font-size: 1.3rem;
      font-weight: bold;
    }

    .instructions {
      color: #6c757d;
      margin-bottom: 1.5rem;
      font-style: italic;
    }

    .equipamentos-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .equipamento-item {
      background: white;
      border: 2px solid #e9ecef;
      border-radius: 16px;
      padding: 1.5rem;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .equipamento-item:hover {
      border-color: #dc3545;
      box-shadow: 0 4px 16px rgba(220, 53, 69, 0.1);
    }

    .equipamento-header {
      margin-bottom: 1.5rem;
    }

    .equipamento-info h4 {
      margin: 0 0 0.5rem 0;
      color: #374151;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .equipamento-details {
      display: flex;
      gap: 1rem;
      font-size: 0.9rem;
      color: #6b7280;
    }

    .status-selection {
      margin-bottom: 1rem;
    }

    .status-selection h5 {
      margin: 0 0 1rem 0;
      color: #495057;
      font-size: 1rem;
      font-weight: 600;
    }

    .status-options {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .status-option {
      display: block;
      cursor: pointer;
      border: 2px solid #e9ecef;
      border-radius: 12px;
      padding: 1rem;
      transition: all 0.3s ease;
      background: white;
      position: relative;
    }

    .status-option:hover {
      border-color: #dc3545;
      box-shadow: 0 4px 12px rgba(220, 53, 69, 0.1);
    }

    .status-option.selected {
      border-color: #dc3545;
      background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
      box-shadow: 0 4px 16px rgba(220, 53, 69, 0.15);
    }

    .status-option.devolvido.selected {
      border-color: #28a745;
      background: linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%);
      box-shadow: 0 4px 16px rgba(40, 167, 69, 0.15);
    }

    .status-option.nao-devolvido.selected {
      border-color: #dc3545;
      background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
      box-shadow: 0 4px 16px rgba(220, 53, 69, 0.15);
    }

    .status-option input[type="radio"] {
      position: absolute;
      opacity: 0;
      pointer-events: none;
    }

    .status-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.5rem;
    }

    .status-icon {
      font-size: 1.5rem;
      margin-bottom: 0.25rem;
    }

    .status-label {
      font-weight: 700;
      font-size: 1rem;
      color: #374151;
    }

    .status-description {
      font-size: 0.8rem;
      color: #6b7280;
      font-style: italic;
    }

    .equipamento-details-expanded {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 12px;
      border: 1px solid #e9ecef;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group:last-child {
      margin-bottom: 0;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: #495057;
    }

    .form-control {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #e9ecef;
      border-radius: 8px;
      font-size: 0.9rem;
      transition: all 0.3s ease;
    }

    .form-control:focus {
      outline: none;
      border-color: #dc3545;
      box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
    }

    .resumo-section {
      background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
      padding: 1.5rem;
      border-radius: 16px;
      margin-bottom: 2rem;
      border: 2px solid #2196f3;
      transition: all 0.3s ease;
    }

    .resumo-section.todos-devolvidos {
      background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%);
      border-color: #4caf50;
    }

    .resumo-section h3 {
      color: #1976d2;
      margin-bottom: 1rem;
      font-size: 1.3rem;
      font-weight: bold;
    }

    .resumo-section.todos-devolvidos h3 {
      color: #2e7d32;
    }

    .status-completo {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
      color: white;
      padding: 1rem;
      border-radius: 12px;
      margin-bottom: 1rem;
      box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
    }

    .status-completo .status-icon {
      font-size: 2rem;
      background: rgba(255, 255, 255, 0.2);
      padding: 0.5rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .status-completo .status-text h4 {
      margin: 0 0 0.25rem 0;
      font-size: 1.1rem;
      font-weight: 700;
    }

    .status-completo .status-text p {
      margin: 0;
      font-size: 0.9rem;
      opacity: 0.9;
    }

    .resumo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .resumo-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .resumo-label {
      font-weight: 600;
      color: #495057;
    }

    .resumo-value {
      font-weight: 700;
      font-size: 1.1rem;
    }

    .resumo-value.devolvidos {
      color: #28a745;
    }

    .resumo-value.nao-devolvidos {
      color: #dc3545;
    }

    .resumo-value.danificados {
      color: #ffc107;
    }

    .actions-section {
      background: #f8f9fa;
      padding: 1.5rem;
      border-radius: 16px;
      border: 2px solid rgba(220, 53, 69, 0.1);
    }

    .warning {
      background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
      border: 2px solid #ffc107;
      color: #856404;
      padding: 1rem;
      border-radius: 12px;
      margin-bottom: 1rem;
      font-weight: 600;
    }

    .actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
    }

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

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem;
      color: #6c757d;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #dc3545;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .recebimento {
        padding: 1rem;
      }

      .content {
        padding: 1rem;
      }

      .equipamento-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .status-options {
        grid-template-columns: 1fr;
        gap: 0.75rem;
      }

      .status-option {
        padding: 0.75rem;
      }

      .status-content {
        flex-direction: row;
        align-items: center;
        text-align: left;
        gap: 0.75rem;
      }

      .status-icon {
        font-size: 1.25rem;
        margin-bottom: 0;
      }

      .actions {
        flex-direction: column;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      .resumo-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class RecebimentoComponent implements OnInit {
  locacao: Locacao | null = null;
  itensRecebimento: ItemRecebimento[] = [];
  locacaoId: number | null = null;
  equipamentos: Equipamento[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private locacaoService: LocacaoService,
    private equipamentoService: EquipamentoService
  ) {}

  ngOnInit() {
    this.carregarEquipamentos();
    this.route.params.subscribe(params => {
      this.locacaoId = +params['id'];
      if (this.locacaoId) {
        this.carregarLocacao();
      }
    });
  }

  carregarEquipamentos() {
    this.equipamentoService.getEquipamentos().subscribe({
      next: (equipamentos) => {
        this.equipamentos = equipamentos;
      },
      error: (error) => {
        console.error('Erro ao carregar equipamentos:', error);
      }
    });
  }

  carregarLocacao() {
    if (!this.locacaoId) return;

    this.locacaoService.getLocacao(this.locacaoId).subscribe({
      next: (locacao) => {
        this.locacao = locacao;
        this.itensRecebimento = locacao.itens?.map(item => ({
          ...item,
          devolvido: false,
          observacoes: '',
          danificado: false,
          devolverQuantidade: 0
        })) || [];
      },
      error: (error) => {
        console.error('Erro ao carregar locação:', error);
        alert('Erro ao carregar informações da locação.');
        this.voltar();
      }
    });
  }

  getEquipamentoDescricao(equipamentoId: number): string {
    const equipamento = this.equipamentos.find(e => e.id === equipamentoId);
    return equipamento ? equipamento.descricao : `Equipamento ID: ${equipamentoId}`;
  }

  onStatusChange(item: ItemRecebimento) {
    // Lógica adicional quando o status muda
    if (!item.devolvido) {
      item.danificado = false;
      item.observacoes = '';
      item.devolverQuantidade = 0; // Resetar quantidade ao desmarcar devolução
    } else {
      if (!item.devolverQuantidade || item.devolverQuantidade <= 0) {
        item.devolverQuantidade = item.quantidade; // pré-preencher com total para conveniência
      }
    }
  }

  getTotalDevolvidos(): number {
    return this.itensRecebimento
      .filter(item => item.devolvido && (item.devolverQuantidade || 0) > 0)
      .length;
  }

  getTotalNaoDevolvidos(): number {
    return this.itensRecebimento.filter(item => !item.devolvido || (item.devolverQuantidade || 0) === 0).length;
  }

  getTotalDanificados(): number {
    return this.itensRecebimento.filter(item => item.danificado).length;
  }

  finalizarRecebimento() {
    if (!this.locacao || this.getTotalDevolvidos() === 0) {
      alert('Nenhum equipamento foi marcado como devolvido.');
      return;
    }

    const todosDevolvidos = this.itensRecebimento.every(item => item.devolvido && (item.devolverQuantidade || 0) === item.quantidade);
    const confirmMessage = todosDevolvidos 
      ? 'Todos os equipamentos foram devolvidos. Deseja finalizar a locação?'
      : `Atenção: ${this.getTotalNaoDevolvidos()} item(ns) não foi(ram) devolvido(s). Deseja continuar mesmo assim?`;

    if (confirm(confirmMessage)) {
      // Se todos os equipamentos foram devolvidos, finalizar a locação
      if (todosDevolvidos && this.locacaoId) {
        const itens = this.itensRecebimento.map(item => ({
          equipamento_id: item.equipamento_id,
          quantidade: item.quantidade - (item.quantidade_devolvida || 0)
        }));
        this.locacaoService.receberParcial(this.locacaoId as number, itens).subscribe({
          next: () => {
            this.locacaoService.finalizarLocacao(this.locacaoId as number).subscribe({
              next: () => {
                alert('Locação finalizada com sucesso! Todos os equipamentos foram devolvidos.');
                this.voltar();
              },
              error: (error) => {
                console.error('Erro ao finalizar locação:', error);
                alert('Erro ao finalizar locação. Tente novamente.');
              }
            });
          },
          error: (error) => {
            console.error('Erro ao registrar recebimento total:', error);
            alert('Erro ao registrar recebimento. Tente novamente.');
          }
        });
      } else {
        // Recebimento parcial via locação (atualiza quantidade_devolvida e estoque)
        const itens = this.itensRecebimento
          .filter(item => item.devolvido && (item.devolverQuantidade || 0) > 0)
          .map(item => ({ equipamento_id: item.equipamento_id, quantidade: item.devolverQuantidade as number }));

        if (itens.length === 0) {
          alert('Nenhuma quantidade válida informada para devolução.');
          return;
        }

        this.locacaoService.receberParcial(this.locacaoId as number, itens).subscribe({
          next: (locacaoAtualizada) => {
            this.locacao = locacaoAtualizada;
            alert(`Recebimento parcial registrado! ${this.getTotalDevolvidos()} item(ns) com devolução processada.`);
            this.carregarLocacao();
          },
          error: (error) => {
            console.error('Erro ao registrar recebimento parcial:', error);
            alert('Erro ao registrar recebimento parcial. Tente novamente.');
          }
        });
      }
    }
  }

  voltar() {
    this.router.navigate(['/dashboard']);
  }
}
