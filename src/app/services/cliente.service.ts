import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Cliente, ClienteCreate, PaginatedResponse } from '../models/index';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  constructor(private apiService: ApiService) { }

  getClientes(skip: number = 0, limit: number = 100): Observable<PaginatedResponse<Cliente>> {
    return this.apiService.getPaginated<Cliente>('/clientes', skip, limit);
  }

  getCliente(id: number): Observable<Cliente> {
    return this.apiService.getById<Cliente>('/clientes', id);
  }

  createCliente(cliente: ClienteCreate): Observable<Cliente> {
    return this.apiService.post<Cliente>('/clientes', cliente);
  }

  updateCliente(id: number, cliente: Partial<ClienteCreate>): Observable<Cliente> {
    return this.apiService.put<Cliente>('/clientes', id, cliente);
  }

  deleteCliente(id: number): Observable<any> {
    return this.apiService.delete('/clientes', id);
  }
} 