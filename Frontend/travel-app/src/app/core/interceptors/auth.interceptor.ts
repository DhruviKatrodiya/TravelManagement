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

  const isAuthEndpoint = /\/auth\/(login|register|change-password|me)$/.test(req.url);
  // Endpoints where the component shows its own inline error UI — don't auto-toast/notify.
  const isInlineErrorEndpoint = /\/(customers|staff|drivers|vehicles|tours|packages|home-destinations|facilities|schedules|reviews|refunds|expenses|bookings|payments)(\/|\?|$)/.test(req.url);

  return next(cloned).pipe(
    catchError((err: HttpErrorResponse) => {
      if (isAuthEndpoint || (isInlineErrorEndpoint && req.method !== 'GET')) {
        // Let the component show its own error message (e.g. "duplicate email").
        return throwError(() => err);
      }
      if (err.status === 401) {
        auth.logout();
        router.navigateByUrl('/auth/login');
      } else if (err.status === 403) {
        toast.show('You are not allowed to perform this action.', 'danger', 5000, { title: 'Forbidden', persist: false });
      } else if (err.status >= 500) {
        toast.show('Server error. Please try again.', 'danger', 5000, { title: 'Server error', persist: false });
      } else if (err.status === 0) {
        toast.show('Cannot reach API. Make sure backend is running on https://localhost:7138.', 'danger', 6000, { title: 'Connection error', persist: false });
      } else {
        const message = err.error?.message || err.message || 'Request failed.';
        if (req.method !== 'GET') toast.show(message, 'danger', 5000, { title: 'Request failed', persist: false });
      }
      return throwError(() => err);
    })
  );
};
