import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { PaginatedResponse } from '../models/index';

export interface Funcionario {
  id: number;
  username: string;
  nome: string;
  ativo: boolean;
  data_cadastro: string;
}

export interface FuncionarioCreate {
  username: string;
  nome: string;
  senha: string;
  ativo?: boolean;
}

export interface FuncionarioUpdate {
  nome?: string;
  senha?: string;
  ativo?: boolean;
}

export interface FuncionarioSenhaConsultaResponse {
  senha: string | null;
  message?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class FuncionarioService {
  constructor(private apiService: ApiService) { }

  getFuncionarios(ativo?: boolean, skip: number = 0, limit: number = 100): Observable<PaginatedResponse<Funcionario>> {
    const params = ativo !== undefined ? `?ativo=${ativo}` : '';
    const endpoint = `/funcionarios${params}`;
    return this.apiService.getPaginated<Funcionario>(endpoint, skip, limit);
  }

  getFuncionario(id: number): Observable<Funcionario> {
    return this.apiService.getById<Funcionario>('/funcionarios', id);
  }

  createFuncionario(funcionario: FuncionarioCreate): Observable<Funcionario> {
    return this.apiService.post<Funcionario>('/funcionarios', funcionario);
  }

  updateFuncionario(id: number, funcionario: FuncionarioUpdate): Observable<Funcionario> {
    return this.apiService.put<Funcionario>('/funcionarios', id, funcionario);
  }

  deleteFuncionario(id: number): Observable<any> {
    return this.apiService.delete('/funcionarios', id);
  }

  consultarSenha(id: number, senhaAutorizacao: string): Observable<FuncionarioSenhaConsultaResponse> {
    return this.apiService.postCustom<FuncionarioSenhaConsultaResponse>(
      `/funcionarios/${id}/consultar-senha`,
      { senha_autorizacao: senhaAutorizacao }
    );
  }
}


