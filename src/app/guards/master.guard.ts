import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class MasterGuard implements CanActivate {
  
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  canActivate(): boolean {
    if (!this.authService.isAuthenticated) {
      this.router.navigate(['/login']);
      return false;
    }
    
    if (!this.authService.isMasterUser()) {
      // Redirecionar para dashboard se não for master
      this.router.navigate(['/dashboard']);
      return false;
    }
    
    return true;
  }
}

