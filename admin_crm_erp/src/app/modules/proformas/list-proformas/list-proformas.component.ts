import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ProformasService } from '../service/proformas.service';
import { DeleteProformaComponent } from '../delete-proforma/delete-proforma.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { isPermission, URL_SERVICIOS } from 'src/app/config/config';
import { OpenDetailProformaComponent } from '../componets/open-detail-proforma/open-detail-proforma.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { SelectInventoryItemsComponent } from '../componets/select-inventory-items/select-inventory-items.component';
import { WeeklyProgressComponent } from '../componets/weekly-progress/weekly-progress.component';

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

@Component({
  selector: 'app-list-proformas',
  templateUrl: './list-proformas.component.html',
  styleUrls: ['./list-proformas.component.scss']
})
export class ListProformasComponent implements OnInit {

  search:string = '';
  PROFORMAS:any = [];
  isLoading$:any;
  isLoading: boolean = false;

  totalPages:number = 0;
  currentPage:number = 1;

  client_segments:any = [];
  asesores:any = [];

  client_segment_id:string = '';
  type:string = '';
  asesor_id:string = '';

  search_client:string =  '';
  search_product:string =  '';
  start_date:any = null;
  end_date:any = null;
  product_categorie_id:string = '';
  product_categories:any = [];

  constructor(
    public modalService: NgbModal,
    public proformasService: ProformasService,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private toast: ToastrService
  ) {
    
  }

  ngOnInit(): void {
    this.isLoading$ = this.proformasService.isLoading$;
    this.isLoading$.subscribe((loading: boolean) => {
      this.isLoading = loading;
      this.cdr.detectChanges();
    });
    this.listProformas();
    this.configAll();
  }
  

  listProformas(page = 1){
    let data: any = {};
    
    if (this.search) data.search = this.search;
    if (this.client_segment_id) data.client_segment_id = this.client_segment_id;
    if (this.asesor_id) data.asesor_id = this.asesor_id;
    if (this.product_categorie_id) data.product_categorie_id = this.product_categorie_id;
    if (this.search_client) data.search_client = this.search_client;
    if (this.search_product) data.search_product = this.search_product;
    if (this.start_date) data.start_date = this.start_date;
    if (this.end_date) data.end_date = this.end_date;
    if (this.type) data.state_proforma = this.type;

    this.proformasService.listProformas(page, data).subscribe({
      next: (resp: any) => {
        console.log('Respuesta del servidor:', resp);
        this.PROFORMAS = resp.proformas.data;
        this.totalPages = resp.total;
        this.currentPage = page;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar proformas:', error);
        this.toast.error('Error al cargar las proformas');
      }
    });
  }

  resetlistProformas(){
    this.search = '';
    this.client_segment_id = '';
    this.type = '';
    this.asesor_id = '';
    this.product_categorie_id = '';
    this.search_client = '';
    this.search_product = '';
    this.start_date = '';
    this.end_date = '';
    this.type = '';
    this.listProformas();
  }

  configAll(){
    this.proformasService.configAll().subscribe((resp:any) => {
      console.log(resp);
      this.client_segments = resp.client_segments;
      this.asesores = resp.asesores;
      this.product_categories = resp.product_categories;
    })
  }

  loadPage($event:any){
    this.listProformas($event);
  }

  deleteProforma(PROFORMA_SELECTED:any){
    const modalRef = this.modalService.open(DeleteProformaComponent,{centered:true, size: 'md'});
    modalRef.componentInstance.proforma_selected = PROFORMA_SELECTED;

    modalRef.componentInstance.ProformasD.subscribe((client_s:any) => {
      let INDEX = this.PROFORMAS.findIndex((client_s:any) => client_s.id == PROFORMA_SELECTED.id);
      if(INDEX != -1){
        this.PROFORMAS.splice(INDEX,1);
      }
    })
  }

  openProforma(PROFORMA:any){
    const modalRef = this.modalService.open(OpenDetailProformaComponent,{centered:true,size: 'lg'});
    modalRef.componentInstance.PROFORMA = PROFORMA;
  }

  proformaPdf(PROFORMA: any) {
    this.proformasService.proformaPdf(PROFORMA.id).subscribe({
      next: (response: any) => {
        console.log('Respuesta del servidor:', response);
        if (response.success && response.url) {
          window.open(response.url, '_blank');
        } else {
          this.toast.error('No se pudo generar el PDF');
        }
      },
      error: (error) => {
        console.error('Error al generar el PDF:', error);
        this.toast.error('Error al generar el PDF: ' + (error.error?.message || 'Error desconocido'));
      }
    });
  }

  tomarInsumos(PROFORMA: any) {
    const modalRef = this.modalService.open(SelectInventoryItemsComponent, {centered: true, size: 'lg'});
    modalRef.componentInstance.PROFORMA = PROFORMA;

    modalRef.result.then((result) => {
      if (result) {
        this.listProformas(this.currentPage);
      }
    });
  }
  
  exportProformas(){
    let LINK="";
    if(this.search){
      LINK += "&search="+this.search;
    }
    if(this.client_segment_id){
      LINK += "&client_segment_id="+this.client_segment_id;
    }
    if(this.product_categorie_id){
      LINK += "&product_categorie_id="+this.product_categorie_id;
    }
    if(this.search_client){
      LINK += "&search_client="+this.search_client;
    }
    if(this.type){
      LINK += "&state_proforma="+this.type;
    }
    if(this.search_product){
      LINK += "&search_product="+this.search_product;
    }
    if(this.start_date && this.end_date){
      LINK += "&start_date="+this.start_date;
      LINK += "&end_date="+this.end_date;
    }
    if(this.asesor_id){
      LINK += "&asesor_id="+this.asesor_id;
    }
    window.open(URL_SERVICIOS+"/excel/export-proforma-generales?z=1"+LINK,"_blank");
  }

  exportProformasDetails(){
    let LINK="";
    if(this.search){
      LINK += "&search="+this.search;
    }
    if(this.client_segment_id){
      LINK += "&client_segment_id="+this.client_segment_id;
    }
    if(this.product_categorie_id){
      LINK += "&product_categorie_id="+this.product_categorie_id;
    }
    if(this.search_client){
      LINK += "&search_client="+this.search_client;
    }
    if(this.type){
      LINK += "&state_proforma="+this.type;
    }
    if(this.search_product){
      LINK += "&search_product="+this.search_product;
    }
    if(this.start_date && this.end_date){
      LINK += "&start_date="+this.start_date;
      LINK += "&end_date="+this.end_date;
    }
    if(this.asesor_id){
      LINK += "&asesor_id="+this.asesor_id;
    }
    window.open(URL_SERVICIOS+"/excel/export-proforma-details?z=1"+LINK,"_blank");
  }

  isPermission(permission:string){
    return isPermission(permission);
  }

  openWeeklyProgress(proforma: any) {
    const modalRef = this.modalService.open(WeeklyProgressComponent, { size: 'lg' });
    modalRef.componentInstance.proforma = proforma;
  }
}
