import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../modules/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.authService.user && this.authService.token) {
      let token = this.authService.token;
      let expiration = (JSON.parse(atob(token.split(".")[1]))).exp;
      if (Math.floor((new Date().getTime()/1000)) >= expiration) {
        this.authService.logout();
        return false;
      }
      return true;
    }
    this.router.navigate(['/auth/login']);
    return false;
  }
} 