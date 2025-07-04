import { HttpClient, HttpHeaders, HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
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

interface PdfUploadResponse {
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

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': 'Bearer ' + this.authservice.token,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    });
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
    return this.http.get(URL, {
      headers: this.getHeaders(),
      withCredentials: false
    }).pipe(
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
    return this.http.get(URL, {
      headers: this.getHeaders(),
      withCredentials: false
    }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  configAll(){
    this.isLoadingSubject.next(true);
    let URL = URL_SERVICIOS+"/proformas/config";
    return this.http.get(URL, {
      headers: this.getHeaders(),
      withCredentials: false
    }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  listProformas(page: number, filters: any = {}): Observable<ProformasResponse> {
    this.isLoadingSubject.next(true);
    let URL = URL_SERVICIOS+"/proformas?page="+page;
    
    if (filters) {
      if (filters.search) {
        URL += `&client_name=${encodeURIComponent(filters.search)}`;
      }
      Object.keys(filters).forEach(key => {
        if (filters[key] && key !== 'search' && key !== 'include') {
          URL += `&${key}=${encodeURIComponent(filters[key])}`;
        }
      });
    }

    URL += "&include=client,product";
    
    return this.http.get<ProformasResponse>(URL, {
      headers: this.getHeaders(),
      withCredentials: false
    }).pipe(
      tap(response => {
        console.log('Respuesta del servidor:', response);
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

  createProforma(data: FormData) {
    this.isLoadingSubject.next(true);
    
    // Log de los datos recibidos
    console.log('Datos recibidos en el servicio:', data);
    
    // Convertir FormData a objeto JSON
    const jsonData: { [key: string]: any } = {};
    data.forEach((value, key) => {
      if (key === 'SUBPROYECTOS_DATA' || key === 'DETAIL_PROFORMAS') {
        try {
          // Si ya es un objeto, usarlo directamente
          if (typeof value === 'object') {
            jsonData[key] = value;
          } else {
            // Si es string, intentar parsearlo
            jsonData[key] = JSON.parse(value.toString());
          }
        } catch (e) {
          console.error(`Error al procesar ${key}:`, e);
          jsonData[key] = value;
        }
      } else {
        jsonData[key] = value;
      }
    });
    
    // Asegurarse de que client_id sea string
    if (jsonData.client_id) {
      jsonData.client_id = jsonData.client_id.toString();
    }
    
    console.log('Datos que se enviarán al servidor:', jsonData);
    
    return this.http.post(URL_SERVICIOS + "/proformas", jsonData, {
      headers: new HttpHeaders({
        'Authorization': 'Bearer ' + this.authservice.token,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }),
      withCredentials: false
    }).pipe(
      tap(response => {
        console.log('Respuesta del servidor:', response);
      }),
      catchError(error => {
        console.error('Error en la petición:', error);
        console.error('Datos enviados:', jsonData);
        if (error.status === 0) {
          console.error('Error de conexión - El servidor no está respondiendo');
          return throwError(() => new Error('No se pudo conectar con el servidor. Por favor, verifica que el servidor esté en ejecución.'));
        }
        return throwError(() => error);
      }),
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
    let headers = new HttpHeaders({
      'Authorization': 'Bearer '+this.authservice.token
    });
    
    console.log('Iniciando subida de PDF...');
    console.log('URL:', URL);
    console.log('Headers:', headers);
    
    // Asegurarse de que el FormData tenga el contenido correcto
    console.log('Contenido del FormData:');
    formData.forEach((value, key) => {
      console.log(`${key}:`, value);
    });
    
    return this.http.post<PdfUploadResponse>(URL, formData, {
      headers: headers,
      reportProgress: true,
      observe: 'events'
    }).pipe(
      tap(event => {
        if (event.type === 1) { // UploadProgress
          const percentDone = Math.round(100 * event.loaded / (event.total || event.loaded));
          console.log(`Progreso: ${percentDone}%`);
        }
        if (event.type === 4) { // Response
          console.log('Tipo de respuesta:', typeof event.body);
          console.log('Respuesta completa del servidor:', JSON.stringify(event.body, null, 2));
          if (event.body) {
            console.log('URL del PDF:', event.body.url);
            console.log('Ruta del archivo:', event.body.file_path);
            console.log('Ruta de almacenamiento:', event.body.storage_path);
          }
        }
      }),
      catchError(error => {
        console.error('Error detallado:', error);
        console.error('Estado del error:', error.status);
        console.error('Mensaje del error:', error.message);
        console.error('Respuesta del error:', error.error);
        return throwError(() => error);
      }),
      finalize(() => {
        console.log('Finalizando subida de PDF');
        this.isLoadingSubject.next(false);
      })
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

  viewPdf(fileName: string) {
    this.isLoadingSubject.next(true);
    let URL = URL_SERVICIOS+"/proformas/view-pdf/"+fileName;
    let headers = new HttpHeaders({
      'Authorization': 'Bearer '+this.authservice.token
    });
    return this.http.get(URL, {headers: headers, responseType: 'blob'}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  getPdfUrl(filename: string): string {
    console.log('=== INICIO getPdfUrl ===');
    console.log('Parámetros recibidos:', {
      filename,
      tipo: typeof filename,
      longitud: filename?.length,
      environment: environment.production ? 'PRODUCCIÓN' : 'DESARROLLO'
    });
    
    if (!filename) {
      console.error('Nombre de archivo inválido');
      return '';
    }

    // Usar URL_SERVICIOS en lugar de la URL hardcodeada
    const baseUrl = URL_SERVICIOS;
    console.log('Usando URL base:', baseUrl);

    // Asegurar que el nombre del archivo esté correctamente codificado
    const encodedFilename = encodeURIComponent(filename);
    console.log('Codificación del nombre:', {
      original: filename,
      codificado: encodedFilename
    });
    
    // Construir la URL final
    const url = `${baseUrl}/storage/proformas/${encodedFilename}`;
    console.log('URL final generada:', url);
    
    // Verificar si la URL es accesible
    fetch(url, { 
      method: 'HEAD',
      headers: {
        'Accept': 'application/pdf',
        'Authorization': `Bearer ${this.authservice.token}`
      }
    })
      .then(response => {
        console.log('Verificación de URL:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          url: response.url,
          headers: {
            'content-type': response.headers.get('content-type'),
            'content-length': response.headers.get('content-length')
          }
        });
      })
      .catch(error => {
        console.error('Error al verificar URL:', {
          mensaje: error.message,
          tipo: error.name,
          url: url
        });
      });

    console.log('=== FIN getPdfUrl ===');
    return url;
  }

  getProformaCostAnalysis(proformaId: string): Observable<AnalisisCostos> {
    return this.http.get<AnalisisCostos>(`${URL_SERVICIOS}/proformas/${proformaId}/analisis-costos`, {
      headers: {
        'Authorization': `Bearer ${this.authservice.token}`
      }
    });
  }

  getProformaInventoryItems(proformaId: number): Observable<any> {
    this.isLoadingSubject.next(true);
    return this.http.get(`${URL_SERVICIOS}/proformas/${proformaId}/inventory-items`, {
      headers: this.getHeaders(),
      withCredentials: false
    }).pipe(
      tap(response => {
        console.log('Respuesta del servidor:', response);
      }),
      catchError(error => {
        console.error('Error al obtener items del inventario:', error);
        return throwError(() => error);
      }),
      finalize(() => this.isLoadingSubject.next(false))
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

  generateSalidaInsumosPDF(proformaId: number): Observable<Blob> {
    this.isLoadingSubject.next(true);
    
    return this.http.get(`${URL_SERVICIOS}/proformas/${proformaId}/salida-insumos-pdf`, {
      headers: this.getHeaders(),
      responseType: 'blob',
      withCredentials: false
    }).pipe(
      tap(response => {
        console.log('PDF generado exitosamente, size:', response.size);
      }),
      catchError(error => {
        console.error('Error al generar PDF:', error);
        return throwError(() => error);
      }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  debugSalidaInsumos(proformaId: number): Observable<any> {
    this.isLoadingSubject.next(true);
    
    return this.http.get(`${URL_SERVICIOS}/proformas/${proformaId}/debug-salida-insumos`, {
      headers: this.getHeaders(),
      withCredentials: false
    }).pipe(
      tap(response => {
        console.log('Debug completado:', response);
      }),
      catchError(error => {
        console.error('Error en debug:', error);
        return throwError(() => error);
      }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  debugSalidaInsumosHTML(proformaId: number): Observable<string> {
    this.isLoadingSubject.next(true);
    
    return this.http.get(`${URL_SERVICIOS}/proformas/${proformaId}/debug-salida-insumos-html`, {
      headers: this.getHeaders(),
      responseType: 'text',
      withCredentials: false
    }).pipe(
      tap(response => {
        console.log('Debug HTML completado, tamaño:', response.length);
      }),
      catchError(error => {
        console.error('Error en debug HTML:', error);
        return throwError(() => error);
      }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Error en el servicio de proformas:', error);
    let errorMessage = 'Error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      errorMessage = error.error?.message || error.message || 'Error en el servidor';
    }
    
    return throwError(() => new Error(errorMessage));
  }
}