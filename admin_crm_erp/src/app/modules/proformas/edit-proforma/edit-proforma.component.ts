import { Component, ElementRef, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { UBIGEO_DISTRITOS } from 'src/app/config/ubigeo_distritos';
import { UBIGEO_PROVINCIA } from 'src/app/config/ubigeo_provincias';
import { UBIGEO_REGIONES } from 'src/app/config/ubigeo_regiones';
import { CreateClientsCompanyComponent } from '../../clients/create-clients-company/create-clients-company.component';
import { CreateClientsPersonComponent } from '../../clients/create-clients-person/create-clients-person.component';
import { SearchClientsComponent } from '../componets/search-clients/search-clients.component';
import { ProformasService } from '../service/proformas.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-edit-proforma',
  templateUrl: './edit-proforma.component.html',
  styleUrls: ['./edit-proforma.component.scss']
})
export class EditProformaComponent {

  CLIENT_SELECTED:any;
  n_document:string = ''
  full_name:string = ''
  phone:string = ''

  // Nueva variable para subproyectos (reemplaza el manejo individual de productos)
  SUBPROYECTOS_DATA: any = [];
  
  description:string = '';
  final_product_title: string = '';
  final_product_description: string = '';
  weeks: number = 0;

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

  TODAY:string = 'Y/m/d';
  usar_precio_global: boolean = false;
  precio_global: number = 0;

  PROFORMA_ID:string = '';
  PROFORMA_SELECTED:any;

  constructor(
    public modalService: NgbModal,
    public proformaService: ProformasService,
    public toast: ToastrService,
    public ActivedRoute: ActivatedRoute,
  ) {
    
  }

  ngOnInit(): void {
    this.isLoading$ = this.proformaService.isLoading$;
    this.user = this.proformaService.authservice.user;
    this.sucursale_asesor = this.user.sucursale_id;
    this.ActivedRoute.params.subscribe((resp:any) => {
      console.log(resp);
      this.PROFORMA_ID = resp.id;
    })
    this.proformaService.showProforma(this.PROFORMA_ID).subscribe((resp:any) => {
      console.log(resp);

      this.PROFORMA_SELECTED = resp.proforma;

      this.CLIENT_SELECTED = this.PROFORMA_SELECTED.client;
      this.n_document = this.CLIENT_SELECTED.n_document;
      this.full_name = this.CLIENT_SELECTED.full_name;
      this.phone = this.CLIENT_SELECTED.phone;

      this.final_product_title = this.PROFORMA_SELECTED.final_product_title;
      this.final_product_description = this.PROFORMA_SELECTED.final_product_description;
      this.weeks = this.PROFORMA_SELECTED.weeks || 0;

      this.sucursale_deliverie_id = this.PROFORMA_SELECTED.proforma_deliverie.sucursale_deliverie_id;
      this.date_entrega = this.PROFORMA_SELECTED.proforma_deliverie.date_entrega;
      this.address = this.PROFORMA_SELECTED.proforma_deliverie.address;

      this.ubigeo_region = this.PROFORMA_SELECTED.proforma_deliverie.ubigeo_region;
      this.ubigeo_provincia = this.PROFORMA_SELECTED.proforma_deliverie.ubigeo_provincia;
      this.ubigeo_distrito = this.PROFORMA_SELECTED.proforma_deliverie.ubigeo_distrito;

      this.region = this.PROFORMA_SELECTED.proforma_deliverie.region;
      this.provincia = this.PROFORMA_SELECTED.proforma_deliverie.provincia;
      this.distrito = this.PROFORMA_SELECTED.proforma_deliverie.distrito;
      this.changeRegion({
        target: {
          value: this.ubigeo_region,
        }
      });

      this.changeProvincia({
        target: {
          value: this.ubigeo_provincia,
        }
      });

      this.agencia = this.PROFORMA_SELECTED.proforma_deliverie.agencia;
      this.full_name_encargado = this.PROFORMA_SELECTED.proforma_deliverie.full_name_encargado;
      this.documento_encargado = this.PROFORMA_SELECTED.proforma_deliverie.documento_encargado;
      this.telefono_encargado = this.PROFORMA_SELECTED.proforma_deliverie.telefono_encargado;

      this.TOTAL_PROFORMA = this.PROFORMA_SELECTED.total;
      this.TOTAL_IMPUESTO_PROFORMA = this.PROFORMA_SELECTED.igv;
      this.DEBT_PROFORMA = this.PROFORMA_SELECTED.debt;
      this.amount_payment = this.PROFORMA_SELECTED.paid_out;

    })
    this.proformaService.configAll().subscribe((resp:any) => {
      console.log(resp);
      this.client_segments = resp.client_segments;
      this.asesores = resp.asesores;
      this.sucursale_deliveries = resp.sucursale_deliveries;
      this.method_payments  = resp.method_payments;
      this.TODAY = resp.today;
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
    this.isLoadingProcess();
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
  
  changeSucursaleDeliverie(){
    this.ubigeo_region = '';
    this.region = '';
    this.ubigeo_provincia = '';
    this.provincia = '';
    this.ubigeo_distrito = '';
    this.distrito = '';
    this.agencia = '';
    this.full_name_encargado = '';
    this.documento_encargado = '';
    this.telefono_encargado = '';
  }
  
  save(){
    if(!this.CLIENT_SELECTED){
      this.toast.error("Validación","Necesitas seleccionar un cliente");
      return;
    }
    if(this.SUBPROYECTOS_DATA.length == 0){
      this.toast.error("Error","Debe tener al menos un subproyecto");
      return;
    }
    if(!this.sucursale_deliverie_id){
      this.toast.error("Validación","El lugar de entrega es requerido")
      return;
    }
    if(!this.date_entrega){
      this.toast.error("Validación","La fecha de entrega es requerido")
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

    if(this.validationDeliverie() && this.sucursale_deliverie_id != 5){
      if(!this.agencia){
        this.toast.error("Validación","La agencia es requerido")
        return;
      }
      if(!this.full_name_encargado){
        this.toast.error("Validación","El nombre del encargado es requerido")
        return;
      }
      if(!this.documento_encargado){
        this.toast.error("Validación","El documento del encargado es requerido")
        return;
      }
      if(!this.telefono_encargado){
        this.toast.error("Validación","El telefono del encargado es requerido")
        return;
      }
    }
    if(this.sucursale_deliverie_id == 6){
      if(!this.ubigeo_region){
        this.toast.error("Validación","La region es requerido")
        return;
      }
      if(!this.ubigeo_provincia){
        this.toast.error("Validación","La provincia es requerido")
        return;
      }
      if(!this.ubigeo_distrito){
        this.toast.error("Validación","La distrito es requerido")
        return;
      }
    }

    let DISTRITO_SELECTED = this.DISTRITOS.find((distr:any) => distr.id == this.ubigeo_distrito);
    if(DISTRITO_SELECTED){
      this.distrito = DISTRITO_SELECTED.name;
    }

    // Usar precio global si está activado
    const totalToUse = this.usar_precio_global && this.precio_global > 0 ? this.precio_global : this.TOTAL_PROFORMA;

    // Usar FormData para enviar los datos igual que en create-proforma
    let formData = new FormData();
    
    // Datos básicos de la proforma
    formData.append("client_id", this.CLIENT_SELECTED.id.toString());
    formData.append("client_segment_id", this.CLIENT_SELECTED.client_segment_id.toString());
    formData.append("subtotal", totalToUse.toString());
    formData.append("total", totalToUse.toString());
    formData.append("igv", this.TOTAL_IMPUESTO_PROFORMA.toString());
    formData.append("debt", this.DEBT_PROFORMA.toString());
    formData.append("paid_out", this.PAID_OUT_PROFORMA.toString());
    formData.append("description", this.description);
    formData.append("final_product_title", this.final_product_title);
    formData.append("final_product_description", this.final_product_description);
    formData.append("weeks", this.weeks.toString());
    formData.append("usar_precio_global", this.usar_precio_global.toString());
    if (this.usar_precio_global) {
      formData.append("precio_global", this.precio_global.toString());
    }
    
    // Datos de entrega
    formData.append("sucursale_deliverie_id", this.sucursale_deliverie_id.toString());
    formData.append("date_entrega", this.date_entrega);
    formData.append("address", this.address);
    formData.append("ubigeo_region", this.ubigeo_region);
    formData.append("ubigeo_provincia", this.ubigeo_provincia);
    formData.append("ubigeo_distrito", this.ubigeo_distrito);
    formData.append("region", this.region);
    formData.append("provincia", this.provincia);
    formData.append("distrito", this.distrito);
    formData.append("agencia", this.agencia);
    formData.append("full_name_encargado", this.full_name_encargado);
    formData.append("documento_encargado", this.documento_encargado);
    formData.append("telefono_encargado", this.telefono_encargado);
    
    // Datos de subproyectos
    formData.append("SUBPROYECTOS_DATA", JSON.stringify(this.SUBPROYECTOS_DATA));

    this.proformaService.editProforma(this.PROFORMA_ID, formData).subscribe((resp:any) => {
      console.log(resp);
      this.toast.success("Exito","La proforma se editó con éxito");
    },(err:any) => {
      console.log(err);
      this.toast.error("Validación","Hubo un error en el servidor, intente nuevamente o acceda a la consola y vea que sucede");
    })
  }

  updateTotals() {
    // Calcular totales basados en subproyectos
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

  // Método para manejar cambios en subproyectos
  onSubproyectosChanged(data: any) {
    this.SUBPROYECTOS_DATA = data.subproyectos;
    this.updateTotals();
  }
}
