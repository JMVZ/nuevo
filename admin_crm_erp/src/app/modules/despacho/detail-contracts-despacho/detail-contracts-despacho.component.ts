import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DespachoService } from '../service/despacho.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-detail-contracts-despacho',
  templateUrl: './detail-contracts-despacho.component.html',
  styleUrls: ['./detail-contracts-despacho.component.scss']
})
export class DetailContractsDespachoComponent {

  @Input() CONTRACT:any;
  @Input() warehouses:any = [];
  @Output() ProductProcess:EventEmitter<any> = new EventEmitter();

  detail_selected:any = [];
  warehouse_id:string = '';

  constructor(
    public modal: NgbActiveModal,
    public despachoService: DespachoService,
    public toast: ToastrService,
  ) {
    
  }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
  }

  isDetailSelected(detailId: number): boolean {
    return this.detail_selected.includes(detailId);
  }

  toggleDetailSelection(detail: any) {
    const idx = this.detail_selected.indexOf(detail.id);
    if (idx > -1) {
      this.detail_selected.splice(idx, 1);
    } else {
      this.detail_selected.push(detail.id);
    }
  }

  processEntrega() {
    if (this.detail_selected.length === 0) {
      this.toast.error("Validación", "Necesitas seleccionar al menos un producto");
      return;
    }
    if (!this.warehouse_id) {
      this.toast.error("Validación", "Es requerido seleccionar un almacen");
      return;
    }

    let data = {
      warehouse_id: this.warehouse_id,
      detail_selected: this.detail_selected,
      proforma_id: this.CONTRACT.id,
    }

    this.despachoService.processEntrega(data).subscribe({
      next: (resp: any) => {
        if (resp.message === 403) {
          resp.validations.forEach((validation: any) => {
            this.toast.error("Validación", validation);
          });
        } else {
          this.toast.success("Exitoso", "Los productos se han entregado correctamente");
          
          // Actualizar el estado de los detalles en el contrato
          this.CONTRACT.details.forEach((detail: any) => {
            if (this.detail_selected.includes(detail.id)) {
              detail.date_entrega = new Date();
              detail.warehouse_id = this.warehouse_id;
            }
          });
          
          this.ProductProcess.emit("");
          this.modal.close();
        }
      },
      error: (err: any) => {
        this.toast.error("Error", "Hubo un error al procesar la entrega");
        console.error(err);
      }
    });
  }
}
