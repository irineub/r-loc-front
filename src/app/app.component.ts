import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
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
  isDarkMode = false;
  private authSubscription?: Subscription;
  private userSubscription?: Subscription;
  private sessionCheckInterval?: any;

  // Configuração Uazapi
  showConfigModal = false;
  uazapiConfig = { url: '', token: '' };
  uploadConfig = { use_base64: true, public_url: '' };
  isLoadingConfig = false;
  showToken = false;
  activeConfigTab: 'whatsapp' | 'timezone' | 'upload' | 'assinatura' = 'whatsapp';

  // Assinatura da locadora
  assinaturaConfig = { assinatura_base64: '' };
  signatureState: 'empty' | 'saved' | 'drawing' = 'empty';
  @ViewChild('configSignatureCanvas') configCanvasRef!: ElementRef<HTMLCanvasElement>;
  private configCx!: CanvasRenderingContext2D;
  private configIsDrawing = false;
  private configHasSignature = false;

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

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.isDarkMode = true;
      document.body.classList.add('dark-mode');
    }

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

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
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
        upload: this.whatsappService.getUploadConfig(),
        assinatura: this.whatsappService.getSignatureConfig()
      }).subscribe({
        next: (results) => {
          this.uazapiConfig = results.uazapi;
          this.timezone = results.timezone.timezone;
          if (results.upload) {
            this.uploadConfig = results.upload;
          }
          if (results.assinatura) {
            this.assinaturaConfig = results.assinatura;
            this.signatureState = results.assinatura.assinatura_base64 ? 'saved' : 'empty';
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
        this.whatsappService.updateUploadConfig(this.uploadConfig.use_base64, this.uploadConfig.public_url),
        this.whatsappService.updateSignatureConfig(this.assinaturaConfig.assinatura_base64)
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

  // --- Assinatura Canvas Methods ---
  initConfigCanvas() {
    setTimeout(() => {
      if (!this.configCanvasRef) return;
      const canvasEl = this.configCanvasRef.nativeElement;
      canvasEl.width = canvasEl.offsetWidth || 500;
      canvasEl.height = canvasEl.offsetHeight || 180;
      const ctx = canvasEl.getContext('2d');
      if (ctx) {
        this.configCx = ctx;
        this.configCx.lineWidth = 3;
        this.configCx.lineCap = 'round';
        this.configCx.strokeStyle = '#000000';
      }
    }, 100);
  }

  onConfigTabChange(tab: 'whatsapp' | 'timezone' | 'upload' | 'assinatura') {
    this.activeConfigTab = tab;
    if (tab === 'assinatura' && this.signatureState === 'drawing') {
      this.initConfigCanvas();
    }
  }

  startNewSignature() {
    this.signatureState = 'drawing';
    this.configHasSignature = false;
    this.initConfigCanvas();
  }

  getConfigCanvasPos(event: MouseEvent | TouchEvent) {
    const canvasEl = this.configCanvasRef.nativeElement;
    const rect = canvasEl.getBoundingClientRect();
    let clientX, clientY;
    if (event instanceof TouchEvent) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }
    const scaleX = canvasEl.width / rect.width;
    const scaleY = canvasEl.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  configStartDrawing(event: MouseEvent | TouchEvent) {
    if (this.signatureState !== 'drawing') return;
    event.preventDefault();
    this.configIsDrawing = true;
    const pos = this.getConfigCanvasPos(event);
    this.configCx.beginPath();
    this.configCx.moveTo(pos.x, pos.y);
  }

  configDraw(event: MouseEvent | TouchEvent) {
    if (!this.configIsDrawing) return;
    event.preventDefault();
    const pos = this.getConfigCanvasPos(event);
    this.configCx.lineTo(pos.x, pos.y);
    this.configCx.stroke();
    this.configHasSignature = true;
  }

  configStopDrawing() {
    if (!this.configIsDrawing) return;
    this.configIsDrawing = false;
    this.configCx.closePath();
  }

  configClearSignature() {
    if (!this.configCx || !this.configCanvasRef) return;
    const canvasEl = this.configCanvasRef.nativeElement;
    this.configCx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    this.configHasSignature = false;
  }

  configSaveSignature() {
    if (!this.configHasSignature) {
      this.snackbarService.error('Desenhe a assinatura antes de salvar.');
      return;
    }
    const dataUrl = this.configCanvasRef.nativeElement.toDataURL('image/png');
    this.assinaturaConfig.assinatura_base64 = dataUrl;
    this.signatureState = 'saved';
    this.snackbarService.success('Assinatura capturada! Clique em Salvar para confirmar.');
  }

  configRemoveSignature() {
    this.assinaturaConfig.assinatura_base64 = '';
    this.signatureState = 'empty';
  }
}
