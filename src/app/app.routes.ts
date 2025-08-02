import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'clientes', loadComponent: () => import('./components/clientes/clientes.component').then(m => m.ClientesComponent) },
  { path: 'equipamentos', loadComponent: () => import('./components/equipamentos/equipamentos.component').then(m => m.EquipamentosComponent) },
  { path: 'orcamentos', loadComponent: () => import('./components/orcamentos/orcamentos.component').then(m => m.OrcamentosComponent) },
  { path: 'locacoes', loadComponent: () => import('./components/locacoes/locacoes.component').then(m => m.LocacoesComponent) },
  { path: '**', redirectTo: '/dashboard' }
];
