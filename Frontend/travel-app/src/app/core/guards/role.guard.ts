import { CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { SystemRolesService } from '../services/system-roles.service';

/**
 * Guards the public home page (/). If a staff/admin user is already logged in,
 * redirect them to their dashboard instead of showing the home page.
 * Customers and unauthenticated users pass through normally.
 *
 * Safety: only redirects when a valid non-root route is known. If SystemRoles
 * haven't loaded yet (e.g. APP_INITIALIZER race), the user is let through rather
 * than triggering a redirect loop back to '/'.
 */
export const staffHomeRedirectGuard: CanActivateFn = (route) => {
  // Allow staff to view the public site when navigated via "View site"
  if (route.queryParams['view'] === 'public') return true;

  const auth        = inject(AuthService);
  const systemRoles = inject(SystemRolesService);
  const router      = inject(Router);

  if (auth.isAuthenticated() && auth.isStaff()) {
    const user = auth.currentUser();
    const fromConfig = systemRoles.defaultRouteFor(auth.privilegeLevel());
    // Fallback when _roles hasn't loaded: role name convention (SuperAdmin → /superadmin)
    const target = (fromConfig && fromConfig !== '/')
      ? fromConfig
      : user?.role ? '/' + user.role.toLowerCase() : null;
    if (target && target !== '/') {
      router.navigateByUrl(target);
      return false;
    }
  }
  return true;
};

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
  const urlPrefix      = urlSegments[0]?.split('?')[0] ?? '';
  const prefixConfig   = systemRoles.getByRoutePrefix(urlPrefix);

  // Validate a dynamic :rolePrefix route — reject unknown or non-management prefixes.
  // Only enforce this check when system roles have actually loaded; if _roles is empty
  // (e.g. APP_INITIALIZER raced with a stale-token 401), let the navigation through so
  // we don't redirect to '/' and create an infinite loop with staffHomeRedirectGuard.
  const rolePrefixParam = route.paramMap.get('rolePrefix');
  if (rolePrefixParam !== null && systemRoles.roles().length > 0) {
    const panelConfig = systemRoles.getByRoutePrefix(rolePrefixParam);
    if (!panelConfig || panelConfig.level < systemRoles.staffMinLevel()) {
      router.navigateByUrl('/');
      return false;
    }
  }

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
