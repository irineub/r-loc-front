// Interfaces para Cliente
export interface Cliente {
  id: number;
  nome_razao_social: string;
  email: string;
  telefone_comercial?: string;
  telefone_celular?: string;
  tipo_pessoa: 'fisica' | 'juridica';
  cpf?: string;
  cnpj?: string;
  rg?: string;
  inscricao_estadual?: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  observacoes?: string;
  data_cadastro: string;
}

export interface ClienteCreate {
  nome_razao_social: string;
  email: string;
  telefone_comercial?: string;
  telefone_celular?: string;
  tipo_pessoa: 'fisica' | 'juridica';
  cpf?: string;
  cnpj?: string;
  rg?: string;
  inscricao_estadual?: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  observacoes?: string;
}

export interface ClienteUpdate {
  nome_razao_social?: string;
  email?: string;
  telefone_comercial?: string;
  telefone_celular?: string;
  tipo_pessoa?: 'fisica' | 'juridica';
  cpf?: string;
  cnpj?: string;
  rg?: string;
  inscricao_estadual?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  observacoes?: string;
}

// Interfaces para Equipamento
export interface Equipamento {
  id: number;
  descricao: string;
  unidade: string;
  preco_unitario: number;
  estoque: number;
  estoque_alugado: number;
  estoque_disponivel: number;
}

export interface EquipamentoCreate {
  descricao: string;
  unidade: string;
  preco_unitario: number;
  estoque: number;
}

export interface EquipamentoUpdate {
  descricao?: string;
  unidade?: string;
  preco_unitario?: number;
  estoque?: number;
}

// Interfaces para Orçamento
export interface Orcamento {
  id: number;
  cliente_id: number;
  data_inicio: string;
  data_fim: string;
  data_criacao: string;
  data_validade: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  subtotal: number;
  total_final: number;
  desconto: number;
  frete: number;
  tipo_cobranca: 'diaria' | 'mensal';
  observacoes?: string;
  cliente?: Cliente;
  itens?: ItemOrcamento[];
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

export interface OrcamentoUpdate {
  cliente_id?: number;
  data_inicio?: string;
  data_fim?: string;
  data_validade?: string;
  status?: 'pendente' | 'aprovado' | 'rejeitado';
  desconto?: number;
  frete?: number;
  total_final?: number;
  observacoes?: string;
}

// Interfaces para Item de Orçamento
export interface ItemOrcamento {
  id: number;
  orcamento_id: number;
  equipamento_id: number;
  quantidade: number;
  dias: number;
  preco_unitario: number;
  subtotal: number;
  equipamento?: Equipamento;
}

export interface ItemOrcamentoCreate {
  equipamento_id: number;
  quantidade: number;
  dias: number;
  preco_unitario: number;
  subtotal: number;
  tipo_cobranca: 'diaria' | 'mensal';
}

// Interfaces para Locação
export interface Locacao {
  id: number;
  orcamento_id: number;
  data_inicio: string;
  data_fim: string;
  data_devolucao?: string;
  status: 'ativa' | 'finalizada' | 'cancelada' | 'atrasada';
  valor_total: number;
  total_final: number;
  observacoes?: string;
  orcamento?: Orcamento;
  cliente?: Cliente;
  itens?: ItemLocacao[];
}

export interface LocacaoCreate {
  orcamento_id: number;
  data_inicio: string;
  data_fim: string;
  observacoes?: string;
}

export interface LocacaoUpdate {
  orcamento_id?: number;
  data_inicio?: string;
  data_fim?: string;
  data_devolucao?: string;
  status?: 'ativa' | 'finalizada' | 'cancelada' | 'atrasada';
  observacoes?: string;
}

// Interfaces para Item de Locação
export interface ItemLocacao {
  id: number;
  locacao_id: number;
  equipamento_id: number;
  quantidade: number;
  dias: number;
  preco_unitario: number;
  subtotal: number;
  equipamento?: Equipamento;
}

export interface ItemLocacaoCreate {
  equipamento_id: number;
  quantidade: number;
  dias: number;
} 