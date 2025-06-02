import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AlertService } from '../../../../services/alert.service';

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
    private alertService: AlertService
  ) {
    
  }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    console.log(this.clients);
  }

  selectClient(client:any){
    if (!client.client_segment_id) {
      this.alertService.error("El cliente seleccionado no tiene un segmento asignado. Por favor, asigne un segmento al cliente antes de continuar.");
      return;
    }
    this.ClientSelected.emit(client);
    this.modal.dismiss();
  }
}
