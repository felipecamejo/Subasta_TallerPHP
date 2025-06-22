import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from './../environments/environment';
import { Observable } from 'rxjs';

/** <--- AGREGAR EXPORT */
export interface ResetPasswordPayload {
  email: string;
  password: string;
  password_confirmation: string;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class PasswordService {
  constructor(private http: HttpClient) {}

  resetPassword(data: ResetPasswordPayload): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/reset-password`, data);
  }
}
