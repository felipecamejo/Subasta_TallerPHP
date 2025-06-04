// src/app/services/auth.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RegistroData {
  nombre: string;
  cedula: string;
  email: string;
  telefono: string;
  imagen?: File | null;
  contrasenia: string;
  tipo: string;  // aquí debe ser tipo
  matricula?: string;
  latitud: number;
  longitud: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  register(data: RegistroData): Observable<any> {
    const formData = new FormData();
    formData.append('nombre', data.nombre);
    formData.append('cedula', data.cedula);
    formData.append('email', data.email);
    formData.append('telefono', data.telefono);
    formData.append('contrasenia', data.contrasenia);
    formData.append('tipo', data.tipo);
    if (data.matricula) {
      formData.append('matricula', data.matricula);
    }
    formData.append('latitud', data.latitud.toString());
    formData.append('longitud', data.longitud.toString());
    if (data.imagen) {
      formData.append('imagen', data.imagen);
    }

    return this.http.post(`${this.baseUrl}/register`, formData);
  }
}