import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class CorsInterceptor implements HttpInterceptor {
  constructor() {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Solo establecer Content-Type para peticiones que NO son FormData
    const isFormData = request.body instanceof FormData;
    
    const headers: any = {
      'Accept': 'application/json'
    };
    
    // Solo agregar Content-Type si NO es FormData
    // Angular establece automáticamente multipart/form-data para FormData
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    
    const modifiedRequest = request.clone({
      withCredentials: false,
      setHeaders: headers
    });

    return next.handle(modifiedRequest);
  }
} 