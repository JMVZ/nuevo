import { Component, ElementRef, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreateClientsPersonComponent } from '../../clients/create-clients-person/create-clients-person.component';
import { CreateClientsCompanyComponent } from '../../clients/create-clients-company/create-clients-company.component';
import { ProformasService } from '../service/proformas.service';
import { SearchClientsComponent } from '../componets/search-clients/search-clients.component';
import { ToastrService } from 'ngx-toastr';
import { UBIGEO_DISTRITOS } from 'src/app/config/ubigeo_distritos';
import { UBIGEO_PROVINCIA } from 'src/app/config/ubigeo_provincias';
import { UBIGEO_REGIONES } from 'src/app/config/ubigeo_regiones';
@Component({
  selector: 'app-create-proforma',
  templateUrl: './create-proforma.component.html',
  styleUrls: ['./create-proforma.component.scss']
})
export class CreateProformaComponent {

  CLIENT_SELECTED:any;
  n_document:string = ''
  full_name:string = ''
  phone:string = ''

  // Nueva variable para subproyectos
  SUBPROYECTOS_DATA: any = [];
  
  description:string = '';
  final_product_title: string = '';
  final_product_description: string = '';
  weeks: number = 0;
  user_id: string = '';

  agencia:string = '';
  full_name_encargado:string = '';
  documento_encargado:string = '';
  telefono_encargado:string = '';  


  REGIONES:any = UBIGEO_REGIONES;
  PROVINCIAS:any = UBIGEO_PROVINCIA;
  DISTRITOS:any = UBIGEO_DISTRITOS;
  PROVINCIA_SELECTEDS:any = [];
  DISTRITO_SELECTEDS:any = [];
  ubigeo_region:string = '';
  ubigeo_provincia:string = '';
  ubigeo_distrito:string = '';
  region:string = '';
  provincia:string = '';
  distrito:string = '';

  sucursale_deliverie_id:any = '';
  address:string = '';
  date_entrega:any = null;
  
  isLoading$:any;
  client_segments:any = [];
  asesores:any = [];
  sucursale_deliveries:any = [];
  method_payments:any = [];
  user:any;
  sucursale_asesor:string = '';

  method_payment_id:any = '';
  METHOD_PAYMENT_SELECTED:any;
  banco_id:any = '';
  amount_payment:number = 0;

  payment_file:any;
  imagen_previzualiza:any = '';

  TOTAL_PROFORMA:number = 0;
  TOTAL_IMPUESTO_PROFORMA:number = 0;
  DEBT_PROFORMA:number = 0;
  PAID_OUT_PROFORMA:number = 0;

  TODAY:string = '';
  usar_precio_global: boolean = false;
  precio_global: number = 0;

  constructor(
    public modalService: NgbModal,
    public proformaService: ProformasService,
    public toast: ToastrService,
  ) {
    
  }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.isLoading$ = this.proformaService.isLoading$;
    this.user = this.proformaService.authservice.user;
    this.sucursale_asesor = this.user.sucursale_id;
    this.proformaService.configAll().subscribe((resp:any) => {
      this.client_segments = resp.client_segments;
      this.asesores = resp.asesores;
      this.sucursale_deliveries = resp.sucursale_deliveries;
      this.method_payments  = resp.method_payments;
      this.TODAY = resp.today;
      // this.isLoadingProcess();
    })
  }

  isLoadingProcess(){
    this.proformaService.isLoadingSubject.next(true);
    setTimeout(() => {
      this.proformaService.isLoadingSubject.next(false);
    }, 50);
  }

  searchClients(){
    if(!this.n_document && !this.full_name && !this.phone){
      this.toast.error("Validación","Necesitas ingresar al menos uno de los campos");
      return;
    }
    this.proformaService.searchClients(this.n_document,this.full_name,this.phone).subscribe((resp:any) => {
      console.log(resp);
      if(resp.clients.length > 1){
        this.openSelectedClients(resp.clients);
      }else{
        if(resp.clients.length == 1){
          if (!resp.clients[0].client_segment_id) {
            this.toast.error("Error", "El cliente encontrado no tiene un segmento asignado. Por favor, asigne un segmento al cliente antes de continuar.");
            return;
          }
          this.CLIENT_SELECTED = resp.clients[0];
          this.n_document = this.CLIENT_SELECTED.n_document;
          this.full_name = this.CLIENT_SELECTED.full_name;
          this.phone = this.CLIENT_SELECTED.phone;
          this.toast.success("Exito","Se selecciono al cliente de la proforma");
          this.isLoadingProcess();
        }else{
          this.toast.error("Validación","No hay coincidencia en la busqueda");
        }
      }
    })
  }
  openSelectedClients(clients:any = []){
    const modalRef = this.modalService.open(SearchClientsComponent,{size:'lg',centered: true});
    modalRef.componentInstance.clients = clients

    modalRef.componentInstance.ClientSelected.subscribe((client:any) => {
      if (!client.client_segment_id) {
        this.toast.error("Error", "El cliente seleccionado no tiene un segmento asignado. Por favor, asigne un segmento al cliente antes de continuar.");
        return;
      }
      this.CLIENT_SELECTED = client;
      this.n_document = this.CLIENT_SELECTED.n_document;
      this.full_name = this.CLIENT_SELECTED.full_name;
      this.phone = this.CLIENT_SELECTED.phone;
      this.isLoadingProcess();
      this.toast.success("Exito","Se selecciono al cliente de la proforma");
    })
  }
  createClientPerson(){
    const modalRef = this.modalService.open(CreateClientsPersonComponent,{size:'lg',centered: true});
    modalRef.componentInstance.client_segments = this.client_segments;
    modalRef.componentInstance.asesores = this.asesores;

    modalRef.componentInstance.ClientsC.subscribe((client:any) => {
      this.CLIENT_SELECTED = client;
      this.n_document = this.CLIENT_SELECTED.n_document;
      this.full_name = this.CLIENT_SELECTED.full_name;
      this.phone =  this.CLIENT_SELECTED.phone;
      this.isLoadingProcess();
    })
  }
  createClientCompany(){
    const modalRef = this.modalService.open(CreateClientsCompanyComponent,{size:'lg',centered: true});
    modalRef.componentInstance.client_segments = this.client_segments;
    modalRef.componentInstance.asesores = this.asesores;
    modalRef.componentInstance.ClientsC.subscribe((client:any) => {
      this.CLIENT_SELECTED = client;
      this.n_document = this.CLIENT_SELECTED.n_document;
      this.full_name = this.CLIENT_SELECTED.full_name;
      this.phone =  this.CLIENT_SELECTED.phone;
      this.isLoadingProcess();
    })
  }
  resetClient(){
    this.CLIENT_SELECTED = null;
    this.n_document = '';
    this.full_name = '';
    this.phone = '';
    this.final_product_title = '';
    this.final_product_description = '';
  }

  validationDeliverie(){
    if(this.sucursale_deliverie_id){
      let DELIVERIE_SELECTED = this.sucursale_deliveries.find((deliv:any) => deliv.id == this.sucursale_deliverie_id);
      if(DELIVERIE_SELECTED){
        if(DELIVERIE_SELECTED.name.indexOf(this.user.sucursale_name) != -1){
          return false;
        }
      }
    }
    return true;
  }

  changeRegion($event:any){
    console.log($event.target.value);
    let REGION_ID = $event.target.value;
    let REGION_SELECTED = this.REGIONES.find((region:any) => region.id == REGION_ID);
    if(REGION_SELECTED){
      this.region = REGION_SELECTED.name;
    }
    let provincias = this.PROVINCIAS.filter((provincia:any) => provincia.department_id == REGION_ID);
    console.log(provincias);
    this.PROVINCIA_SELECTEDS = provincias;
  }
  changeProvincia($event:any){
    console.log($event.target.value);
    let PROVINCIA_ID = $event.target.value;
    let PROVINCIA_SELECTED = this.PROVINCIAS.find((prov:any) => prov.id == PROVINCIA_ID);
    if(PROVINCIA_SELECTED){
      this.provincia = PROVINCIA_SELECTED.name;
    }
    let distritos = this.DISTRITOS.filter((distrito:any) => distrito.province_id == PROVINCIA_ID);
    console.log(distritos);
    this.DISTRITO_SELECTEDS = distritos;
  }

  resetSucursaleDeliverie(){
    this.agencia = '';
    this.full_name_encargado = '';
    this.documento_encargado = '';
    this.telefono_encargado = '';

    this.region = '';
    this.distrito = '';
    this.provincia = '';
    this.ubigeo_region = '';
    this.ubigeo_provincia = '';
    this.ubigeo_distrito = '';
    this.sucursale_deliverie_id = '';
    this.address = '';
    this.date_entrega = null;
  }

  changeMethodPayment(){
    this.METHOD_PAYMENT_SELECTED = this.method_payments.find((item:any) => item.id == this.method_payment_id);
    this.banco_id = '';
  }

  processFile($event:any){
    if($event.target.files[0].type.indexOf("image") < 0){
      this.toast.warning("WARN","El archivo no es una imagen");
      return;
    }
    this.payment_file = $event.target.files[0];
    let reader = new FileReader();
    reader.readAsDataURL(this.payment_file);
    reader.onloadend = () => this.imagen_previzualiza = reader.result;
    this.isLoadingProcess();
  }

  save(){
    // Validación mejorada del cliente
    if(!this.CLIENT_SELECTED){
      this.toast.error("Error","Debe seleccionar un cliente");
      return;
    }

    if(!this.CLIENT_SELECTED.id){
      this.toast.error("Error","El cliente seleccionado no tiene un ID válido");
      return;
    }

    // Validar que el cliente tenga un segmento asignado
    if(!this.CLIENT_SELECTED.client_segment_id){
      this.toast.error("Error","El cliente seleccionado no tiene un segmento asignado");
      return;
    }

    // Validar los demás campos requeridos
    if(this.SUBPROYECTOS_DATA.length == 0){
      this.toast.error("Error","Debe agregar al menos un subproyecto");
      return;
    }
    if(!this.sucursale_deliverie_id){
      this.toast.error("Error","Debe seleccionar una sucursal de entrega");
      return;
    }
    if(!this.date_entrega){
      this.toast.error("Error","Debe seleccionar una fecha de entrega");
      return;
    }
    if(!this.final_product_title){
      this.toast.error("Error","Debe ingresar el título del producto final");
      return;
    }
    if(!this.final_product_description){
      this.toast.error("Error","Debe ingresar la descripción del producto final");
      return;
    }
    if(!this.weeks || this.weeks < 1){
      this.toast.error("Error","Debe ingresar un número válido de semanas");
      return;
    }
    if(!this.user_id){
      this.toast.error("Error","Debe seleccionar un asesor responsable");
      return;
    }

    try {
      // Log de datos para depuración
      console.log('Cliente seleccionado:', this.CLIENT_SELECTED);
      console.log('ID del cliente:', this.CLIENT_SELECTED.id);
      console.log('Subproyectos:', this.SUBPROYECTOS_DATA);

      const formData = new FormData();
      
      // Datos del cliente
      formData.append("client_id", this.CLIENT_SELECTED.id.toString());
      formData.append("client_segment_id", this.CLIENT_SELECTED.client_segment_id.toString());
      
      // Usar precio global si está activado
      const totalToUse = this.usar_precio_global && this.precio_global > 0 ? this.precio_global : this.TOTAL_PROFORMA;
      
      // Datos financieros
      formData.append("subtotal", totalToUse.toString());
      formData.append("total", totalToUse.toString());
      formData.append("igv", this.TOTAL_IMPUESTO_PROFORMA.toString());
      formData.append("debt", totalToUse.toString());
      formData.append("paid_out", this.PAID_OUT_PROFORMA.toString());
      
      // Datos de subproyectos y detalles
      formData.append("SUBPROYECTOS_DATA", JSON.stringify(this.SUBPROYECTOS_DATA));
      formData.append("DETAIL_PROFORMAS", JSON.stringify([]));
      
      // Configuración de precio global
      formData.append("usar_precio_global", this.usar_precio_global.toString());
      if(this.usar_precio_global) {
        formData.append("precio_global", this.precio_global.toString());
      }
      
      // Datos de entrega
      formData.append("sucursale_deliverie_id", this.sucursale_deliverie_id.toString());
      formData.append("date_entrega", this.date_entrega);
      formData.append("address", this.address || '');
      
      // Datos de ubicación
      formData.append("ubigeo_region", this.ubigeo_region || '');
      formData.append("ubigeo_provincia", this.ubigeo_provincia || '');
      formData.append("ubigeo_distrito", this.ubigeo_distrito || '');
      formData.append("region", this.region || '');
      formData.append("provincia", this.provincia || '');
      formData.append("distrito", this.distrito || '');
      
      // Datos de agencia
      formData.append("agencia", this.agencia || '');
      formData.append("full_name_encargado", this.full_name_encargado || '');
      formData.append("documento_encargado", this.documento_encargado || '');
      formData.append("telefono_encargado", this.telefono_encargado || '');
      
      // Datos del producto
      formData.append("description", this.description || '');
      formData.append("final_product_title", this.final_product_title);
      formData.append("final_product_description", this.final_product_description);
      formData.append("weeks", this.weeks.toString());
      formData.append("user_id", this.user_id);

      // Datos de pago
      if(this.method_payment_id){
        formData.append("method_payment_id", this.method_payment_id.toString());
        formData.append("amount_payment", this.amount_payment.toString());
        if(this.payment_file){
          formData.append("payment_file", this.payment_file);
        }
        if(this.banco_id){
          formData.append("banco_id", this.banco_id.toString());
        }
      }

      // Log de los datos que se envían
      const formDataObj: { [key: string]: any } = {};
      formData.forEach((value, key) => {
        formDataObj[key] = value;
        console.log(`Campo ${key}:`, value);
      });
      console.log('Datos completos que se envían:', formDataObj);

      this.proformaService.createProforma(formData).subscribe({
        next: (resp:any) => {
          console.log('Respuesta del servidor:', resp);
          if(resp.message === 200) {
            this.toast.success("Éxito","La proforma se creó con éxito");
            this.resetForm();
          } else {
            this.toast.error("Error", resp.error || "Hubo un error al crear la proforma");
          }
        },
        error: (err:any) => {
          console.error('Error al crear proforma:', err);
          console.error('Detalles del error:', {
            status: err.status,
            statusText: err.statusText,
            error: err.error,
            message: err.message,
            requestData: formDataObj
          });
          let mensajeError = "Error al crear la proforma";
          if (err.error?.message) {
            mensajeError = err.error.message;
          } else if (err.message) {
            mensajeError = err.message;
          }
          this.toast.error("Error", mensajeError);
        },
        complete: () => {
          this.isLoadingProcess();
        }
      });
    } catch (error) {
      console.error('Error al preparar los datos:', error);
      this.toast.error("Error","Hubo un error al preparar los datos de la proforma");
      this.isLoadingProcess();
    }
  }

  private resetForm() {
    this.resetClient();
    this.SUBPROYECTOS_DATA = [];
    this.resetSucursaleDeliverie();
    this.TOTAL_PROFORMA = 0;
    this.method_payment_id = '';
    this.amount_payment = 0;
    this.imagen_previzualiza = '';
    this.payment_file = null;
    this.TOTAL_IMPUESTO_PROFORMA = 0;
    this.DEBT_PROFORMA = 0;
    this.PAID_OUT_PROFORMA = 0;
    this.banco_id = '';
    this.description = '';
    this.weeks = 0;
    this.usar_precio_global = false;
    this.precio_global = 0;
    this.user_id = '';
  }

  // Agregar método para manejar cambios en subproyectos
  onSubproyectosChanged(data: any) {
    this.SUBPROYECTOS_DATA = data.subproyectos;
    
    if(this.usar_precio_global && this.precio_global > 0){
      this.TOTAL_PROFORMA = this.precio_global;
      this.TOTAL_IMPUESTO_PROFORMA = 0;
      this.DEBT_PROFORMA = this.precio_global;
    } else {
      this.TOTAL_PROFORMA = data.total;
      this.TOTAL_IMPUESTO_PROFORMA = 0; // Los subproyectos ya calculan impuestos
      this.DEBT_PROFORMA = data.total;
    }
    
    this.PAID_OUT_PROFORMA = 0;
    this.isLoadingProcess();
  }

  sumTotalDetail(){
    // Método actualizado para subproyectos
    if(this.usar_precio_global && this.precio_global > 0){
      this.TOTAL_PROFORMA = this.precio_global;
      this.TOTAL_IMPUESTO_PROFORMA = 0;
      this.DEBT_PROFORMA = this.precio_global;
    } else {
      this.TOTAL_PROFORMA = this.SUBPROYECTOS_DATA.reduce((sum: number, subproyecto: any) => {
        return sum + subproyecto.productos.reduce((subSum: number, producto: any) => subSum + producto.total, 0);
      }, 0);
      this.TOTAL_IMPUESTO_PROFORMA = 0;
      this.DEBT_PROFORMA = this.TOTAL_PROFORMA;
    }
    this.isLoadingProcess();
  }
} 
