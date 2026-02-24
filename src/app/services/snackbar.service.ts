import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
    providedIn: 'root'
})
export class SnackbarService {
    constructor(private snackBar: MatSnackBar) { }

    show(message: string, isError: boolean = false) {
        this.snackBar.open(message, 'OK', {
            duration: 5000,
            panelClass: isError ? ['snackbar-error'] : ['snackbar-success'],
            horizontalPosition: 'center',
            verticalPosition: 'top',
        });
    }

    success(message: string) {
        this.show(message, false);
    }

    error(message: string) {
        this.show(message, true);
    }
}
