import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, finalize } from 'rxjs';
import { URL_SERVICIOS } from 'src/app/config/config';
import { AuthService } from '../../auth';

@Injectable({
  providedIn: 'root'
})
export class ProductWarehousesService {

  isLoading$: Observable<boolean>;
  isLoadingSubject: BehaviorSubject<boolean>;
  
  constructor(
    private http: HttpClient,
    public authservice: AuthService,
  ) {
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);
    this.isLoading$ = this.isLoadingSubject.asObservable();
  }

  registerProductWarehouse(data:any) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer '+ this.authservice.token});
    let URL = URL_SERVICIOS+"/product_warehouses";
    return this.http.post(URL,data,{headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  updateProductWarehouse(ID_WAREHOUSE_PRODUCT:string,data:any) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer '+ this.authservice.token});
    let URL = URL_SERVICIOS+"/product_warehouses/"+ID_WAREHOUSE_PRODUCT;
    return this.http.put(URL,data,{headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }
  
  deleteProductWarehouse(ID_WAREHOUSE_PRODUCT:string) {
      this.isLoadingSubject.next(true);
      let headers = new HttpHeaders({'Authorization': 'Bearer '+ this.authservice.token});
      let URL = URL_SERVICIOS+"/product_warehouses/"+ID_WAREHOUSE_PRODUCT;
      return this.http.delete(URL,{headers: headers}).pipe(
        finalize(() => this.isLoadingSubject.next(false))
      );
    }

  getSalidas(page: number, pageSize: number) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer '+ this.authservice.token});
    let URL = URL_SERVICIOS+"/product-warehouse-outputs?page="+page+"&per_page="+pageSize;
    return this.http.get(URL, {headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  registrarSalida(data: { 
    product_warehouse_id: number, 
    quantity: number, 
    reason: string,
    proforma_id?: number,
    user_id?: number 
  }) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer '+ this.authservice.token});
    let URL = URL_SERVICIOS+"/product-warehouse-outputs";
    return this.http.post(URL, data, {headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  getAllWarehouses() {
    let headers = new HttpHeaders({'Authorization': 'Bearer '+ this.authservice.token});
    let URL = URL_SERVICIOS+"/warehouses";
    return this.http.get(URL,{headers: headers});
  }

  getEntradas(page: number, pageSize: number) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer '+ this.authservice.token});
    let URL = URL_SERVICIOS+"/product-warehouse-inputs?page="+page+"&per_page="+pageSize;
    return this.http.get(URL, {headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }
}
