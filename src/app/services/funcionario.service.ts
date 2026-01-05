import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

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

@Injectable({
  providedIn: 'root'
})
export class FuncionarioService {
  constructor(private apiService: ApiService) { }

  getFuncionarios(ativo?: boolean): Observable<Funcionario[]> {
    const params = ativo !== undefined ? `?ativo=${ativo}` : '';
    return this.apiService.get<Funcionario>(`/funcionarios${params}`);
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
}


