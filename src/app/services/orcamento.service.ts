import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Orcamento, OrcamentoCreate, PaginatedResponse } from '../models/index';

@Injectable({
  providedIn: 'root'
})
export class OrcamentoService {
  constructor(private apiService: ApiService) { }

  getOrcamentos(skip: number = 0, limit: number = 100): Observable<PaginatedResponse<Orcamento>> {
    return this.apiService.getPaginated<Orcamento>('/orcamentos', skip, limit);
  }

  getOrcamento(id: number): Observable<Orcamento> {
    return this.apiService.getById<Orcamento>('/orcamentos', id);
  }

  createOrcamento(orcamento: OrcamentoCreate): Observable<Orcamento> {
    return this.apiService.post<Orcamento>('/orcamentos', orcamento);
  }

  updateOrcamento(id: number, orcamento: Partial<OrcamentoCreate>): Observable<Orcamento> {
    return this.apiService.put<Orcamento>('/orcamentos', id, orcamento);
  }

  deleteOrcamento(id: number): Observable<any> {
    return this.apiService.delete('/orcamentos', id);
  }

  aprovarOrcamento(id: number): Observable<any> {
    return this.apiService.postCustom(`/orcamentos/${id}/aprovar`);
  }

  rejeitarOrcamento(id: number): Observable<any> {
    return this.apiService.postCustom(`/orcamentos/${id}/rejeitar`);
  }

  getOrcamentosPendentes(skip: number = 0, limit: number = 100): Observable<PaginatedResponse<Orcamento>> {
    return this.apiService.getPaginated<Orcamento>('/orcamentos/pendentes', skip, limit);
  }

  getOrcamentosAprovados(skip: number = 0, limit: number = 100): Observable<PaginatedResponse<Orcamento>> {
    return this.apiService.getPaginated<Orcamento>('/orcamentos/aprovados', skip, limit);
  }
} 