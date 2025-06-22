import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RegistroPayload } from '../models/RegistroPayloadDto';
import { Observable } from 'rxjs';
import { environment } from './../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RegistroService {
  constructor(private http: HttpClient) {}

  registrar(payload: RegistroPayload): Observable<any> {
    const url = payload.rol === 'casa_remate'
      ? `${environment.apiUrl}/api/register-casa-remate`
      : `${environment.apiUrl}/api/register`;
    return this.http.post(url, payload);
  }
}
