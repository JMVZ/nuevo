import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private alertSubject = new Subject<{type: string, message: string}>();
  alert$ = this.alertSubject.asObservable();

  success(message: string) {
    this.alertSubject.next({ type: 'success', message });
  }

  error(message: string) {
    this.alertSubject.next({ type: 'error', message });
  }

  warning(message: string) {
    this.alertSubject.next({ type: 'warning', message });
  }

  info(message: string) {
    this.alertSubject.next({ type: 'info', message });
  }
} 