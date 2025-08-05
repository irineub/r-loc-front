import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    // Verificar se já está logado e redirecionar
    if (this.authService.isSessionValid()) {
      this.router.navigate(['/dashboard']);
    }
  }

  async onLogin() {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const success = await this.authService.login(this.username, this.password);
      
      if (success) {
        this.router.navigate(['/dashboard']);
      } else {
        this.errorMessage = 'Usuário ou senha incorretos!';
        this.password = '';
      }
    } catch (error) {
      this.errorMessage = 'Erro ao fazer login. Tente novamente.';
      this.password = '';
    } finally {
      this.isLoading = false;
    }
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.onLogin();
    }
  }
} 