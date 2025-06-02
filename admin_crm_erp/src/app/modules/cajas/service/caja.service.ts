import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, finalize } from 'rxjs';
import { AuthService } from '../../auth';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CajaService {

  isLoading$ = new BehaviorSubject<boolean>(false);
  isLoadingSubject = new BehaviorSubject<boolean>(false);
  
  constructor(
    private http: HttpClient,
    public authservice: AuthService,
  ) { }

  configCaja() {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer '+this.authservice.token});
    const userSucursaleId = this.authservice.user?.sucursale_id || '1';
    return this.http.get(`${environment.apiUrl}/caja/config?sucursale_id=${userSucursaleId}`, {headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  aperturaCaja(data:any) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer '+this.authservice.token});
    return this.http.post(`${environment.apiUrl}/caja/apertura_caja`, data, {headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  cierreCaja(data:any) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer '+this.authservice.token});
    return this.http.post(`${environment.apiUrl}/caja/cierre_caja`, data, {headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  reportCaja(page:number = 1,data:any) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization':'Bearer '+this.authservice.token});
    return this.http.post(`${environment.apiUrl}/caja/report_caja?page=${page}`, data, {headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  searchClients(n_document:string,full_name:string,phone:string){
    this.isLoadingSubject.next(true);
    let LINK = "";
    if(n_document){
      LINK += "&n_document="+n_document;
    }
    if(full_name){
      LINK += "&full_name="+full_name;
    }
    if(phone){
      LINK += "&phone="+phone;
    }
    let headers = new HttpHeaders({'Authorization': 'Bearer '+this.authservice.token});
    return this.http.get(`${environment.apiUrl}/proformas/search-clients?p=1${LINK}`, {headers:headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  searchProformas(CLIENT_ID:string,n_proforma:string,state_payment:string){
    this.isLoadingSubject.next(true);
    let LINK = "";
    if(n_proforma){
      LINK += "&n_proforma="+n_proforma;
    }
    if(state_payment){
      LINK += "&state_payment="+state_payment;
    }
    let headers = new HttpHeaders({'Authorization': 'Bearer '+this.authservice.token});
    return this.http.get(`${environment.apiUrl}/caja/search_proformas/${CLIENT_ID}?p=1${LINK}`, {headers:headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  updatePayment(data:any,PAYMENT_ID:any) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization':'Bearer '+this.authservice.token});
    return this.http.post(`${environment.apiUrl}/caja/updated_payment/${PAYMENT_ID}`, data, {headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  createPayment(data:any) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization':'Bearer '+this.authservice.token});
    return this.http.post(`${environment.apiUrl}/caja/created_payment`, data, {headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  processPayment(data:any) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization':'Bearer '+this.authservice.token});
    return this.http.post(`${environment.apiUrl}/caja/process_payment`, data, {headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  listContractProcess(data:any) {
    return this.http.post(`${environment.apiUrl}/caja/contract_process`, data);
  }

  reportCajaDay(CAJA_SUCURSALE_ID:any) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization':'Bearer '+this.authservice.token});
    return this.http.get(`${environment.apiUrl}/caja/report_caja_day/${CAJA_SUCURSALE_ID}`, {headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  listHistory(data:any) {
    return this.http.post(`${environment.apiUrl}/caja/list-history`, data);
  }
}
