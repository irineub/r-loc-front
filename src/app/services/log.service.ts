import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface LogAuditoria {
  id: number;
  funcionario_id?: number;
  funcionario_username?: string;
  acao: string;
  entidade: string;
  entidade_id?: number;
  detalhes?: string;
  data_hora: string;
}

@Injectable({
  providedIn: 'root'
})
export class LogService {
  constructor(private apiService: ApiService) { }

  getLogs(funcionario_id?: number, entidade?: string): Observable<LogAuditoria[]> {
    let params = '';
    const queryParams: string[] = [];
    if (funcionario_id !== undefined) {
      queryParams.push(`funcionario_id=${funcionario_id}`);
    }
    if (entidade) {
      queryParams.push(`entidade=${entidade}`);
    }
    if (queryParams.length > 0) {
      params = '?' + queryParams.join('&');
    }
    return this.apiService.get<LogAuditoria>(`/logs${params}`);
  }

  getLog(id: number): Observable<LogAuditoria> {
    return this.apiService.getById<LogAuditoria>('/logs', id);
  }
}

