import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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

  constructor(private router: Router) {}

  onLogin() {
    this.isLoading = true;
    this.errorMessage = '';

    // Simular delay de autenticação
    setTimeout(() => {
      if (this.username === 'rloc' && this.password === 'admin0609') {
        // Login bem-sucedido
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('currentUser', this.username);
        this.router.navigate(['/dashboard']);
      } else {
        // Login falhou
        this.errorMessage = 'Usuário ou senha incorretos!';
        this.password = '';
      }
      this.isLoading = false;
    }, 1000);
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.onLogin();
    }
  }
} 