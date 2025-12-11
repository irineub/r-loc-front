import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent) },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard]
  },
  { 
    path: 'clientes', 
    loadComponent: () => import('./components/clientes/clientes.component').then(m => m.ClientesComponent),
    canActivate: [AuthGuard]
  },
  { 
    path: 'equipamentos', 
    loadComponent: () => import('./components/equipamentos/equipamentos.component').then(m => m.EquipamentosComponent),
    canActivate: [AuthGuard]
  },
  { 
    path: 'orcamentos', 
    loadComponent: () => import('./components/orcamentos/orcamentos.component').then(m => m.OrcamentosComponent),
    canActivate: [AuthGuard]
  },
  { 
    path: 'locacoes', 
    loadComponent: () => import('./components/locacoes/locacoes.component').then(m => m.LocacoesComponent),
    canActivate: [AuthGuard]
  },
  { 
    path: 'recebimento/:id', 
    loadComponent: () => import('./components/recebimento/recebimento.component').then(m => m.RecebimentoComponent),
    canActivate: [AuthGuard]
  },
  { 
    path: 'funcionarios', 
    loadComponent: () => import('./components/funcionarios/funcionarios.component').then(m => m.FuncionariosComponent),
    canActivate: [AuthGuard]
  },
  { 
    path: 'logs', 
    loadComponent: () => import('./components/logs/logs.component').then(m => m.LogsComponent),
    canActivate: [AuthGuard]
  },
  { path: '**', redirectTo: '/login' }
];
