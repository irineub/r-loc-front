import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { MasterGuard } from './guards/master.guard';

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
    path: 'clientes/:id',
    loadComponent: () => import('./components/clientes/cliente-detalhes.component').then(m => m.ClienteDetalhesComponent),
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
    canActivate: [AuthGuard, MasterGuard]
  },

  {
    path: 'relatorios',
    loadComponent: () => import('./components/relatorios/relatorios.component').then(m => m.RelatoriosComponent),
    canActivate: [AuthGuard, MasterGuard]
  },
  { path: '**', redirectTo: '/login' }
];
