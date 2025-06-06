import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, finalize } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from '../../auth';

@Injectable({
  providedIn: 'root'
})
export class CajaEgresoService {

  isLoading$: Observable<boolean>;
  isLoadingSubject: BehaviorSubject<boolean>;
  
  constructor(
    private http: HttpClient,
    public authservice: AuthService,
  ) {
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);
    this.isLoading$ = this.isLoadingSubject.asObservable();
  }

  registerEgreso(data:any) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer '+ this.authservice.token});
    return this.http.post(`${environment.apiUrl}/caja/egresos`, data, {headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  listEgresos(page = 1,caja_sucursale_id:string = ''){
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer '+ this.authservice.token});
    return this.http.get(`${environment.apiUrl}/caja/egresos?page=${page}&caja_sucursale_id=${caja_sucursale_id}`, {headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  updateEgreso(ID_EGRESO:string,data:any) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer '+ this.authservice.token});
    let URL = `${environment.apiUrl}/caja/egresos/${ID_EGRESO}`;
    return this.http.put(URL,data,{headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  deleteEgreso(ID_EGRESO:string) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer '+ this.authservice.token});
    let URL = `${environment.apiUrl}/caja/egresos/${ID_EGRESO}`;
    return this.http.delete(URL,{headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }
  
}
