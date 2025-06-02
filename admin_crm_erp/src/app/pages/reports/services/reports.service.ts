import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) { }

  getProductOutputs(filters: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/product-outputs`, { params: filters });
  }

  getUserConsumption(filters: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/user-consumption`, { params: filters });
  }

  getProformaOutputs(filters: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/proforma-outputs`, { params: filters });
  }

  exportToExcel(filters: any, reportType: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${reportType}/export`, {
      params: filters,
      responseType: 'blob'
    });
  }
} 