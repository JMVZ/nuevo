import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProformasService {
  private baseUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  getProformaInventoryItems(proformaId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/proformas/${proformaId}/inventory-items`);
  }

  createProforma(formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/proformas`, formData, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
  }
} 