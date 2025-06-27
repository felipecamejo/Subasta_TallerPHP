import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();
    const isApiUrl = req.url.startsWith(environment.apiUrl);

    // 👉 Log para debug
    console.log('[INTERCEPTOR] URL:', req.url);
    console.log('[INTERCEPTOR] Token obtenido:', token);
    console.log('[INTERCEPTOR] ¿Es API URL?:', isApiUrl);

    let headers: any = {
      Accept: 'application/json',
    };

    if (token && isApiUrl) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // ✅ Agregamos el header de ngrok si aplica
    if (req.url.includes('ngrok')) {
      headers['ngrok-skip-browser-warning'] = '69420';
    }

    const clonedReq = req.clone({ setHeaders: headers });

    if (headers['Authorization']) {
      console.log('[INTERCEPTOR] ✅ Header Authorization agregado');
    } else {
      console.log('[INTERCEPTOR] ❌ NO se agregó token');
    }

    return next.handle(clonedReq);
  }
}
