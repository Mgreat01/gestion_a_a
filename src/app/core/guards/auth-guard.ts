import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { from, map, catchError, of } from 'rxjs';

import { Auth } from '../services/auth';

export const authGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (!auth.isAuth()) {
    return router.createUrlTree(['/login']);
  }

  return from(auth.me()).pipe(
    map((me) => {
      auth.setMe(me);
      return true;
    }),
    catchError(() => {
      auth.removeToken();
      return of(router.createUrlTree(['/login']));
    })
  );
};
