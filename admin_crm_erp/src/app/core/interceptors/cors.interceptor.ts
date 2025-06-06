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
    const modifiedRequest = request.clone({
      withCredentials: false,
      setHeaders: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    return next.handle(modifiedRequest);
  }
} 