import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  isAuthenticated = false;
  currentUser = '';

  constructor() {
    this.checkAuthStatus();
  }

  checkAuthStatus() {
    this.isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    this.currentUser = localStorage.getItem('currentUser') || '';
  }

  logout() {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('currentUser');
    this.isAuthenticated = false;
    this.currentUser = '';
    window.location.href = '/login';
  }
}
