import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/api.models';

export const authGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    router.navigate(['/auth/login'], { queryParams: { returnUrl: router.url } });
    return false;
  }

  const required = route.data?.['roles'] as UserRole[] | undefined;
  if (required && required.length > 0) {
    const role = auth.role();
    if (!role || !required.includes(role)) {
      router.navigate(['/']);
      return false;
    }
  }

  const requiredPermission = route.data?.['permission'] as string | undefined;
  if (requiredPermission && !auth.hasPermission(requiredPermission)) {
    router.navigate(['/admin']);
    return false;
  }

  return true;
};
