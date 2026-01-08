import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CurrencyBrPipe } from '../../pipes/currency-br.pipe';
import { ClienteService } from '../../services/cliente.service';
import { OrcamentoService } from '../../services/orcamento.service';
import { LocacaoService } from '../../services/locacao.service';
import { Cliente, Orcamento, Locacao } from '../../models/index';

@Component({
  selector: 'app-cliente-detalhes',
  standalone: true,
  imports: [CommonModule, RouterModule, CurrencyBrPipe],
  template: `
    <div class="cliente-detalhes">
      <div class="card">
        <div class="card-header">
          <div class="header-left">
            <button class="btn btn-secondary btn-sm" (click)="voltar()">
              ← Voltar
            </button>
            <h2 class="card-title">Detalhes do Cliente</h2>
          </div>
        </div>

        <div class="content" *ngIf="cliente">
          <!-- Informações do Cliente -->
          <div class="cliente-info-section">
            <h3>Informações do Cliente</h3>
            <div class="info-grid">
              <div class="info-item">
                <strong>ID:</strong> {{ cliente.id }}
              </div>
              <div class="info-item">
                <strong>Nome/Razão Social:</strong> {{ cliente.nome_razao_social }}
              </div>
              <div class="info-item">
                <strong>Tipo:</strong> 
                <span class="badge" [class]="cliente.tipo_pessoa === 'fisica' ? 'badge-primary' : 'badge-secondary'">
                  {{ cliente.tipo_pessoa === 'fisica' ? 'Pessoa Física' : 'Pessoa Jurídica' }}
                </span>
              </div>
              <div class="info-item" *ngIf="cliente.cpf">
                <strong>CPF:</strong> {{ cliente.cpf }}
              </div>
              <div class="info-item" *ngIf="cliente.cnpj">
                <strong>CNPJ:</strong> {{ cliente.cnpj }}
              </div>
              <div class="info-item" *ngIf="cliente.rg">
                <strong>RG:</strong> {{ cliente.rg }}
              </div>
              <div class="info-item" *ngIf="cliente.inscricao_estadual">
                <strong>Inscrição Estadual:</strong> {{ cliente.inscricao_estadual }}
              </div>
              <div class="info-item" *ngIf="cliente.telefone_comercial">
                <strong>Telefone Comercial:</strong> {{ cliente.telefone_comercial }}
              </div>
              <div class="info-item" *ngIf="cliente.telefone_celular">
                <strong>Telefone Celular:</strong> {{ cliente.telefone_celular }}
              </div>
              <div class="info-item" *ngIf="cliente.email">
                <strong>E-mail:</strong> {{ cliente.email }}
              </div>
              <div class="info-item" *ngIf="cliente.endereco">
                <strong>Endereço:</strong> {{ cliente.endereco }}
              </div>
              <div class="info-item">
                <strong>Data de Cadastro:</strong> {{ cliente.data_cadastro | date:'dd/MM/yyyy' }}
              </div>
            </div>
          </div>

          <!-- Orçamentos -->
          <div class="section">
            <h3>Orçamentos ({{ orcamentos.length }})</h3>
            <div class="cards-grid" *ngIf="orcamentos.length > 0">
              <div class="item-card" *ngFor="let orcamento of orcamentos">
                <div class="card-header-small">
                  <div class="card-id">Orçamento #{{ orcamento.id }}</div>
                  <span class="badge" [class]="'badge-' + orcamento.status">
                    {{ orcamento.status }}
                  </span>
                </div>
                <div class="card-body-small">
                  <div class="info-item">
                    <strong>Data Início:</strong> {{ orcamento.data_inicio | date:'dd/MM/yyyy' }}
                  </div>
                  <div class="info-item">
                    <strong>Data Fim:</strong> {{ orcamento.data_fim | date:'dd/MM/yyyy' }}
                  </div>
                  <div class="info-item">
                    <strong>Total:</strong> {{ orcamento.total_final | currencyBr }}
                  </div>
                  <div class="info-item" *ngIf="orcamento.observacoes">
                    <strong>Observações:</strong> {{ orcamento.observacoes }}
                  </div>
                </div>
                <div class="card-actions">
                  <button class="action-btn view" (click)="irParaOrcamento(orcamento.id)">
                    Ver Detalhes
                  </button>
                </div>
              </div>
            </div>
            <div class="no-results" *ngIf="orcamentos.length === 0">
              <p>Nenhum orçamento encontrado para este cliente.</p>
            </div>
          </div>

          <!-- Locações -->
          <div class="section">
            <h3>Locações ({{ locacoes.length }})</h3>
            <div class="cards-grid" *ngIf="locacoes.length > 0">
              <div class="item-card" *ngFor="let locacao of locacoes">
                <div class="card-header-small">
                  <div class="card-id">Locação #{{ locacao.id }}</div>
                  <span class="badge" [class]="'badge-' + locacao.status">
                    {{ locacao.status }}
                  </span>
                </div>
                <div class="card-body-small">
                  <div class="info-item">
                    <strong>Data Início:</strong> {{ locacao.data_inicio | date:'dd/MM/yyyy' }}
                  </div>
                  <div class="info-item">
                    <strong>Data Fim:</strong> {{ locacao.data_fim | date:'dd/MM/yyyy' }}
                  </div>
                  <div class="info-item" *ngIf="locacao.data_devolucao">
                    <strong>Data Devolução:</strong> {{ locacao.data_devolucao | date:'dd/MM/yyyy' }}
                  </div>
                  <div class="info-item">
                    <strong>Total:</strong> {{ locacao.total_final | currencyBr }}
                  </div>
                  <div class="info-item" *ngIf="locacao.endereco_entrega">
                    <strong>Endereço Entrega:</strong> {{ locacao.endereco_entrega }}
                  </div>
                </div>
                <div class="card-actions">
                  <button class="action-btn view" (click)="irParaLocacao(locacao.id)">
                    Ver Detalhes
                  </button>
                </div>
              </div>
            </div>
            <div class="no-results" *ngIf="locacoes.length === 0">
              <p>Nenhuma locação encontrada para este cliente.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cliente-detalhes {
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

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .card-title {
      font-size: 1.75rem;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.02em;
      font-family: 'Inter', sans-serif;
    }

    .content {
      padding: 2rem;
    }

    .cliente-info-section,
    .section {
      margin-bottom: 2rem;
    }

    .cliente-info-section h3,
    .section h3 {
      color: #dc3545;
      margin-bottom: 1.5rem;
      font-size: 1.5rem;
      font-weight: 700;
      font-family: 'Inter', sans-serif;
      letter-spacing: -0.02em;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      background: #f9fafb;
      padding: 1.5rem;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .info-item strong {
      font-size: 0.875rem;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .info-item span:not(.badge) {
      font-size: 0.9375rem;
      font-weight: 500;
      color: #374151;
    }

    .badge {
      font-weight: 600;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-size: 0.8125rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: inline-block;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
      border: 2px solid transparent;
    }

    .badge-primary {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
    }

    .badge-secondary {
      background: linear-gradient(135deg, #6b7280, #4b5563);
      color: white;
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

    .badge-ativa {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
    }

    .badge-finalizada {
      background: linear-gradient(135deg, #6b7280, #4b5563);
      color: white;
    }

    .badge-cancelada {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
    }

    .badge-atrasada {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white;
    }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }

    .item-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(220, 53, 69, 0.1);
      border: 2px solid rgba(220, 53, 69, 0.1);
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
    }

    .item-card:hover {
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

    .card-body-small .info-item {
      margin-bottom: 0.75rem;
    }

    .card-body-small .info-item:last-child {
      margin-bottom: 0;
    }

    .card-actions {
      padding: 1rem 1.5rem;
      border-top: 1px solid #e5e7eb;
      display: flex;
      gap: 0.5rem;
      background: #f9fafb;
    }

    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.625rem 1rem;
      border: none;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-size: 0.8125rem;
      text-decoration: none;
      white-space: nowrap;
      letter-spacing: 0.01em;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
      flex: 1;
      justify-content: center;
    }

    .action-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
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
      background: #f9fafb;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 12px;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      font-size: 0.9375rem;
      position: relative;
      overflow: hidden;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
      letter-spacing: 0.01em;
      justify-content: center;
      font-family: 'Inter', sans-serif;
      line-height: 1.5;
    }

    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
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

    .btn-sm {
      padding: 0.625rem 1.25rem;
      font-size: 0.875rem;
      border-radius: 10px;
      min-width: 100px;
      font-weight: 600;
    }

    @media (max-width: 768px) {
      .cliente-detalhes {
        padding: 1rem;
      }

      .card-header {
        padding: 1.5rem;
        flex-direction: column;
        align-items: flex-start;
      }

      .header-left {
        flex-direction: column;
        align-items: flex-start;
        width: 100%;
        gap: 1rem;
      }

      .content {
        padding: 1.5rem;
      }

      .info-grid {
        grid-template-columns: 1fr;
        padding: 1rem;
      }

      .cards-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .card-actions {
        flex-direction: column;
      }

      .action-btn {
        width: 100%;
      }
    }

    @media (max-width: 480px) {
      .cliente-detalhes {
        padding: 0.75rem;
      }

      .card-header {
        padding: 1.25rem;
      }

      .content {
        padding: 1rem;
      }

      .card-body-small {
        padding: 1rem;
      }
    }
  `]
})
export class ClienteDetalhesComponent implements OnInit {
  cliente: Cliente | null = null;
  orcamentos: Orcamento[] = [];
  locacoes: Locacao[] = [];
  clienteId: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clienteService: ClienteService,
    private orcamentoService: OrcamentoService,
    private locacaoService: LocacaoService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.clienteId = +params['id'];
      this.loadData();
    });
  }

  loadData() {
    // Carregar cliente
    this.clienteService.getCliente(this.clienteId).subscribe({
      next: (cliente) => {
        this.cliente = cliente;
      },
      error: (error) => {
        console.error('Erro ao carregar cliente:', error);
        alert('Cliente não encontrado');
        this.voltar();
      }
    });

    // Carregar orçamentos
    this.orcamentoService.getOrcamentos().subscribe({
      next: (orcamentos) => {
        this.orcamentos = orcamentos.filter(o => o.cliente_id === this.clienteId);
      },
      error: (error) => {
        console.error('Erro ao carregar orçamentos:', error);
        this.orcamentos = [];
      }
    });

    // Carregar locações
    this.locacaoService.getLocacoes().subscribe({
      next: (locacoes) => {
        this.locacoes = locacoes.filter(l => l.cliente_id === this.clienteId);
      },
      error: (error) => {
        console.error('Erro ao carregar locações:', error);
        this.locacoes = [];
      }
    });
  }

  voltar() {
    this.router.navigate(['/clientes']);
  }

  irParaOrcamento(id: number) {
    this.router.navigate(['/orcamentos']);
    // O componente de orçamentos pode abrir o modal automaticamente se necessário
    setTimeout(() => {
      const orcamentoElement = document.querySelector(`[data-orcamento-id="${id}"]`);
      if (orcamentoElement) {
        (orcamentoElement as HTMLElement).click();
      }
    }, 100);
  }

  irParaLocacao(id: number) {
    this.router.navigate(['/locacoes']);
    // O componente de locações pode abrir o modal automaticamente se necessário
    setTimeout(() => {
      const locacaoElement = document.querySelector(`[data-locacao-id="${id}"]`);
      if (locacaoElement) {
        (locacaoElement as HTMLElement).click();
      }
    }, 100);
  }
}

