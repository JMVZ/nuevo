import { ProformasService } from '../service/proformas.service';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-delete-proforma',
  templateUrl: './delete-proforma.component.html',
  styleUrls: ['./delete-proforma.component.scss']
})
export class DeleteProformaComponent {

  @Output() ProformasD: EventEmitter<any> = new EventEmitter();
  @Input()  proforma_selected:any;

  isLoading:any;
  constructor(
    public modal: NgbActiveModal,
    public proformaService: ProformasService,
    public toast: ToastrService,
  ) {
    
  }

  ngOnInit(): void {
  }

  delete(){
    this.proformaService.deleteProforma(this.proforma_selected.id).subscribe({
      next: (resp:any) => {
        this.toast.success("Exito","La proforma se eliminó correctamente");
        this.ProformasD.emit(resp.message);
        this.modal.close();
      },
      error: (err:any) => {
        if (err.status === 403 && err.error && err.error.message) {
          this.toast.error(err.error.message, 'Acción no permitida');
        } else {
          this.toast.error('Error al eliminar la proforma');
        }
      }
    });
  }

}
