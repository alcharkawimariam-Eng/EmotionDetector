import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
    private base = environment.API_BASE;

    constructor(private http: HttpClient) { }

    // If you want to pass a custom suggestion_prompt, add it as the 3rd arg.
    assist(text: string, chat_id?: string, suggestion_prompt?: string): Observable<any> {
        return this.http.post(`${this.base}/assist`, { text, chat_id, suggestion_prompt });
    }

    analyzeCsv(file: File): Observable<any> {
        const form = new FormData();
        form.append('file', file, file.name);
        return this.http.post(`${this.base}/predict/csv`, form);
    }

    uploadPdf(file: File): Observable<any> {
        const form = new FormData();
        form.append('file', file, file.name);
        return this.http.post(`${this.base}/analyze/pdf`, form);
    }
}
