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
import { environment } from 'src/environments/environment';

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
    formData.append('proforma_id', this.PROFORMA.id.toString());

    console.log('Enviando archivo:', {
      nombre: this.selectedFile.name,
      tipo: this.selectedFile.type,
      tamaño: this.selectedFile.size,
      proforma_id: this.PROFORMA.id
    });

    // Verificar el contenido del FormData
    formData.forEach((value, key) => {
      console.log(`${key}:`, value);
    });

    this.proformasService.uploadPdf(formData).subscribe({
      next: (resp: any) => {
        console.log('Respuesta del servidor:', resp);
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
        console.log('=== RESPUESTA DE PDFS ===');
        console.log('Respuesta completa:', resp);
        this.pdfs = resp.pdfs;
        console.log('PDFs cargados:', this.pdfs);
      },
      error: (error) => {
        this.toast.error('Error', 'Error al cargar los PDFs');
      }
    });
  }

  openPdf(pdf: any) {
    console.log('=== INICIO openPdf ===');
    console.log('PDF recibido completo:', JSON.stringify(pdf, null, 2));
    console.log('Environment URL_BACKEND:', environment.URL_BACKEND);
    
    try {
      let fileName = '';
      
      // Obtener el nombre del archivo
      if (pdf.name) {
        fileName = pdf.name;
      } else if (pdf.file_name) {
        fileName = pdf.file_name;
      } else if (pdf.path) {
        // Extraer el nombre del archivo de la ruta
        fileName = pdf.path.split('/').pop();
      } else {
        throw new Error('No se encontró el nombre del archivo PDF');
      }
      
      console.log('Nombre del archivo extraído:', fileName);
      
      // Usar la ruta de la API que maneja caracteres especiales correctamente
      console.log('Obteniendo PDF vía API con autenticación...');
      
      // Hacer petición directa con autenticación
      this.proformasService.viewPdf(fileName).subscribe({
        next: (response: Blob) => {
          // Si la respuesta es exitosa, crear un blob y abrirlo
          const blob = new Blob([response], { type: 'application/pdf' });
          const blobUrl = window.URL.createObjectURL(blob);
          window.open(blobUrl, '_blank');
        },
        error: (error: any) => {
          console.error('Error al abrir PDF:', error);
          this.toast.error('Error al abrir el PDF', 'Por favor, intente nuevamente');
        }
      });
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('Error al abrir el PDF:', errorMessage);
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
