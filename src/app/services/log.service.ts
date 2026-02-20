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

  getLogs(funcionario_id?: number, entidade?: string, startDate?: string, endDate?: string): Observable<LogAuditoria[]> {
    const queryParams: string[] = [];
    if (funcionario_id !== undefined && funcionario_id !== null) {
      queryParams.push(`funcionario_id=${funcionario_id}`);
    }
    if (entidade && entidade !== null && entidade !== '') {
      queryParams.push(`entidade=${entidade}`);
    }
    if (startDate) {
      queryParams.push(`start_date=${startDate}`);
    }
    if (endDate) {
      queryParams.push(`end_date=${endDate}`);
    }

    let endpoint = '/logs';
    if (queryParams.length > 0) {
      endpoint += '?' + queryParams.join('&');
    }

    return this.apiService.get<LogAuditoria>(endpoint);
  }

  getLog(id: number): Observable<LogAuditoria> {
    return this.apiService.getById<LogAuditoria>('/logs', id);
  }
}

