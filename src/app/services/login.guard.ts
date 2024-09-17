import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { map, take } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class LoginGuard implements CanActivate {
    constructor(private authService: AuthService, private router: Router) { }

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        return this.authService.getCurrentUser().pipe(
            take(1),
            map(user => {
                if (user) {
                    // Kullanıcı zaten giriş yapmış, ana sayfaya yönlendir
                    return this.router.createUrlTree(['/home']);
                } else {
                    // Kullanıcı giriş yapmamış, login sayfasında kal
                    return true;
                }
            })
        );
    }
}