import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ProformasService } from '../../service/proformas.service';
import { ToastrService } from 'ngx-toastr';
import { SafeResourceUrl } from '@angular/platform-browser';
import { URL_SERVICIOS } from 'src/app/config/config';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-open-detail-proforma',
  templateUrl: './open-detail-proforma.component.html',
  styleUrls: ['./open-detail-proforma.component.scss']
})
export class OpenDetailProformaComponent implements OnInit {

  @Input() PROFORMA: any;
  selectedFile: File | null = null;
  pdfs: any[] = [];
  pdfUrl: SafeResourceUrl;

  constructor(
    public modal: NgbActiveModal,
    public proformasService: ProformasService,
    public toast: ToastrService,
    private sanitizer: DomSanitizer
  ) {
    
  }

  ngOnInit(): void {
    console.log('PROFORMA recibida:', this.PROFORMA);
    console.log('Subproyectos:', this.PROFORMA?.subproyectos);
    this.loadPdfs();
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  uploadPdf() {
    if (!this.selectedFile) {
      this.toast.error('Error', 'Por favor seleccione un archivo PDF');
      return;
    }

    const formData = new FormData();
    formData.append('pdf', this.selectedFile);
    formData.append('proforma_id', this.PROFORMA.id);

    this.proformasService.uploadPdf(formData).subscribe({
      next: (resp: any) => {
        this.toast.success('Éxito', 'PDF subido correctamente');
        this.loadPdfs();
        this.selectedFile = null;
      },
      error: (error) => {
        this.toast.error('Error', 'Error al subir el PDF');
      }
    });
  }

  loadPdfs() {
    this.proformasService.getPdfs(this.PROFORMA.id).subscribe({
      next: (resp: any) => {
        this.pdfs = resp.pdfs;
      },
      error: (error) => {
        this.toast.error('Error', 'Error al cargar los PDFs');
      }
    });
  }

  openPdf(url: string) {
    if (!url) {
      this.toast.error('No hay PDF disponible');
      return;
    }

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

    window.open(pdfUrl, '_blank');
  }

  deletePdf(pdfId: number) {
    if (!confirm('¿Está seguro de eliminar este PDF?')) {
      return;
    }

    this.proformasService.deletePdf(pdfId).subscribe({
      next: (resp: any) => {
        this.toast.success('Éxito', 'PDF eliminado correctamente');
        this.loadPdfs();
      },
      error: (error) => {
        this.toast.error('Error', 'Error al eliminar el PDF');
      }
    });
  }

  close() {
    this.modal.dismiss();
  }
}
