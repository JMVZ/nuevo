import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, finalize, tap, catchError, throwError, map, mergeMap, of } from 'rxjs';
import { AuthService } from '../../auth';
import { URL_SERVICIOS } from 'src/app/config/config';
import { environment } from 'src/environments/environment';

interface PdfResponse {
  success: boolean;
  url: string;
  file_path: string;
  storage_path: string;
  file_exists: boolean;
  file_size: number;
  app_url: string;
  debug_info: {
    directory_exists: boolean;
    directory_writable: boolean;
    file_writable: boolean;
    pdf_content_size: number;
    storage_path: string;
  };
  error?: string;
}

interface Proforma {
  id: number;
  codigo: string;
  client?: {
    full_name: string;
  };
  product?: {
    title: string;
  };
}

interface ProformasResponse {
  proformas: {
    data: Proforma[];
    current_page: number;
    total: number;
  };
}

interface AnalisisCostos {
  proforma: {
    id: number;
    codigo: string;
    cliente: string;
    precio_final: number;
    fecha: string;
  };
  costos: {
    total_insumos_sin_iva: number;
    total_insumos_con_iva: number;
    detalles: {
      producto: string;
      cantidad: number;
      unidad: string;
      costo_unitario: number;
      costo_sin_iva: number;
      costo_con_iva: number;
      porcentaje_iva: number;
    }[];
  };
  analisis: {
    ganancia_sin_iva: number;
    ganancia_con_iva: number;
    porcentaje_ganancia_sin_iva: number;
    porcentaje_ganancia_con_iva: number;
    estado_sin_iva: string;
    estado_con_iva: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ProformasService {

  isLoading$: Observable<boolean>;
  isLoadingSubject: BehaviorSubject<boolean>;
  
  constructor(
    private http: HttpClient,
    public authservice: AuthService,
  ) {
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);
    this.isLoading$ = this.isLoadingSubject.asObservable();
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
    let URL = URL_SERVICIOS+"/proformas/search-clients?p=1"+LINK;
    let headers = new HttpHeaders({'Authorization': 'Bearer '+this.authservice.token});
    return this.http.get(URL,{headers:headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  searchProducts(search_product:string){
    this.isLoadingSubject.next(true);
    let LINK = "";
    if(search_product){
      LINK += "&search="+search_product;
    }
    let URL = URL_SERVICIOS+"/proformas/search-products?p=1"+LINK;
    let headers = new HttpHeaders({'Authorization': 'Bearer '+this.authservice.token});
    return this.http.get(URL,{headers:headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  configAll(){
    this.isLoadingSubject.next(true);
    let URL = URL_SERVICIOS+"/proformas/config";
    let headers = new HttpHeaders({'Authorization': 'Bearer '+this.authservice.token});
    return this.http.get(URL,{headers:headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  listProformas(page: number, filters: any = {}): Observable<ProformasResponse> {
    this.isLoadingSubject.next(true);
    let URL = URL_SERVICIOS+"/proformas?page="+page;
    
    // Agregar filtros si existen
    if (filters) {
      if (filters.search) {
        // Búsqueda específica por nombre de cliente
        URL += `&client_name=${encodeURIComponent(filters.search)}`;
      }
      Object.keys(filters).forEach(key => {
        if (filters[key] && key !== 'search' && key !== 'include') {
          URL += `&${key}=${encodeURIComponent(filters[key])}`;
        }
      });
    }

    // Agregar parámetros para incluir las relaciones necesarias
    URL += "&include=client,product";
    
    console.log('URL de la petición:', URL);
    let headers = new HttpHeaders({
      'Authorization': 'Bearer '+this.authservice.token,
      'Accept': 'application/json'
    });
    
    return this.http.get<ProformasResponse>(URL, {headers: headers}).pipe(
      tap(response => {
        console.log('Respuesta del servidor:', response);
        if (response && response.proformas && response.proformas.data) {
          console.log('Proformas encontradas:', response.proformas.data.length);
          response.proformas.data.forEach((proforma: Proforma) => {
            console.log('Proforma:', proforma.client?.full_name);
          });
        }
      }),
      catchError(error => {
        console.error('Error en la petición:', error);
        return throwError(() => error);
      }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  showProforma(PROFORMA_ID:string){
    this.isLoadingSubject.next(true);
    let URL = URL_SERVICIOS+"/proformas/"+PROFORMA_ID;
    let headers = new HttpHeaders({'Authorization': 'Bearer '+this.authservice.token});
    return this.http.get(URL,{headers:headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  evalDisponibilidad(PRODUCT_ID:string,unit_id:string,quantity:number){
    this.isLoadingSubject.next(true);
    let URL = URL_SERVICIOS+"/proformas/eval-disponibilidad/"+PRODUCT_ID+"?unit_id="+unit_id+"&quantity="+quantity;
    let headers = new HttpHeaders({'Authorization': 'Bearer '+this.authservice.token});
    return this.http.get(URL,{headers:headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  createProforma(data:any){
    this.isLoadingSubject.next(true);
    let URL = URL_SERVICIOS+"/proformas";
    let headers = new HttpHeaders({'Authorization': 'Bearer '+this.authservice.token});
    return this.http.post(URL,data,{headers:headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  editProforma(PROFORMA_ID:any,data:any){
    this.isLoadingSubject.next(true);
    let URL = URL_SERVICIOS+"/proformas/"+PROFORMA_ID;
    let headers = new HttpHeaders({'Authorization': 'Bearer '+this.authservice.token});
    return this.http.post(URL,data,{headers:headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  deleteProforma(PROFORMA_ID:string){
    this.isLoadingSubject.next(true);
    let URL = URL_SERVICIOS+"/proformas/"+PROFORMA_ID;
    let headers = new HttpHeaders({'Authorization': 'Bearer '+this.authservice.token});
    return this.http.delete(URL,{headers:headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // GESTION DE DETALLADO
  addDetailProforma(data:any){
    this.isLoadingSubject.next(true);
    let URL = URL_SERVICIOS+"/proforma-details";
    let headers = new HttpHeaders({'Authorization': 'Bearer '+this.authservice.token});
    return this.http.post(URL,data,{headers:headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  editDetailProforma(DETAIL_ID:string,data:any){
    this.isLoadingSubject.next(true);
    let URL = URL_SERVICIOS+"/proforma-details/"+DETAIL_ID;
    let headers = new HttpHeaders({'Authorization': 'Bearer '+this.authservice.token});
    return this.http.put(URL,data,{headers:headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  deleteDetailProforma(DETAIL_ID:string){
    this.isLoadingSubject.next(true);
    let URL = URL_SERVICIOS+"/proforma-details/"+DETAIL_ID;
    let headers = new HttpHeaders({'Authorization': 'Bearer '+this.authservice.token});
    return this.http.delete(URL,{headers:headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // NUEVO: Tomar Insumos
  tomarInsumos(proforma_id: string) {
    this.isLoadingSubject.next(true);
    const URL = `${URL_SERVICIOS}/proformas/${proforma_id}/tomar-insumos`;
    const headers = new HttpHeaders({ 'Authorization': 'Bearer ' + this.authservice.token });
    return this.http.post(URL, {}, { headers }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  uploadPdf(formData: FormData) {
    this.isLoadingSubject.next(true);
    let URL = URL_SERVICIOS+"/proformas/upload-pdf";
    let headers = new HttpHeaders({'Authorization': 'Bearer '+this.authservice.token});
    return this.http.post(URL, formData, {headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  getPdfs(proformaId: string) {
    this.isLoadingSubject.next(true);
    let URL = URL_SERVICIOS+"/proformas/get-pdfs/"+proformaId;
    let headers = new HttpHeaders({'Authorization': 'Bearer '+this.authservice.token});
    return this.http.get(URL, {headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  deletePdf(pdfId: number) {
    this.isLoadingSubject.next(true);
    let URL = URL_SERVICIOS+"/proformas/delete-pdf/"+pdfId;
    let headers = new HttpHeaders({'Authorization': 'Bearer '+this.authservice.token});
    return this.http.delete(URL, {headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  proformaPdf(proformaId: string) {
    this.isLoadingSubject.next(true);
    let URL = URL_SERVICIOS+"/proformas/"+proformaId+"/proforma-pdf";
    let headers = new HttpHeaders({
      'Authorization': 'Bearer '+this.authservice.token,
      'Accept': 'application/json'
    });
    return this.http.get(URL, {headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  getPdfUrl(fileName: string): string {
    // Si la URL ya es completa, la devolvemos tal cual
  
    // Si no, construimos la URL usando la URL base del backend
    const baseUrl = environment.production ? 'https://api-crm.mogancontrol.com' : URL_SERVICIOS.replace('/api', '').replace('http://', 'https://');
    return `${baseUrl}/storage/proformas/${fileName}`;
  }

  getProformaCostAnalysis(proformaId: string): Observable<AnalisisCostos> {
    return this.http.get<AnalisisCostos>(`${URL_SERVICIOS}/proformas/${proformaId}/analisis-costos`, {
      headers: {
        'Authorization': `Bearer ${this.authservice.token}`
      }
    });
  }

  getProformaInventoryItems(proformaId: number) {
    console.log('Servicio: getProformaInventoryItems llamado con ID:', proformaId);
    this.isLoadingSubject.next(true);
    let URL = URL_SERVICIOS+"/proformas/"+proformaId+"/inventory-items";
    console.log('Servicio: URL construida:', URL);
    console.log('Servicio: Token:', this.authservice.token ? 'Token presente' : 'Sin token');
    console.log('Servicio: URL_SERVICIOS:', URL_SERVICIOS);
    
    let headers = new HttpHeaders({'Authorization': 'Bearer '+this.authservice.token});
    
    return this.http.get(URL,{headers:headers}).pipe(
      map((response: any) => {
        console.log('Servicio: Respuesta raw del servidor:', response);
        console.log('Servicio: Tipo de respuesta:', typeof response);
        console.log('Servicio: Es array?:', Array.isArray(response));
        
        if (!response) {
          console.error('Servicio: No se recibió respuesta del servidor');
          return {
            success: false,
            message: 'No se recibió respuesta del servidor',
            items: {}
          };
        }

        // Si la respuesta es un array, es probable que sea un error del backend
        if (Array.isArray(response)) {
          console.error('Servicio: La respuesta es un array vacío, posible error del backend');
          return {
            success: false,
            message: 'La respuesta del servidor no tiene el formato esperado',
            items: {}
          };
        }

        // Asegurar que la respuesta tenga la estructura correcta
        const processedResponse = {
          success: response.success || false,
          message: response.message || '',
          items: response.items || {}
        };

        console.log('Servicio: Respuesta procesada:', processedResponse);
        return processedResponse;
      }),
      catchError(error => {
        console.error('Servicio: Error al obtener items del inventario:', {
          error: error,
          status: error?.status,
          statusText: error?.statusText,
          message: error?.message,
          url: error?.url,
          errorBody: error?.error
        });
        return of({
          success: false,
          message: error.error?.message || 'Error al obtener los items del inventario',
          items: {}
        });
      }),
      finalize(() => {
        console.log('Servicio: Finalizando getProformaInventoryItems');
        this.isLoadingSubject.next(false);
      })
    );
  }

  takeSelectedInventoryItems(proformaId: number, items: any[]) {
    console.log('takeSelectedInventoryItems - Iniciando con ID:', proformaId);
    console.log('takeSelectedInventoryItems - Items:', items);

    if (!proformaId) {
      console.error('takeSelectedInventoryItems - ID inválido');
      return throwError(() => new Error('ID de proforma inválido'));
    }

    if (!Array.isArray(items) || items.length === 0) {
      console.error('takeSelectedInventoryItems - Items inválidos');
      return throwError(() => new Error('No se proporcionaron items válidos'));
    }

    const headers = new HttpHeaders({
      'Authorization': 'Bearer ' + this.authservice.token,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    });

    const itemsWithDate = items.map(item => {
      console.log('takeSelectedInventoryItems - Procesando item:', item);
      return {
        ...item,
        fecha_tomado: new Date().toISOString()
      };
    });
    
    console.log('takeSelectedInventoryItems - Items con fecha:', itemsWithDate);
    console.log('takeSelectedInventoryItems - URL:', `${URL_SERVICIOS}/proformas/${proformaId}/take-inventory-items-by-detail`);

    return this.http.post(
      `${URL_SERVICIOS}/proformas/${proformaId}/take-inventory-items-by-detail`,
      { items: itemsWithDate },
      { headers }
    ).pipe(
      map((resp: any) => {
        console.log('takeSelectedInventoryItems - Respuesta raw:', resp);
        if (!resp) {
          console.error('takeSelectedInventoryItems - Respuesta nula');
          throw new Error('No se recibió respuesta del servidor');
        }
        if (resp.success) {
          console.log('takeSelectedInventoryItems - Éxito');
          return { success: true, message: 'Productos tomados correctamente' };
        }
        console.error('takeSelectedInventoryItems - Error en respuesta:', resp);
        throw new Error(resp.message || 'Error al tomar los productos');
      }),
      catchError(error => {
        console.error('takeSelectedInventoryItems - Error:', error);
        return throwError(() => new Error(error.error?.message || 'Error al tomar los productos'));
      })
    );
  }

  getWeeklyProgress(proforma_id: number) {
    this.isLoadingSubject.next(true);
    let URL = URL_SERVICIOS + "/proformas/" + proforma_id + "/weekly-progress";
    let headers = new HttpHeaders({'Authorization': 'Bearer '+this.authservice.token});
    return this.http.get(URL, {headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // GESTION DE SUBPROYECTOS
  getSubproyectos(proforma_id: string) {
    this.isLoadingSubject.next(true);
    let URL = URL_SERVICIOS + "/subproyectos?proforma_id=" + proforma_id;
    let headers = new HttpHeaders({'Authorization': 'Bearer '+this.authservice.token});
    return this.http.get(URL, {headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  updateWeeklyProgress(week: any): Observable<any> {
    this.isLoadingSubject.next(true);
    const url = `${URL_SERVICIOS}/proformas/${week.proforma_id}/weekly-progress`;
    
    return this.http.post(url, week, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${this.authservice.token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      })
    }).pipe(
      catchError(error => {
        console.error('Error en updateWeeklyProgress:', error);
        return throwError(() => error);
      }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }
}