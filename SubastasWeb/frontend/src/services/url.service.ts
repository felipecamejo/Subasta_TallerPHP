import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from './../environments/environment'; // Asegurate que el path esté bien

@Injectable({
  providedIn: 'root'
})
export class UrlService {

  readonly baseUrl: string = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  public getUrl<T>(): Observable<T> {
    return this.http.get<T>(this.baseUrl);
  }
}
