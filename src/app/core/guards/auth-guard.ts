import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { from, map, catchError, of } from 'rxjs';

import { Auth } from '../services/auth';

export const authGuard: CanActivateFn = (route) => {
  const auth = inject(Auth);
  const router = inject(Router);
  const allowedRoles = route.data?.['roles'] as string[] | undefined;

  if (!auth.isAuth()) {
    auth.removeToken();
    return router.createUrlTree(['/login']);
  }

  return from(auth.me()).pipe(
    map((me) => {
      auth.setMe(me);

      if (allowedRoles?.length && (!me.role || !allowedRoles.includes(me.role))) {
        return router.createUrlTree([me.role === 'admin' ? '/admin/dashboard' : '/user/dashboard']);
      }

      return true;
    }),
    catchError(() => {
      auth.removeToken();
      return of(router.createUrlTree(['/login']));
    })
  );
};
