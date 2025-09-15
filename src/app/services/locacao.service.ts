import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Locacao } from '../models/index';

@Injectable({
  providedIn: 'root'
})
export class LocacaoService {
  constructor(private apiService: ApiService) { }

  getLocacoes(): Observable<Locacao[]> {
    return this.apiService.get<Locacao>('/locacoes');
  }

  getLocacao(id: number): Observable<Locacao> {
    // Workaround: Use a lista de locações e filtre pelo ID
    // até que a rota GET /api/locacoes/{id}/ seja corrigida no backend
    return this.apiService.get<Locacao>('/locacoes').pipe(
      map(locacoes => {
        const locacao = locacoes.find(l => l.id === id);
        if (!locacao) {
          throw new Error(`Locação com ID ${id} não encontrada`);
        }
        return locacao;
      })
    );
  }

  createLocacaoFromOrcamento(orcamentoId: number): Observable<any> {
    return this.apiService.postCustom(`/locacoes/from-orcamento/${orcamentoId}`);
  }

  updateLocacao(id: number, locacao: Partial<Locacao>): Observable<Locacao> {
    return this.apiService.put<Locacao>('/locacoes', id, locacao);
  }

  finalizarLocacao(id: number): Observable<any> {
    return this.apiService.postCustom(`/locacoes/${id}/finalizar`);
  }

  cancelarLocacao(id: number): Observable<any> {
    return this.apiService.postCustom(`/locacoes/${id}/cancelar`);
  }

  getLocacoesAtivas(): Observable<Locacao[]> {
    return this.apiService.get<Locacao>('/locacoes/ativas');
  }

  getLocacoesAtrasadas(): Observable<Locacao[]> {
    return this.apiService.get<Locacao>('/locacoes/atrasadas');
  }
} 