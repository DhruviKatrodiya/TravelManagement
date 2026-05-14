import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { ToastService } from '../services/toast.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  const token = auth.getToken();
  const cloned = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  const isAuthEndpoint = /\/auth\/(login|register)$/.test(req.url);

  return next(cloned).pipe(
    catchError((err: HttpErrorResponse) => {
      if (isAuthEndpoint) {
        // Let the login/register component show its own error toast so
        // specific messages (e.g. "Your account has been deactivated") reach the user.
        return throwError(() => err);
      }
      if (err.status === 401) {
        auth.logout();
        router.navigateByUrl('/auth/login');
      } else if (err.status === 403) {
        toast.show('You are not allowed to perform this action.', 'danger');
      } else if (err.status >= 500) {
        toast.show('Server error. Please try again.', 'danger');
      } else if (err.status === 0) {
        toast.show('Cannot reach API. Make sure backend is running on https://localhost:7138.', 'danger');
      } else {
        const message = err.error?.message || err.message || 'Request failed.';
        if (req.method !== 'GET') toast.show(message, 'danger');
      }
      return throwError(() => err);
    })
  );
};
