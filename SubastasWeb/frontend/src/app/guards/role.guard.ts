import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

export const RoleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const rolesPermitidos = route.data['roles'] as string[] || [];
  const rolUsuario = authService.getRol();

  console.log('[RoleGuard] Roles permitidos:', rolesPermitidos);
  console.log('[RoleGuard] Rol del usuario:', rolUsuario);
  console.log('Rol actual:', rolUsuario);

  if (rolUsuario && rolesPermitidos.includes(rolUsuario)) {
    console.log('[RoleGuard]  Acceso permitido');
    return true;
  }

  console.warn('[RoleGuard]  Acceso denegado. Redirigiendo a /login');
  router.navigate(['/login']);
  return false;
};