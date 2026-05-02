import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { MasterGuard } from './guards/master.guard';

import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ClientesComponent } from './components/clientes/clientes.component';
import { ClienteDetalhesComponent } from './components/clientes/cliente-detalhes.component';
import { EquipamentosComponent } from './components/equipamentos/equipamentos.component';
import { OrcamentosComponent } from './components/orcamentos/orcamentos.component';
import { LocacoesComponent } from './components/locacoes/locacoes.component';
import { RecebimentoComponent } from './components/recebimento/recebimento.component';
import { FuncionariosComponent } from './components/funcionarios/funcionarios.component';
import { RelatoriosComponent } from './components/relatorios/relatorios.component';

/**
 * Rotas com `component` (import estático) em vez de `loadComponent` (lazy).
 * Evita falhas de navegação em produção quando o fetch de chunk-*.js retorna HTML (404/proxy)
 * e o router fica inconsistente até um reload manual da URL.
 */
export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'clientes',
    component: ClientesComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'clientes/:id',
    component: ClienteDetalhesComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'equipamentos',
    component: EquipamentosComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'orcamentos',
    component: OrcamentosComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'locacoes',
    component: LocacoesComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'recebimento/:id',
    component: RecebimentoComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'funcionarios',
    component: FuncionariosComponent,
    canActivate: [AuthGuard, MasterGuard]
  },
  {
    path: 'relatorios',
    component: RelatoriosComponent,
    canActivate: [AuthGuard, MasterGuard]
  },
  { path: '**', redirectTo: '/login' }
];
