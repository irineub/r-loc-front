import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Equipamento, EquipamentoCreate } from '../models/index';

@Injectable({
  providedIn: 'root'
})
export class EquipamentoService {
  constructor(private apiService: ApiService) { }

  getEquipamentos(): Observable<Equipamento[]> {
    return this.apiService.get<Equipamento>('/equipamentos');
  }

  getEquipamento(id: number): Observable<Equipamento> {
    return this.apiService.getById<Equipamento>('/equipamentos', id);
  }

  createEquipamento(equipamento: EquipamentoCreate): Observable<Equipamento> {
    return this.apiService.post<Equipamento>('/equipamentos', equipamento);
  }

  updateEquipamento(id: number, equipamento: Partial<EquipamentoCreate>): Observable<Equipamento> {
    return this.apiService.put<Equipamento>('/equipamentos', id, equipamento);
  }

  deleteEquipamento(id: number): Observable<any> {
    return this.apiService.delete('/equipamentos', id);
  }
} 