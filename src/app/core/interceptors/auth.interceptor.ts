import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { Auth } from '../services/auth';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(Auth);
  const router = inject(Router);
  const token = auth.getToken();
  const shouldAttachToken = !!token && !request.headers.has('Authorization');

  const authenticatedRequest = shouldAttachToken
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  if (token && auth.isTokenExpired(token)) {
    auth.removeToken();
    void router.navigate(['/login']);
    return throwError(() => new Error('JWT expired'));
  }

  return next(authenticatedRequest).pipe(
    catchError((error) => {
      if (error.status === 401) {
        auth.removeToken();
        void router.navigate(['/login']);
      }

      return throwError(() => error);
    }),
  );
};
