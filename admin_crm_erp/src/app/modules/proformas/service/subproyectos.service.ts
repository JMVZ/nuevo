import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, finalize, tap, catchError, throwError } from 'rxjs';
import { AuthService } from '../../auth';
import { URL_SERVICIOS } from 'src/app/config/config';

export interface Subproyecto {
  id?: number;
  proforma_id: number;
  nombre: string;
  descripcion?: string;
  estado: 'pendiente' | 'en_proceso' | 'completado';
  productos: SubproyectoProducto[];
  created_at?: string;
  updated_at?: string;
}

export interface SubproyectoProducto {
  id?: number;
  subproyecto_id?: number;
  product_id: number;
  product_categorie_id: number;
  unit_id: number;
  cantidad: number;
  precio_unitario: number;
  total: number;
  warehouse_id?: number | null;
  product?: any;
  unit?: any;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SubproyectosService {

  isLoading$: Observable<boolean>;
  isLoadingSubject: BehaviorSubject<boolean>;

  constructor(
    private http: HttpClient,
    public authService: AuthService,
  ) {
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);
    this.isLoading$ = this.isLoadingSubject.asObservable();
  }

  private getHeaders() {
    return new HttpHeaders({
      'Authorization': 'Bearer ' + this.authService.token
    });
  }

  index(proforma_id: number): Observable<any> {
    this.isLoadingSubject.next(true);
    const url = `${URL_SERVICIOS}/subproyectos?proforma_id=${proforma_id}`;
    return this.http.get(url, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  store(subproyecto: Subproyecto): Observable<any> {
    this.isLoadingSubject.next(true);
    const url = `${URL_SERVICIOS}/subproyectos`;
    return this.http.post(url, subproyecto, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  show(id: number): Observable<any> {
    this.isLoadingSubject.next(true);
    const url = `${URL_SERVICIOS}/subproyectos/${id}`;
    return this.http.get(url, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  update(id: number, subproyecto: Subproyecto): Observable<any> {
    this.isLoadingSubject.next(true);
    const url = `${URL_SERVICIOS}/subproyectos/${id}`;
    return this.http.put(url, subproyecto, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  delete(id: number): Observable<any> {
    this.isLoadingSubject.next(true);
    const url = `${URL_SERVICIOS}/subproyectos/${id}`;
    return this.http.delete(url, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  addProduct(subproyectoId: number, data: SubproyectoProducto): Observable<any> {
    console.log('Enviando datos al backend:', data);
    return this.http.post<any>(`${URL_SERVICIOS}/subproyectos/${subproyectoId}/productos`, data, { headers: this.getHeaders() })
      .pipe(
        tap(response => console.log('Respuesta del backend:', response)),
        catchError(error => {
          console.error('Error al agregar producto:', error);
          return throwError(() => error);
        })
      );
  }

  removeProduct(subproyecto_id: number, producto_id: number): Observable<any> {
    this.isLoadingSubject.next(true);
    const url = `${URL_SERVICIOS}/subproyectos/${subproyecto_id}/productos/${producto_id}`;
    return this.http.delete(url, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }
} 