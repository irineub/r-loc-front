import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private currentUserSubject = new BehaviorSubject<string>('');

  public isAuthenticated$: Observable<boolean> = this.isAuthenticatedSubject.asObservable();
  public currentUser$: Observable<string> = this.currentUserSubject.asObservable();

  constructor() {
    this.checkAuthStatus();
  }

  checkAuthStatus() {
    const isAuth = localStorage.getItem('isAuthenticated') === 'true';
    const user = localStorage.getItem('currentUser') || '';
    
    this.isAuthenticatedSubject.next(isAuth);
    this.currentUserSubject.next(user);
  }

  login(username: string, password: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (username === 'rloc' && password === 'admin0609') {
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('currentUser', username);
          
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
    
    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next('');
  }

  get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  get currentUser(): string {
    return this.currentUserSubject.value;
  }
} 