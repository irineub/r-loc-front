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
                if (config.url) this.apiUrl = config.url;
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
                this.apiUrl = url;
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
        // Structure based on common WhatsApp API providers. 
        // TODO: Verify exact payload structure with Uazapi documentation.
        const body = {
            number: phone,
            url: pdfUrl,
            filename: filename,
            caption: caption,
            mediatype: 'document'
        };

        const headers = {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json'
        };

        return this.http.post(`${this.apiUrl}/message/send-media`, body, { headers });
    }

    sendMessage(phone: string, message: string): Observable<any> {
        const body = {
            number: phone,
            message: message
        };

        const headers = {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json'
        };

        return this.http.post(`${this.apiUrl}/message/send-text`, body, { headers });
    }
}
