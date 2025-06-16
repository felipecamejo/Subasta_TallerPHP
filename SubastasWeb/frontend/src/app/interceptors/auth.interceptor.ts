import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const raw = localStorage.getItem('auth');
  let token = null;

  try {
    token = raw ? JSON.parse(raw).token : null;
  } catch (e) {
    token = null;
  }

  const isApiUrl = req.url.startsWith('http://localhost:8000');

  if (token && isApiUrl) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq);
  }

  return next(req);
};
