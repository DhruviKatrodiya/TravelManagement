import { CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { SystemRolesService } from '../services/system-roles.service';

export const authGuard: CanActivateFn = (route, state: RouterStateSnapshot) => {
  const auth        = inject(AuthService);
  const systemRoles = inject(SystemRolesService);
  const router      = inject(Router);

  if (!auth.isAuthenticated()) {
    router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  const userLevel      = auth.privilegeLevel();
  const userPrefix     = systemRoles.routePrefixFor(userLevel);
  const urlSegments    = state.url.split('/').filter(s => s);
  const urlPrefix      = urlSegments[0] ?? '';
  const prefixConfig   = systemRoles.getByRoutePrefix(urlPrefix);

  // Management panels (Staff and above) are exclusive to their own level.
  // Visiting the wrong panel redirects you to the correct one.
  if (prefixConfig && prefixConfig.level >= systemRoles.staffMinLevel() && prefixConfig.level !== userLevel) {
    const newUrl = '/' + [userPrefix, ...urlSegments.slice(1)].join('/');
    router.navigateByUrl(newUrl);
    return false;
  }

  // Optional minimum level gate on non-panel routes (e.g. data: { minimumLevel: 2 })
  const minimumLevel = route.data?.['minimumLevel'] as number | undefined;
  if (minimumLevel !== undefined && userLevel < minimumLevel) {
    router.navigateByUrl(systemRoles.defaultRouteFor(userLevel) || '/');
    return false;
  }

  // Permission check
  const requiredPermission = route.data?.['permission'] as string | undefined;
  if (requiredPermission && !auth.hasPermission(requiredPermission)) {
    router.navigateByUrl('/' + userPrefix || '/');
    return false;
  }

  return true;
};
