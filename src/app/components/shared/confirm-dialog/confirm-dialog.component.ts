import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title class="dialog-title">{{ data.title }}</h2>
    <mat-dialog-content class="dialog-content">
      <p [innerHTML]="data.message"></p>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="dialog-actions">
      <button mat-button mat-dialog-close class="btn-cancel">{{ data.cancelText || 'Cancelar' }}</button>
      <button mat-button [mat-dialog-close]="true" 
              class="btn-confirm" 
              [class.btn-destructive]="data.isDestructive"
              cdkFocusInitial>
        {{ data.confirmText || 'Confirmar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-title {
      font-family: 'Inter', sans-serif;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 16px;
    }
    
    .dialog-content {
      font-family: 'Inter', sans-serif;
      font-size: 1rem;
      color: #4b5563;
      line-height: 1.5;
      min-width: 350px;
    }
    
    .dialog-actions {
      padding: 16px 24px 24px;
      gap: 12px;
    }
    
    .btn-cancel {
      color: #6b7280;
      font-weight: 500;
    }
    
    .btn-confirm {
      background-color: #3b82f6;
      color: white;
      font-weight: 600;
      border-radius: 6px;
      padding: 0 16px;
      
      &:hover {
        background-color: #2563eb;
      }
    }
    
    .btn-destructive {
      background-color: #ef4444;
      
      &:hover {
        background-color: #dc2626;
      }
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) { }
}
