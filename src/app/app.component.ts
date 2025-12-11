import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from './services/auth.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  isAuthenticated = false;
  currentUser = '';
  isMobileMenuOpen = false;
  private authSubscription?: Subscription;
  private userSubscription?: Subscription;
  private sessionCheckInterval?: any;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authSubscription = this.authService.isAuthenticated$.subscribe(
      isAuth => this.isAuthenticated = isAuth
    );
    
    this.userSubscription = this.authService.currentUser$.subscribe(
      user => this.currentUser = user
    );

    // Verificar expiração da sessão a cada minuto
    this.sessionCheckInterval = setInterval(() => {
      if (this.isAuthenticated && !this.authService.isSessionValid()) {
        this.authService.logout();
        this.router.navigate(['/login']);
      }
    }, 60000); // 1 minuto
  }

  ngOnDestroy() {
    this.authSubscription?.unsubscribe();
    this.userSubscription?.unsubscribe();
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }
  }

  logout() {
    this.authService.logout();
    window.location.href = '/login';
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }

  // Fechar menu quando clicar fora ou pressionar ESC
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (this.isMobileMenuOpen && !target.closest('.nav') && !target.closest('.menu-toggle')) {
      this.closeMobileMenu();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.isMobileMenuOpen) {
      this.closeMobileMenu();
    }
  }

  isMasterUser(): boolean {
    return this.authService.isMasterUser();
  }
}
