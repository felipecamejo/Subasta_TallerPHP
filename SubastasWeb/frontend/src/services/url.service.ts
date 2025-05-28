import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UrlService {

  readonly baseUrl: string = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  public getUrl<T>(): Observable<T> {
    return this.http.get<T>(this.baseUrl);
  }
}
