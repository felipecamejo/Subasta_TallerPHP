import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface GoogleLoginResponse {
  access_token: string;
  token_type: string;
  usuario: {
    id: number;
    nombre: string;
    email: string;
    // agrega otros campos según tu modelo
    rematador?: any;
    cliente?: any;
  };
}

@Injectable({
  providedIn: 'root'
})
export class GoogleService {

  private apiUrl = 'http://localhost:8000/api/login-with-google'; // Cambia si tu URL es otra

  constructor(private http: HttpClient) { }

  loginWithGoogle(idToken: string, rol: 'cliente' | 'rematador'): Observable<GoogleLoginResponse> {
    return this.http.post<GoogleLoginResponse>(this.apiUrl, {
      token: idToken,
      rol: rol
    });
  }
}
