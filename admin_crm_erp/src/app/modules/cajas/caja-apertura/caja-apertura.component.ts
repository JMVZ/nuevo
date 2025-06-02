import { Component, EventEmitter, Input, Output, ChangeDetectorRef } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CajaService } from '../service/caja.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-caja-apertura',
  templateUrl: './caja-apertura.component.html',
  styleUrls: ['./caja-apertura.component.scss']
})
export class CajaAperturaComponent {

  @Input() caja:any;
  amount_initial:number = 0;
  isLoading:boolean = false;

  @Output() caja_apertura: EventEmitter<any> = new EventEmitter();

  constructor(
    public modal: NgbActiveModal,
    public cajaService: CajaService,
    public toast: ToastrService,
    private cdr: ChangeDetectorRef
  ) {
    
  }

  ngOnInit(): void {
    this.amount_initial = this.caja?.amount || 0;
  }

  apertura(){
    if(this.isLoading) return;
    
    this.isLoading = true;
    this.cdr.detectChanges();
    
    let data = {
      caja_id: this.caja.id,
      amount_initial: this.amount_initial
    }
    
    this.cajaService.aperturaCaja(data).subscribe({
      next: (resp:any) => {
        this.toast.success("Exito","La caja se aperturo correctamente");
        this.modal.close();
        this.caja_apertura.emit(resp);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.toast.error("Error","No se pudo abrir la caja");
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      complete: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
