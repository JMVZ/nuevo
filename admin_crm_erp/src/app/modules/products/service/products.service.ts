import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, finalize, tap, catchError, throwError } from 'rxjs';
import { AuthService } from '../../auth';
import { URL_SERVICIOS } from 'src/app/config/config';

interface ProductResponse {
  data: any[];
  products?: {
    data: any[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class ProductsService {

  isLoading$: Observable<boolean>;
  isLoadingSubject: BehaviorSubject<boolean>;
  
  constructor(
    private http: HttpClient,
    public authservice: AuthService,
  ) {
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);
    this.isLoading$ = this.isLoadingSubject.asObservable();
  }

  registerProduct(data:any) {
    this.isLoadingSubject.next(true);
    
    // IMPORTANTE: NO establecer Content-Type para FormData
    // Dejar que Angular lo configure automáticamente
    let headers = new HttpHeaders();
    if (this.authservice.token) {
      headers = headers.set('Authorization', 'Bearer ' + this.authservice.token);
    }
    
    let URL = URL_SERVICIOS+"/products";
    
    return this.http.post(URL,data,{headers: headers}).pipe(
      tap((response: any) => {
        console.log('Respuesta exitosa:', response);
      }),
      catchError((error: any) => {
        console.error('Error en la petición:', error);
        console.error('Status:', error.status);
        console.error('Error body:', error.error);
        return throwError(() => error);
      }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  importProduct(data:any) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer '+ this.authservice.token});
    let URL = URL_SERVICIOS+"/products/import";
    return this.http.post(URL,data,{headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  listProducts(page: number = 1, params: any = {}): Observable<any> {
    console.log('Cargando productos con parámetros:', { page, ...params });
    
    // Configurar los parámetros de la petición
    const requestParams = { 
      page, 
      ...params,
      per_page: 1000,
      all: true,
      paginate: false
    };
    
    let headers = new HttpHeaders({'Authorization': 'Bearer '+ this.authservice.token});
    
    // Usar el endpoint /products con GET
    return this.http.get(`${URL_SERVICIOS}/products`, {
      headers: headers,
      params: requestParams
    }).pipe(
      tap((response: any) => {
        console.log('Respuesta del servidor:', response);
        if (response?.products?.data) {
          console.log('Número de productos cargados:', response.products.data.length);
          console.log('Total de productos en el sistema:', response.products.total);
          console.log('Productos agotados:', response.num_products_agotado);
          console.log('Productos por agotar:', response.num_products_por_agotar);
        } else {
          console.log('Respuesta sin datos:', response);
        }
      }),
      catchError(error => {
        console.error('Error al cargar productos:', error);
        return throwError(() => error);
      })
    );
  }

  showProduct(PRODUCT_ID:string){
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer '+ this.authservice.token});
    let URL = URL_SERVICIOS+"/products/"+PRODUCT_ID;
    return this.http.get(URL,{headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  configAll(){
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer '+ this.authservice.token});
    let URL = URL_SERVICIOS+"/products/config";
    return this.http.get(URL,{headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  updateProduct(ID_PRODUCT:string,data:any) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer '+ this.authservice.token});
    let URL = URL_SERVICIOS+"/products/"+ID_PRODUCT;
    return this.http.post(URL,data,{headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  deleteProduct(ID_PRODUCT:string) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer '+ this.authservice.token});
    let URL = URL_SERVICIOS+"/products/"+ID_PRODUCT;
    return this.http.delete(URL,{headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  getAllProducts() {
    let headers = new HttpHeaders({'Authorization': 'Bearer '+ this.authservice.token});
    let URL = URL_SERVICIOS+"/products";
    return this.http.get(URL,{headers: headers});
  }

  getProformasPendientes(): Observable<any[]> {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer '+ this.authservice.token});
    let URL = URL_SERVICIOS+"/proformas?state_proforma=1&all=true";
    console.log('Obteniendo proformas pendientes de:', URL);
    return this.http.get<any[]>(URL, {headers: headers}).pipe(
      tap((response: any) => {
        console.log('Respuesta de proformas pendientes:', response);
        if (response && response.data) {
          console.log('Número de proformas encontradas:', response.data.length);
        } else {
          console.log('Respuesta sin datos:', response);
        }
      }),
      catchError(error => {
        console.error('Error al obtener proformas pendientes:', error);
        return throwError(() => error);
      }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

}
