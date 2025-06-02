import { Component, ChangeDetectorRef, NgZone } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CajaService } from '../service/caja.service';
import { CajaAperturaComponent } from '../caja-apertura/caja-apertura.component';
import { CajaClientsContractsComponent } from '../caja-clients-contracts/caja-clients-contracts.component';
import { CajaReportDayComponent } from '../caja-report-day/caja-report-day.component';
import { CajaHistoryComponent } from '../caja-history/caja-history.component';
import { CajaCierreComponent } from '../caja-cierre/caja-cierre.component';
import { ShowDetailsPaymentsComponent } from './show-details-payments/show-details-payments.component';
import { CajaIngresoCreateComponent } from '../caja-ingreso-create/caja-ingreso-create.component';
import { CajaIngresoService } from '../service/caja-ingreso.service';
import { CajaIngresoEditComponent } from '../caja-ingreso-create/caja-ingreso-edit/caja-ingreso-edit.component';
import { CajaIngresoDeleteComponent } from '../caja-ingreso-create/caja-ingreso-delete/caja-ingreso-delete.component';
import { CajaEgresoCreateComponent } from '../caja-egreso-create/caja-egreso-create.component';
import { CajaEgresoService } from '../service/caja-egreso.service';
import { CajaEgresoEditComponent } from '../caja-egreso-create/caja-egreso-edit/caja-egreso-edit.component';
import { CajaEgresoDeleteComponent } from '../caja-egreso-create/caja-egreso-delete/caja-egreso-delete.component';
import { isPermission } from 'src/app/config/config';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-lists-caja-process',
  templateUrl: './lists-caja-process.component.html',
  styleUrls: ['./lists-caja-process.component.scss']
})
export class ListsCajaProcessComponent {

  PROFORMAS:any = [];
  isLoading$:any;

  search:string = '';
  search_client:string = '';

  type_option_selected:number = 1;

  caja:any;
  caja_sucursale:any;
  created_at_apertura:string = '';
  method_payments:any = [];

  ingresos:any = [];
  egresos:any = [];

  constructor(
    public modalService: NgbModal,
    public cajaService: CajaService,
    public cajaIngreso: CajaIngresoService,
    public cajaEgreso: CajaEgresoService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private toast: ToastrService
  ) {
    
  }

  ngOnInit(): void {
    this.isLoading$ = this.cajaService.isLoading$;
    this.configCaja();
  }

  configCaja(){
    this.PROFORMAS = [];
    this.egresos = [];
    this.ingresos = [];
    
    this.cajaService.configCaja().subscribe({
      next: (resp:any) => {
        this.ngZone.run(() => {
          if (!resp || !resp.caja) {
            console.error('No se pudo obtener la configuración de la caja');
            this.toast.error("Error", "No se pudo obtener la configuración de la caja. Por favor, verifica que tengas una sucursal asignada.");
            return;
          }
          this.caja = resp.caja;
          this.caja_sucursale = resp.caja_sucursale;
          if(this.caja_sucursale){
            if(this.isPermission('record_contract_process')){
              this.listProformasProcess();
            }

            if(this.isPermission('ingreso')){
              this.listIngresos();
            }
            if(this.isPermission('egreso')){
              this.listEgresos();
            }
          }
          this.created_at_apertura = resp.created_at_apertura;
          this.method_payments = resp.method_payments;
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('Error al configurar caja:', error);
        this.ngZone.run(() => {
          this.toast.error("Error", "No se pudo obtener la configuración de la caja. Por favor, verifica tu conexión y permisos.");
          this.cdr.detectChanges();
        });
      }
    });
  }

  openCaja(){
    if (!this.caja) {
      console.error('No hay caja disponible');
      return;
    }

    const modalRef = this.modalService.open(CajaAperturaComponent,{centered:true,size: 'md'});
    modalRef.componentInstance.caja = this.caja;

    modalRef.componentInstance.caja_apertura.subscribe((resp:any) => {
      this.ngZone.run(() => {
        this.configCaja();
        this.cdr.detectChanges();
      });
    });
  }

  validationPay(){
    const modalRef = this.modalService.open(CajaClientsContractsComponent,{centered:true,size: 'xl'});
    modalRef.componentInstance.method_payments = this.method_payments;
    modalRef.componentInstance.caja_sucursale = this.caja_sucursale;

    modalRef.componentInstance.CajaSucursale.subscribe((caja_sucursale:any) => {
      this.caja_sucursale = caja_sucursale;
      this.listProformasProcess();
    })
  }

  openReport(){
    const modalRef = this.modalService.open(CajaReportDayComponent,{centered:true,size: 'lg'});
    modalRef.componentInstance.caja = this.caja;
    modalRef.componentInstance.caja_sucursale = this.caja_sucursale;
    modalRef.componentInstance.created_at_apertura = this.created_at_apertura;
  }

  openHistory(){
    const modalRef = this.modalService.open(CajaHistoryComponent,{centered:true,size: 'xl'});
  }

  closeCaja(){
    const modalRef = this.modalService.open(CajaCierreComponent,{centered:true,size: 'md'});
    modalRef.componentInstance.caja_sucursale = this.caja_sucursale;

    modalRef.componentInstance.CierreCaja.subscribe((resp:any) => {
      console.log(resp);
      this.configCaja();
      this.PROFORMAS = [];
      this.ingresos = [];
      this.egresos = [];
    })
  }

  listProformasProcess(){
    let data = {
      caja_sucursale_id: this.caja_sucursale.id,
      n_proforma: this.search,
      search_client: this.search_client,
    }
    this.cajaService.listContractProcess(data).subscribe({
      next: (resp:any) => {
        this.ngZone.run(() => {
          this.PROFORMAS = resp.contract_process.data;
          this.cdr.detectChanges();
        });
      }
    });
  }
  resetlistProformasProcess(){
    this.search = '';
    this.search_client = '';
    this.listProformasProcess();
  }

  openPayments(PROFORMA:any){
    const modalRef = this.modalService.open(ShowDetailsPaymentsComponent,{centered:true,size: 'lg'});
    modalRef.componentInstance.PROFORMA_SELECTED = PROFORMA;
  }

  listIngresos(){
    this.cajaIngreso.listIngresos(1,this.caja_sucursale.id).subscribe({
      next: (resp:any) => {
        this.ngZone.run(() => {
          this.ingresos = resp.ingresos;
          this.cdr.detectChanges();
        });
      }
    });
  }

  addIngreso(){
    const modalRef = this.modalService.open(CajaIngresoCreateComponent,{centered:true,size:'md'});
    modalRef.componentInstance.caja_sucursale = this.caja_sucursale;
    modalRef.componentInstance.CajaIngreso.subscribe((resp:any) => {
      this.ingresos.push(resp.ingreso);
      this.caja_sucursale = resp.caja_sucursale;
      this.isLoadingProcess();
    })
  }

  editIngreso(ingreso:any){
    const modalRef = this.modalService.open(CajaIngresoEditComponent,{centered:true,size:'md'});
    modalRef.componentInstance.caja_sucursale = this.caja_sucursale;
    modalRef.componentInstance.ingreso = ingreso;

    modalRef.componentInstance.CajaIngreso.subscribe((resp:any) => {;
      let INDEX = this.ingresos.findIndex((item:any) => item.id == ingreso.id);
      if(INDEX != -1){
        this.ingresos[INDEX] = resp.ingreso;
      }
      this.caja_sucursale = resp.caja_sucursale;
      this.isLoadingProcess();
    })
  }

  deleteIngreso(ingreso:any){
    const modalRef = this.modalService.open(CajaIngresoDeleteComponent,{centered:true,size:'md'});
    modalRef.componentInstance.ingreso = ingreso;

    modalRef.componentInstance.CajaIngreso.subscribe((resp:any) => {;
      let INDEX = this.ingresos.findIndex((item:any) => item.id == ingreso.id);
      if(INDEX != -1){
        this.ingresos.splice(INDEX,1);
      }
      this.caja_sucursale = resp.caja_sucursale;
      this.isLoadingProcess();
    })
  }


  listEgresos(){
    this.cajaEgreso.listEgresos(1,this.caja_sucursale.id).subscribe({
      next: (resp:any) => {
        this.ngZone.run(() => {
          this.egresos = resp.egresos;
          this.cdr.detectChanges();
        });
      }
    });
  }

  addEgreso(){
    const modalRef = this.modalService.open(CajaEgresoCreateComponent,{centered:true,size:'md'});
    modalRef.componentInstance.caja_sucursale = this.caja_sucursale;
    modalRef.componentInstance.CajaEgreso.subscribe((resp:any) => {
      this.egresos.push(resp.egreso);
      this.caja_sucursale = resp.caja_sucursale;
      this.isLoadingProcess();
    })
  }

  editEgreso(egreso:any){
    const modalRef = this.modalService.open(CajaEgresoEditComponent,{centered:true,size:'md'});
    modalRef.componentInstance.caja_sucursale = this.caja_sucursale;
    modalRef.componentInstance.egreso = egreso;

    modalRef.componentInstance.CajaEgreso.subscribe((resp:any) => {;
      let INDEX = this.egresos.findIndex((item:any) => item.id == egreso.id);
      if(INDEX != -1){
        this.egresos[INDEX] = resp.egreso;
      }
      this.caja_sucursale = resp.caja_sucursale;
      this.isLoadingProcess();
    })
  }

  deleteEgreso(egreso:any){

    const modalRef = this.modalService.open(CajaEgresoDeleteComponent,{centered:true,size:'md'});
    modalRef.componentInstance.egreso = egreso;

    modalRef.componentInstance.CajaEgreso.subscribe((resp:any) => {;
      let INDEX = this.egresos.findIndex((item:any) => item.id == egreso.id);
      if(INDEX != -1){
        this.egresos.splice(INDEX,1);
      }
      this.caja_sucursale = resp.caja_sucursale;
      this.isLoadingProcess();
    })

  }

  isLoadingProcess(){
    this.cajaService.isLoadingSubject.next(true);
    setTimeout(() => {
      this.cajaService.isLoadingSubject.next(false);
    }, 50);
  }

  isPermission(permission:string){
    return isPermission(permission);
  }

  changeTypeOption() {
    switch(this.type_option_selected) {
      case 1:
        this.listProformasProcess();
        break;
      case 2:
        this.listIngresos();
        break;
      case 3:
        this.listEgresos();
        break;
    }
  }
}
