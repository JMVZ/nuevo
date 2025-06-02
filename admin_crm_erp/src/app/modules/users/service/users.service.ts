import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, finalize } from 'rxjs';
import { AuthService } from '../../auth';
import { URL_SERVICIOS } from 'src/app/config/config';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  isLoading$: Observable<boolean>;
  isLoadingSubject: BehaviorSubject<boolean>;
  private apiUrl: string;
  
  constructor(
    private http: HttpClient,
    public authservice: AuthService,
  ) {
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);
    this.isLoading$ = this.isLoadingSubject.asObservable();
    this.apiUrl = `${environment.apiUrl}/users`;
  }

  registerUser(data:any) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer '+ this.authservice.token});
    let URL = URL_SERVICIOS+"/users";
    return this.http.post(URL,data,{headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  listUsers(page = 1,search:string = ''){
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer '+ this.authservice.token});
    let URL = URL_SERVICIOS+"/users?page="+page+"&search="+search;
    return this.http.get(URL,{headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  configAll(){
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer '+ this.authservice.token});
    let URL = URL_SERVICIOS+"/users/config";
    return this.http.get(URL,{headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  updateUser(ID_USER:string,data:any) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer '+ this.authservice.token});
    let URL = URL_SERVICIOS+"/users/"+ID_USER;
    return this.http.post(URL,data,{headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  deleteUser(ID_USER:string) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer '+ this.authservice.token});
    let URL = URL_SERVICIOS+"/users/"+ID_USER;
    return this.http.delete(URL,{headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  getProductionUsers() {
    this.isLoadingSubject.next(true);
    console.log('Obteniendo usuarios de producción...');
    let headers = new HttpHeaders({'Authorization': 'Bearer '+ this.authservice.token});
    let URL = URL_SERVICIOS+"/users/production";
    
    // Obtener el sucursale_id del usuario actual
    const user = this.authservice.currentUserValue;
    if (user?.sucursale_id) {
      URL += `?sucursale_id=${user.sucursale_id}`;
    }
    
    console.log('URL:', URL);
    console.log('Token:', this.authservice.token);
    console.log('Usuario actual:', user);
    
    return this.http.get(URL, {headers: headers}).pipe(
      finalize(() => {
        this.isLoadingSubject.next(false);
        console.log('Petición finalizada');
      })
    );
  }
}
