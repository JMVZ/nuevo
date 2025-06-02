import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, finalize } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from '../../auth';

@Injectable({
  providedIn: 'root'
})
export class CajaIngresoService {

  isLoading$: Observable<boolean>;
  isLoadingSubject: BehaviorSubject<boolean>;
  
  constructor(
    private http: HttpClient,
    public authservice: AuthService,
  ) {
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);
    this.isLoading$ = this.isLoadingSubject.asObservable();
  }

  registerIngreso(data:any) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer '+ this.authservice.token});
    return this.http.post(`${environment.apiUrl}/caja/ingresos`, data, {headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  listIngresos(page = 1,caja_sucursale_id:string = ''){
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer '+ this.authservice.token});
    return this.http.get(`${environment.apiUrl}/caja/ingresos?page=${page}&caja_sucursale_id=${caja_sucursale_id}`, {headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  updateIngreso(ID_INGRESO:string,data:any) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer '+ this.authservice.token});
    let URL = `${environment.apiUrl}/caja/ingresos/${ID_INGRESO}`;
    return this.http.put(URL,data,{headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  deleteIngreso(ID_INGRESO:string) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer '+ this.authservice.token});
    let URL = `${environment.apiUrl}/caja/ingresos/${ID_INGRESO}`;
    return this.http.delete(URL,{headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }
  
}
