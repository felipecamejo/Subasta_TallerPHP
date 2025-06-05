import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GoogleService {
  private apiUrl = 'http://localhost:8000/api/login-with-google'; // Cambiá si tenés otra URL

  constructor(private http: HttpClient) {}

  loginWithGoogle(token: string): Observable<any> {
    return this.http.post<any>(this.apiUrl, { token });
  }
}