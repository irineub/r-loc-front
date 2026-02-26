import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface NavigationState {
  shouldOpenLocacaoModal?: boolean;
  locacaoId?: number;
  shouldOpenOrcamentoModal?: boolean;
  orcamentoId?: number;
  shouldOpenDocumentViewer?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private navigationState = new BehaviorSubject<NavigationState>({});

  constructor() { }

  // Método para definir o estado de navegação
  setNavigationState(state: NavigationState) {
    this.navigationState.next(state);
  }

  // Método para obter o estado atual
  getNavigationState() {
    return this.navigationState.asObservable();
  }

  // Método para limpar o estado
  clearNavigationState() {
    this.navigationState.next({});
  }
}
