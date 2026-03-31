import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Locacao, PaginatedResponse } from '../models/index';

@Injectable({
  providedIn: 'root'
})
export class LocacaoService {
  constructor(private apiService: ApiService) { }

  getLocacoes(skip: number = 0, limit: number = 100): Observable<PaginatedResponse<Locacao>> {
    return this.apiService.getPaginated<Locacao>('/locacoes', skip, limit);
  }

  getLocacao(id: number): Observable<Locacao> {
    // Backend já expõe GET /locacoes/{id}/
    return this.apiService.getById<Locacao>('/locacoes', id);
  }

  createLocacaoFromOrcamento(orcamentoId: number, enderecoEntrega?: string): Observable<any> {
    const body = { endereco_entrega: enderecoEntrega || null };
    console.log('LocacaoService.createLocacaoFromOrcamento', { orcamentoId, enderecoEntrega, body });
    return this.apiService.postCustom(`/locacoes/from-orcamento/${orcamentoId}`, body);
  }

  updateLocacao(id: number, locacao: Partial<Locacao>): Observable<Locacao> {
    return this.apiService.put<Locacao>('/locacoes', id, locacao);
  }

  updateAssinatura(id: number, data: { assinatura_realizada: boolean, assinatura_base64: string | null }): Observable<any> {
    return this.apiService.patchCustom(`/locacoes/${id}/assinatura`, data);
  }

  finalizarLocacao(id: number): Observable<any> {
    return this.apiService.postCustom(`/locacoes/${id}/finalizar`);
  }

  cancelarLocacao(id: number): Observable<any> {
    return this.apiService.postCustom(`/locacoes/${id}/cancelar`);
  }

  receberParcial(id: number, itens: { equipamento_id: number, quantidade: number }[]): Observable<any> {
    return this.apiService.postCustom(`/locacoes/${id}/receber`, { itens });
  }

  getLocacoesAtivas(skip: number = 0, limit: number = 100): Observable<PaginatedResponse<Locacao>> {
    return this.apiService.getPaginated<Locacao>('/locacoes/ativas', skip, limit);
  }

  getLocacoesAtrasadas(): Observable<Locacao[]> {
    return this.apiService.get<Locacao>('/locacoes/atrasadas');
  }

  renovarLocacao(id: number, request: any): Observable<any> {
    return this.apiService.postCustom(`/locacoes/${id}/renovar`, request);
  }

  getRenovacoes(id: number): Observable<Locacao[]> {
    return this.apiService.getCustom<Locacao[]>(`/locacoes/${id}/renovacoes`);
  }
} 