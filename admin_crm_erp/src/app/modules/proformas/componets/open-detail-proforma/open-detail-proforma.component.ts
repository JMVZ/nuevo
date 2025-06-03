import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ProformasService } from '../../service/proformas.service';
import { ToastrService } from 'ngx-toastr';
import { SafeResourceUrl } from '@angular/platform-browser';
import { URL_SERVICIOS } from 'src/app/config/config';
import { DomSanitizer } from '@angular/platform-browser';
import { MatDialog } from '@angular/material/dialog';
import { PdfViewerModalComponent } from '../pdf-viewer-modal/pdf-viewer-modal.component';
import { HttpClient } from '@angular/common/http';

interface Subproyecto {
  id: number;
  name: string;
  productos: ProductoProforma[];
}

interface ProductoProforma {
  product: {
    id: number;
    title: string;
    description: string;
  };
  unit: {
    id: number;
    name: string;
  };
  cantidad: number;
}

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
    private sanitizer: DomSanitizer,
    private dialog: MatDialog,
    private http: HttpClient
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

    if (this.selectedFile.type !== 'application/pdf') {
      this.toast.error('Error', 'El archivo debe ser un PDF');
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
        console.error('Error al subir PDF:', error);
        this.toast.error('Error', error.error?.message || 'Error al subir el PDF');
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

  openPdf(pdf: any) {
    console.log('=== INICIO openPdf ===');
    console.log('PDF recibido:', {
      objeto_completo: pdf,
      nombre_archivo: pdf?.file_name,
      url: pdf?.url,
      path: pdf?.path
    });
    
    try {
      // Verificar que el objeto pdf y file_name existan
      if (!pdf || !pdf.file_name) {
        console.error('Datos del PDF inválidos:', pdf);
        throw new Error('Datos del PDF inválidos');
      }

      // Construir la URL directa al PDF usando la URL del API
      const url = `https://api-crm.mogancontrol.com/storage/proformas/${encodeURIComponent(pdf.file_name)}`;
      console.log('Información de la URL:', {
        url_completa: url,
        url_base: 'https://api-crm.mogancontrol.com',
        nombre_archivo_original: pdf.file_name,
        nombre_archivo_codificado: encodeURIComponent(pdf.file_name)
      });

      // Verificar si la URL es accesible
      fetch(url, { 
        method: 'HEAD',
        headers: {
          'Accept': 'application/pdf',
          'Cache-Control': 'no-cache'
        }
      })
        .then(response => {
          const headers: Record<string, string> = {};
          response.headers.forEach((value, key) => {
            headers[key] = value;
          });
          console.log('Respuesta del servidor:', {
            status: response.status,
            statusText: response.statusText,
            headers,
            url: response.url,
            redirected: response.redirected,
            type: response.type
          });

          if (response.ok) {
            // Si la respuesta es exitosa, abrir el PDF
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            
            console.log('Abriendo PDF con:', {
              href: link.href,
              target: link.target,
              rel: link.rel
            });
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } else {
            console.error('Error al acceder al PDF:', {
              status: response.status,
              statusText: response.statusText,
              url: response.url,
              redirected: response.redirected
            });
            this.toast.error('Error al abrir el PDF', 'El archivo no está disponible');
          }
        })
        .catch((error: Error) => {
          console.error('Error al verificar URL:', {
            error: error.message,
            url: url
          });
          this.toast.error('Error al abrir el PDF', 'No se pudo acceder al archivo');
        });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      const errorStack = error instanceof Error ? error.stack : 'No hay stack trace';
      console.error('Error detallado al abrir el PDF:', {
        mensaje: errorMessage,
        stack: errorStack,
        pdf_original: pdf
      });
      this.toast.error('Error al abrir el PDF', 'Por favor, intente nuevamente');
    }
    console.log('=== FIN openPdf ===');
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

  getInsumosGenerales() {
    const insumosMap = new Map();

    // Validar que PROFORMA y subproyectos existan
    if (!this.PROFORMA || !this.PROFORMA.subproyectos) {
      console.log('No hay subproyectos disponibles');
      return [];
    }

    // Recorrer todos los subproyectos
    this.PROFORMA.subproyectos.forEach((subproyecto: Subproyecto) => {
      // Validar que el subproyecto tenga productos
      if (!subproyecto.productos) {
        console.log(`Subproyecto ${subproyecto.id} no tiene productos`);
        return;
      }

      // Recorrer todos los productos del subproyecto
      subproyecto.productos.forEach((producto: ProductoProforma) => {
        // Validar que el producto y sus propiedades existan
        if (!producto || !producto.product || !producto.unit) {
          console.log('Producto inválido encontrado');
          return;
        }

        const key = `${producto.product.id}-${producto.unit.id}`;
        
        if (insumosMap.has(key)) {
          // Si ya existe, sumar la cantidad
          const insumo = insumosMap.get(key);
          insumo.cantidad_total += producto.cantidad;
        } else {
          // Si no existe, crear nuevo registro
          insumosMap.set(key, {
            product: producto.product,
            unit: producto.unit,
            cantidad_total: producto.cantidad
          });
        }
      });
    });

    // Convertir el Map a array
    return Array.from(insumosMap.values());
  }
}
