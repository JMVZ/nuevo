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

  getWarehouses(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/warehouses`);
  }

  getProducts(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/products`);
  }

  getProductOutputs(filters: any): Observable<any> {
    return this.http.get(`${environment.apiUrl}/reports/product-outputs`, { params: filters });
  }

  getUserConsumption(filters: any): Observable<any> {
    return this.http.get(`${environment.apiUrl}/reports/user-consumption`, { params: filters });
  }

  getProformaOutputs(filters: any): Observable<any> {
    return this.http.get(`${environment.apiUrl}/reports/proforma-outputs`, { params: filters });
  }

  // Reporte de ventas por período
  getSalesReport(startDate: string, endDate: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/sale_x_month_of_year`, {
      params: {
        start_date: startDate,
        end_date: endDate
      }
    });
  }

  // Reporte de productos más vendidos
  getTopProductsReport(filters: any): Observable<any> {
    return this.http.get(`${environment.apiUrl}/reports/top-products`, { params: filters });
  }

  // Reporte de clientes
  getClientsReport(filters: any): Observable<any> {
    return this.http.get(`${environment.apiUrl}/reports/clients`, { params: filters });
  }

  // Reporte de ingresos vs egresos
  getIncomeVsExpenseReport(filters: any): Observable<any> {
    return this.http.get(`${environment.apiUrl}/reports/income-vs-expense`, { params: filters });
  }

  getUsers(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/users`, { params: { role_id: '3' } });
  }
}
