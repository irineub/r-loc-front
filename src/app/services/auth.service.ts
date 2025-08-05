import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private currentUserSubject = new BehaviorSubject<string>('');
  private readonly TOKEN_EXPIRY_KEY = 'tokenExpiry';
  private readonly SESSION_DURATION = 30 * 60 * 1000; // 30 minutos em millisegundos

  public isAuthenticated$: Observable<boolean> = this.isAuthenticatedSubject.asObservable();
  public currentUser$: Observable<string> = this.currentUserSubject.asObservable();

  constructor() {
    this.checkAuthStatus();
  }

  checkAuthStatus() {
    const isAuth = localStorage.getItem('isAuthenticated') === 'true';
    const user = localStorage.getItem('currentUser') || '';
    const tokenExpiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    
    // Verificar se a sessão expirou
    if (isAuth && tokenExpiry) {
      const expiryTime = parseInt(tokenExpiry);
      const currentTime = Date.now();
      
      if (currentTime > expiryTime) {
        // Sessão expirou, fazer logout
        this.logout();
        return;
      }
    }
    
    this.isAuthenticatedSubject.next(isAuth);
    this.currentUserSubject.next(user);
  }

  login(username: string, password: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (username === 'rloc' && password === 'admin0609') {
          const expiryTime = Date.now() + this.SESSION_DURATION;
          
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('currentUser', username);
          localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
          
          this.isAuthenticatedSubject.next(true);
          this.currentUserSubject.next(username);
          
          resolve(true);
        } else {
          resolve(false);
        }
      }, 1000);
    });
  }

  logout() {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('currentUser');
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    
    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next('');
  }

  get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  get currentUser(): string {
    return this.currentUserSubject.value;
  }

  isSessionValid(): boolean {
    const isAuth = localStorage.getItem('isAuthenticated') === 'true';
    const tokenExpiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    
    if (!isAuth || !tokenExpiry) {
      return false;
    }
    
    const expiryTime = parseInt(tokenExpiry);
    const currentTime = Date.now();
    
    return currentTime <= expiryTime;
  }
} 