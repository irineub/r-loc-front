import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from './services/auth.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { WhatsappService } from './services/whatsapp.service';
import { FormsModule } from '@angular/forms';
import { SnackbarService } from './services/snackbar.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
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

  // Configuração Uazapi
  showConfigModal = false;
  uazapiConfig = { url: '', token: '' };
  uploadConfig = { use_base64: true, public_url: '' };
  isLoadingConfig = false;
  showToken = false;
  activeConfigTab: 'whatsapp' | 'timezone' | 'upload' = 'whatsapp';

  constructor(
    private authService: AuthService,
    private router: Router,
    private whatsappService: WhatsappService,
    private snackbarService: SnackbarService
  ) { }

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

  timezone = 'America/Manaus';
  timezones = ['America/Manaus', 'America/Sao_Paulo', 'America/Fortaleza', 'America/Rio_Branco', 'America/Belem', 'UTC'];

  openConfigModal() {
    this.isLoadingConfig = true;
    this.showConfigModal = true;
    import('rxjs').then(({ forkJoin }) => {
      forkJoin({
        uazapi: this.whatsappService.getCredentials(),
        timezone: this.whatsappService.getTimezoneConfig(),
        upload: this.whatsappService.getUploadConfig()
      }).subscribe({
        next: (results) => {
          this.uazapiConfig = results.uazapi;
          this.timezone = results.timezone.timezone;
          if (results.upload) {
            this.uploadConfig = results.upload;
          }
          this.isLoadingConfig = false;
        },
        error: (err) => {
          console.error('Erro ao carregar configurações', err);
          this.isLoadingConfig = false;
        }
      });
    });
  }

  closeConfigModal() {
    this.showConfigModal = false;
    this.showToken = false;
  }

  saveConfig() {
    this.isLoadingConfig = true;
    import('rxjs').then(({ forkJoin }) => {
      forkJoin([
        this.whatsappService.updateCredentials(this.uazapiConfig.url, this.uazapiConfig.token),
        this.whatsappService.updateTimezoneConfig(this.timezone),
        this.whatsappService.updateUploadConfig(this.uploadConfig.use_base64, this.uploadConfig.public_url)
      ]).subscribe({
        next: () => {
          this.snackbarService.success('Configurações salvas com sucesso!');
          this.isLoadingConfig = false;
          this.closeConfigModal();
        },
        error: (err) => {
          console.error('Erro ao salvar configurações', err);
          this.snackbarService.error('Erro ao salvar configurações.');
          this.isLoadingConfig = false;
        }
      });
    });
  }
}
