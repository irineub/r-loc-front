export interface Cliente {
  id: number;
  nome_razao_social: string;
  endereco?: string;
  telefone_comercial?: string;
  telefone_ramal?: string;
  telefone_celular?: string;
  cpf?: string;
  cnpj?: string;
  rg?: string;
  inscricao_municipal?: string;
  inscricao_estadual?: string;
  email?: string;
  tipo_pessoa: 'fisica' | 'juridica';
  cidade: string;
  estado: string;
  cep: string;
  data_cadastro: string;
  observacoes?: string;
}

export interface Equipamento {
  id: number;
  descricao: string;
  unidade: string;
  preco_diaria: number;
  preco_semanal: number;
  preco_quinzenal: number;
  preco_mensal: number;
  estoque: number;
  estoque_alugado: number;
  estoque_disponivel: number;
}

export interface ItemOrcamento {
  id: number;
  orcamento_id: number;
  equipamento_id: number;
  quantidade: number;
  preco_unitario: number;
  dias: number;
  tipo_cobranca: 'diaria' | 'semanal' | 'quinzenal' | 'mensal';
  subtotal: number;
  equipamento: Equipamento;
}

export interface Orcamento {
  id: number;
  cliente_id: number;
  data_inicio: string;
  data_fim: string;
  desconto: number;
  frete: number;
  total_final: number;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  observacoes?: string;
  data_criacao: string;
  cliente: Cliente;
  itens: ItemOrcamento[];
}

export interface ItemLocacao {
  id: number;
  locacao_id: number;
  equipamento_id: number;
  quantidade: number;
  quantidade_devolvida?: number;
  preco_unitario: number;
  dias: number;
  subtotal: number;
  equipamento: Equipamento;
}

export interface Locacao {
  id: number;
  orcamento_id: number;
  cliente_id: number;
  data_inicio: string;
  data_fim: string;
  status: 'ativa' | 'finalizada' | 'cancelada' | 'atrasada';
  total_final: number;
  observacoes?: string;
  data_devolucao?: string;
  endereco_entrega?: string;
  data_criacao: string;
  orcamento: Orcamento;
  cliente: Cliente;
  itens: ItemLocacao[];
}

// Create/Update interfaces
export interface ClienteCreate {
  nome_razao_social: string;
  endereco?: string;
  telefone_comercial?: string;
  telefone_ramal?: string;
  telefone_celular?: string;
  cpf?: string;
  cnpj?: string;
  rg?: string;
  inscricao_municipal?: string;
  inscricao_estadual?: string;
  email?: string;
  tipo_pessoa: 'fisica' | 'juridica';
  cidade: string;
  estado: string;
  cep: string;
  observacoes?: string;
}

export interface EquipamentoCreate {
  descricao: string;
  unidade: string;
  preco_diaria: number;
  preco_semanal: number;
  preco_quinzenal: number;
  preco_mensal: number;
  estoque: number;
}

export interface ItemOrcamentoCreate {
  equipamento_id: number;
  quantidade: number;
  preco_unitario: number;
  dias: number;
  tipo_cobranca: 'diaria' | 'semanal' | 'quinzenal' | 'mensal';
  subtotal: number;
}

export interface OrcamentoCreate {
  cliente_id: number;
  data_inicio: string;
  data_fim: string;
  desconto: number;
  frete: number;
  total_final: number;
  observacoes?: string;
  itens: ItemOrcamentoCreate[];
} 