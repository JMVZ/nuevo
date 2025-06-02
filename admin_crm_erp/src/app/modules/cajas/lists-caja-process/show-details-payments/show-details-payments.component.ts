import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ProformasService } from '../../../proformas/service/proformas.service';
import { ToastrService } from 'ngx-toastr';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-show-details-payments',
  templateUrl: './show-details-payments.component.html',
  styleUrls: ['./show-details-payments.component.scss']
})
export class ShowDetailsPaymentsComponent {

  @Input() PROFORMA_SELECTED:any;
  PAGOS:any = [];

  constructor(
    public modal: NgbActiveModal,
    private proformasService: ProformasService,
    private toast: ToastrService,
    private http: HttpClient
  ) {
    
  }

  ngOnInit(): void {
    this.PAGOS = this.PROFORMA_SELECTED.pagos;
    console.log('Pagos cargados:', this.PAGOS);
  }

  openPdf(url: string) {
    if (!url) {
      this.toast.error('No hay PDF disponible');
      return;
    }

    try {
      console.log('URL original:', url);
      
      let pdfUrl: string;
      if (url.startsWith('http')) {
        pdfUrl = url;
      } else {
        const fileName = url.split('/').pop();
        if (!fileName) {
          this.toast.error('URL de PDF inválida');
          return;
        }
        pdfUrl = this.proformasService.getPdfUrl(fileName);
      }

      console.log('URL final del PDF:', pdfUrl);
      window.open(pdfUrl, '_blank');
    } catch (error) {
      console.error('Error al abrir el PDF:', error);
      this.toast.error('Error al abrir el PDF');
    }
  }
}
