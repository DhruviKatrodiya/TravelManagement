import { CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/api.models';

export const authGuard: CanActivateFn = (route, state: RouterStateSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  const role = auth.role();

  // Cross-role redirect: staff hitting /admin/* → /staff/*, admin hitting /staff/* → /admin/*
  if (role === 'Staff' && state.url.startsWith('/admin')) {
    router.navigateByUrl(state.url.replace('/admin', '/staff'));
    return false;
  }
  if (role === 'Admin' && state.url.startsWith('/staff')) {
    router.navigateByUrl(state.url.replace('/staff', '/admin'));
    return false;
  }

  const required = route.data?.['roles'] as UserRole[] | undefined;
  if (required && required.length > 0) {
    if (!role || !required.includes(role)) {
      router.navigate(['/']);
      return false;
    }
  }

  const basePath = role === 'Staff' ? '/staff' : '/admin';
  const requiredPermission = route.data?.['permission'] as string | undefined;
  if (requiredPermission && !auth.hasPermission(requiredPermission)) {
    router.navigate([basePath]);
    return false;
  }

  return true;
};
