import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { 
    console.log('API Service initialized with baseUrl:', this.baseUrl);
  }

  private getHeaders(): { [key: string]: string } {
    const currentUser = localStorage.getItem('currentUser') || '';
    const headers: { [key: string]: string } = {};
    if (currentUser && currentUser !== 'rloc') {
      headers['X-Funcionario-Username'] = currentUser;
    }
    return headers;
  }

  // Generic CRUD methods
  get<T>(endpoint: string): Observable<T[]> {
    // Não adicionar barra se já tiver query params
    const hasQueryParams = endpoint.includes('?');
    const url = `${this.baseUrl}${endpoint}${hasQueryParams ? '' : '/'}`;
    console.log('GET request:', url);
    return this.http.get<T[]>(url, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  getById<T>(endpoint: string, id: number): Observable<T> {
    const url = `${this.baseUrl}${endpoint}/${id}`;
    console.log('GET by ID request:', url);
    console.log('Base URL:', this.baseUrl);
    console.log('Endpoint:', endpoint);
    console.log('ID:', id);
    console.log('Full URL constructed:', url);
    return this.http.get<T>(url, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  post<T>(endpoint: string, data: any): Observable<T> {
    const url = `${this.baseUrl}${endpoint}/`;
    console.log('POST request:', url, data);
    console.log('Full URL being called:', url);
    return this.http.post<T>(url, data, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  put<T>(endpoint: string, id: number, data: any): Observable<T> {
    const url = `${this.baseUrl}${endpoint}/${id}/`;
    const updateUrl = `${this.baseUrl}${endpoint}/${id}/update`;
    console.log('PUT request:', url, data);
    // Tentar PUT primeiro, se falhar com 405, tentar PATCH, depois POST
    return this.http.put<T>(url, data, { headers: this.getHeaders() }).pipe(
      catchError((error: HttpErrorResponse) => {
        // Se for erro 405 (Method Not Allowed), tentar com PATCH
        if (error.status === 405) {
          console.log('PUT blocked by server, trying PATCH instead');
          return this.http.patch<T>(url, data, { headers: this.getHeaders() }).pipe(
            catchError((patchError: HttpErrorResponse) => {
              // Se PATCH também falhar, usar POST no endpoint /update
              if (patchError.status === 405) {
                console.log('PATCH also blocked, using POST /update endpoint');
                return this.http.post<T>(updateUrl, data, { headers: this.getHeaders() });
              }
              return this.handleError(patchError);
            })
          );
        }
        return this.handleError(error);
      })
    );
  }

  delete(endpoint: string, id: number): Observable<any> {
    const url = `${this.baseUrl}${endpoint}/${id}/`;
    console.log('DELETE request:', url);
    return this.http.delete(url, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  // Custom methods
  postCustom<T>(endpoint: string, data?: any): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log('POST Custom request:', url, data);
    return this.http.post<T>(url, data, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError = (error: HttpErrorResponse) => {
    console.error('API Error:', error);
    console.error('Error status:', error.status);
    console.error('Error message:', error.message);
    console.error('Error URL:', error.url);
    console.error('Error headers:', error.headers);
    console.error('Error body:', error.error);
    console.error('Current baseUrl:', this.baseUrl);
    
    let errorMessage = 'An error occurred';
    
    // Tratar erros de parsing JSON
    if (error.message && error.message.includes('Http failure during parsing')) {
      if (error.status === 200) {
        errorMessage = 'A resposta do servidor não é um JSON válido. Verifique se o endpoint está correto.';
      } else {
        errorMessage = `Erro ao processar resposta do servidor (Status: ${error.status})`;
      }
    } else if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      // Extrair mensagem de erro do backend se disponível
      if (error.error && error.error.detail) {
        errorMessage = error.error.detail;
      } else if (error.error && typeof error.error === 'string') {
        errorMessage = error.error;
      } else {
        errorMessage = `${error.status}: ${error.message || 'Erro desconhecido'}`;
      }
    }
    return throwError(() => new Error(errorMessage));
  }
} 