import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class WhatsappService {
    private apiUrl = '';
    private apiToken = '';

    constructor(private http: HttpClient) {
        this.loadCredentials();
    }

    loadCredentials() {
        this.http.get<{ url: string, token: string }>(`${environment.apiUrl}/config/uazapi`).subscribe({
            next: (config) => {
                if (config.url) this.apiUrl = config.url.replace(/\/$/, ''); // remover barra final
                if (config.token) this.apiToken = config.token;
                console.log('WhatsApp credentials loaded');
            },
            error: (err) => console.error('Error loading WhatsApp credentials', err)
        });
    }

    getCredentials(): Observable<{ url: string, token: string }> {
        return this.http.get<{ url: string, token: string }>(`${environment.apiUrl}/config/uazapi`);
    }

    updateCredentials(url: string, token: string): Observable<any> {
        return this.http.post(`${environment.apiUrl}/config/uazapi`, { url, token }).pipe(
            tap(() => {
                this.apiUrl = url.replace(/\/$/, '');
                this.apiToken = token;
            })
        );
    }

    getTimezoneConfig(): Observable<{ timezone: string }> {
        return this.http.get<{ timezone: string }>(`${environment.apiUrl}/config/timezone`);
    }

    updateTimezoneConfig(timezone: string): Observable<any> {
        return this.http.post(`${environment.apiUrl}/config/timezone`, { timezone });
    }

    sendPdf(phone: string, pdfUrl: string, filename: string, caption: string): Observable<any> {
        // UazAPI: header 'token' (não 'Authorization: Bearer')
        //         campo 'file' (não 'url') com a URL pública do PDF
        const body = {
            number: phone,
            file: pdfUrl,        // UazAPI usa 'file', não 'url'
            type: 'document',
            filename: filename,
            caption: caption
        };

        const headers: { [key: string]: string } = {
            'Content-Type': 'application/json',
            'token': this.apiToken   // UazAPI: header 'token', sem 'Bearer'
        };

        console.log('Sending PDF via WhatsApp:', { url: `${this.apiUrl}/send/media`, body });
        return this.http.post(`${this.apiUrl}/send/media`, body, { headers });
    }

    sendMessage(phone: string, message: string): Observable<any> {
        // UazAPI: campo 'text' (não 'message') e type: 'conversation'
        const body = {
            number: phone,
            text: message,
            type: 'conversation'
        };

        const headers: { [key: string]: string } = {
            'Content-Type': 'application/json',
            'token': this.apiToken
        };

        return this.http.post(`${this.apiUrl}/send/text`, body, { headers });
    }
}
