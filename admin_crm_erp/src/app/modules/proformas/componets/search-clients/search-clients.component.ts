import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AlertService } from '../../../../services/alert.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-search-clients',
  templateUrl: './search-clients.component.html',
  styleUrls: ['./search-clients.component.scss']
})
export class SearchClientsComponent implements OnInit {

  @Input() clients:any = [];
  @Output() ClientSelected = new EventEmitter<any>();

  constructor(
    public modal: NgbActiveModal,
    private alertService: AlertService,
    private toast: ToastrService
  ) {
    
  }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    console.log(this.clients);
  }

  selectClient(client:any){
    // Validar que el cliente tenga un segmento asignado
    if (!client.client_segment_id) {
      this.toast.error("Error", "El cliente seleccionado no tiene un segmento asignado. Por favor, asigne un segmento al cliente antes de continuar.");
      return;
    }

    // Validar que el cliente tenga los datos básicos necesarios
    if (!client.id || !client.n_document || !client.full_name) {
      this.toast.error("Error", "El cliente seleccionado no tiene todos los datos necesarios. Por favor, complete la información del cliente antes de continuar.");
      return;
    }

    // Si todo está correcto, emitir el cliente seleccionado
    this.ClientSelected.emit(client);
    this.modal.dismiss();
  }
}
