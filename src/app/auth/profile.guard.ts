import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { map, take } from 'rxjs';

export const profileGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.profile$.pipe(
    take(1),
    map(profile => {
      // console.log('Profile in guard:', profile);
      // console.log('isComplete', profile?.completed);

      // No profile doc at all -> go fill it in
      if (!profile) {
        return router.createUrlTree(['/complete-profile']);
      }

      // If explicitly completed -> allow
      if (profile.completed === true) {
        return true;
      }

      // Fallback: treat as complete if all fields present + non-empty
      const hasName = !!profile.name && profile.name.trim().length > 0;
      const hasUni = !!profile.university && profile.university.trim().length > 0;
      const hasCourse = !!profile.course && profile.course.trim().length > 0;

      if (hasName && hasUni && hasCourse) {
        return true;
      }

      // Otherwise force them to complete
      return router.createUrlTree(['/complete-profile']);
    })
  );
};
