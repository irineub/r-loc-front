import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
    providedIn: 'root'
})
export class RelatorioService {
    constructor(private apiService: ApiService) { }

    getRelatorio(entidade: string, start?: string, end?: string, funcionario_id?: number | null): Observable<any[]> {
        const endpointMap: { [key: string]: string } = {
            'orcamento': 'orcamentos',
            'locacao': 'locacoes',
            'cliente': 'clientes',
            'equipamento': 'equipamentos'
        };
        const mappedEntidade = endpointMap[entidade] || entidade;

        let queryParams = [];
        if (start) queryParams.push(`data_inicio=${start}`);
        if (end) queryParams.push(`data_fim=${end}`);
        if (funcionario_id) queryParams.push(`funcionario_id=${funcionario_id}`);

        const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

        return this.apiService.get<any>(`/relatorios/${mappedEntidade}${queryString}`);
    }
}
