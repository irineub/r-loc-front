import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FuncionarioService, FuncionarioCreate } from '../../services/funcionario.service';

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
  showCadastro: boolean = false;
  
  // Formulário de cadastro
  cadastroUsername: string = '';
  cadastroNome: string = '';
  cadastroSenha: string = '';
  cadastroConfirmarSenha: string = '';
  successMessage: string = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private funcionarioService: FuncionarioService
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
      if (this.showCadastro) {
        this.onCadastrar();
      } else {
        this.onLogin();
      }
    }
  }

  toggleCadastro() {
    this.showCadastro = !this.showCadastro;
    this.errorMessage = '';
    this.successMessage = '';
    this.cadastroUsername = '';
    this.cadastroNome = '';
    this.cadastroSenha = '';
    this.cadastroConfirmarSenha = '';
  }

  async onCadastrar() {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Validações
    if (!this.cadastroUsername || !this.cadastroNome || !this.cadastroSenha) {
      this.errorMessage = 'Preencha todos os campos obrigatórios!';
      this.isLoading = false;
      return;
    }

    if (this.cadastroSenha.length < 4) {
      this.errorMessage = 'A senha deve ter pelo menos 4 caracteres!';
      this.isLoading = false;
      return;
    }

    if (this.cadastroSenha !== this.cadastroConfirmarSenha) {
      this.errorMessage = 'As senhas não coincidem!';
      this.isLoading = false;
      return;
    }

    try {
      const funcionario: FuncionarioCreate = {
        username: this.cadastroUsername,
        nome: this.cadastroNome,
        senha: this.cadastroSenha,
        ativo: true
      };

      await this.funcionarioService.createFuncionario(funcionario).toPromise();
      
      this.successMessage = 'Funcionário cadastrado com sucesso!';
      this.cadastroUsername = '';
      this.cadastroNome = '';
      this.cadastroSenha = '';
      this.cadastroConfirmarSenha = '';
      
      // Alternar para login após 2 segundos
      setTimeout(() => {
        this.showCadastro = false;
        this.successMessage = '';
      }, 2000);
    } catch (error: any) {
      this.errorMessage = error?.error?.detail || 'Erro ao cadastrar funcionário. Tente novamente.';
    } finally {
      this.isLoading = false;
    }
  }
} 