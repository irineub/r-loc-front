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

  // Generic CRUD methods
  get<T>(endpoint: string): Observable<T[]> {
    const url = `${this.baseUrl}${endpoint}/`;
    console.log('GET request:', url);
    return this.http.get<T[]>(url).pipe(
      catchError(this.handleError)
    );
  }

  getById<T>(endpoint: string, id: number): Observable<T> {
    const url = `${this.baseUrl}${endpoint}/${id}/`;
    console.log('GET by ID request:', url);
    console.log('Base URL:', this.baseUrl);
    console.log('Endpoint:', endpoint);
    console.log('ID:', id);
    console.log('Full URL constructed:', url);
    return this.http.get<T>(url).pipe(
      catchError(this.handleError)
    );
  }

  post<T>(endpoint: string, data: any): Observable<T> {
    const url = `${this.baseUrl}${endpoint}/`;
    console.log('POST request:', url, data);
    console.log('Full URL being called:', url);
    return this.http.post<T>(url, data).pipe(
      catchError(this.handleError)
    );
  }

  put<T>(endpoint: string, id: number, data: any): Observable<T> {
    const url = `${this.baseUrl}${endpoint}/${id}/`;
    console.log('PUT request:', url, data);
    return this.http.put<T>(url, data).pipe(
      catchError(this.handleError)
    );
  }

  delete(endpoint: string, id: number): Observable<any> {
    const url = `${this.baseUrl}${endpoint}/${id}/`;
    console.log('DELETE request:', url);
    return this.http.delete(url).pipe(
      catchError(this.handleError)
    );
  }

  // Custom methods
  postCustom<T>(endpoint: string, data?: any): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log('POST Custom request:', url, data);
    return this.http.post<T>(url, data).pipe(
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
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      // Extrair mensagem de erro do backend se disponível
      if (error.error && error.error.detail) {
        errorMessage = error.error.detail;
      } else {
        errorMessage = `${error.status}: ${error.message || 'Erro desconhecido'}`;
      }
    }
    return throwError(() => new Error(errorMessage));
  }
} 