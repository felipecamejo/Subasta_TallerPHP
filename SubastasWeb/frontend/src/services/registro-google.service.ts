import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { RegistroGooglePayload } from '../models/registro-google-payload';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RegistroGoogleService {
  constructor(private http: HttpClient) {}

  registrarUsuario(url: string, payload: RegistroGooglePayload): Observable<any> {
    return this.http.post(url, payload);
  }
}