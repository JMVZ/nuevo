import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { URL_SERVICIOS } from 'src/app/config/config';
import { AuthService } from 'src/app/modules/auth';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  constructor(
    private http: HttpClient,
    public authService: AuthService,
  ) {}

  getCurrency(): Observable<any> {
    const url = `${URL_SERVICIOS}/settings/currency`;
    return this.http.get(url, {
      headers: {
        'Authorization': 'Bearer ' + this.authService.token
      }
    });
  }

  setCurrency(data: any): Observable<any> {
    const url = `${URL_SERVICIOS}/settings/currency`;
    return this.http.post(url, data, {
      headers: {
        'Authorization': 'Bearer ' + this.authService.token
      }
    });
  }
} 