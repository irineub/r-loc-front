import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Orcamento, OrcamentoCreate } from '../models/index';

@Injectable({
  providedIn: 'root'
})
export class OrcamentoService {
  constructor(private apiService: ApiService) { }

  getOrcamentos(): Observable<Orcamento[]> {
    return this.apiService.get<Orcamento>('/orcamentos');
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

  getOrcamentosPendentes(): Observable<Orcamento[]> {
    return this.apiService.get<Orcamento>('/orcamentos/pendentes');
  }

  getOrcamentosAprovados(): Observable<Orcamento[]> {
    return this.apiService.get<Orcamento>('/orcamentos/aprovados');
  }
} 