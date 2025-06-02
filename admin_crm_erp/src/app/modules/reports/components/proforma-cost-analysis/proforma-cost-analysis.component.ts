import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ProformasService } from '../../../proformas/service/proformas.service';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';
import Swal from 'sweetalert2';

interface Proforma {
  id: number;
  codigo: string;
  client?: {
    full_name: string;
  };
  product?: {
    title: string;
  };
  final_product_title?: string;
}

interface CostoDetalle {
  producto: string;
  cantidad: number;
  unidad: string;
  costo_unitario: number;
  costo_sin_iva: number;
  costo_con_iva: number;
  porcentaje_iva: number;
}

interface AnalisisCostos {
  proforma: {
    id: number;
    codigo: string;
    cliente: string;
    precio_final: number;
    fecha: string;
  };
  costos: {
    total_insumos_sin_iva: number;
    total_insumos_con_iva: number;
    detalles: CostoDetalle[];
  };
  analisis: {
    ganancia_sin_iva: number;
    ganancia_con_iva: number;
    porcentaje_ganancia_sin_iva: number;
    porcentaje_ganancia_con_iva: number;
    estado_sin_iva: string;
    estado_con_iva: string;
  };
}

@Component({
  selector: 'app-proforma-cost-analysis',
  templateUrl: './proforma-cost-analysis.component.html',
  styleUrls: ['./proforma-cost-analysis.component.scss']
})
export class ProformaCostAnalysisComponent implements OnInit {
  @ViewChild('proformasModal') proformasModal!: TemplateRef<any>;
  
  filterForm: FormGroup;
  proformas: Proforma[] = [];
  reportData: AnalisisCostos | null = null;
  loading = false;
  generatingReport = false;
  selectedProforma: Proforma | null = null;

  constructor(
    private fb: FormBuilder,
    private proformasService: ProformasService,
    private toast: ToastrService,
    public modalService: NgbModal,
    private cdr: ChangeDetectorRef
  ) {
    this.filterForm = this.fb.group({
      proformaId: ['']
    });
  }

  ngOnInit() {
    console.log('Iniciando componente...');
  }

  searchProformas() {
    const searchTerm = this.filterForm.get('proformaId')?.value?.trim();
    if (!searchTerm) {
      this.toast.warning('Por favor ingrese un término de búsqueda');
      return;
    }

    this.loading = true;
    console.log('Buscando proformas con término:', searchTerm);

    this.proformasService.listProformas(1, { 
      search: searchTerm
    }).pipe(
      finalize(() => {
        this.loading = false;
      })
    ).subscribe({
      next: (res) => {
        console.log('Respuesta de búsqueda:', res);
        if (res && res.proformas && Array.isArray(res.proformas.data)) {
          this.proformas = res.proformas.data;
          console.log('Proformas encontradas:', this.proformas.length);
          if (this.proformas.length === 0) {
            this.toast.info('No se encontraron proformas con ese término de búsqueda');
          } else {
            this.modalService.open(this.proformasModal, { size: 'lg', centered: true });
          }
        } else {
          this.proformas = [];
          console.warn('Formato de respuesta inesperado:', res);
          this.toast.error('Error en el formato de respuesta del servidor');
        }
      },
      error: (error) => {
        console.error('Error en la búsqueda:', error);
        this.toast.error('Error al buscar proformas: ' + (error.error?.message || 'Error desconocido'));
        this.proformas = [];
      }
    });
  }

  selectProforma(proforma: Proforma) {
    this.selectedProforma = proforma;
    this.modalService.dismissAll();
    this.toast.success('Proforma seleccionada correctamente');
  }

  generateReport() {
    if (!this.selectedProforma) {
        return;
    }

    this.generatingReport = true;
    this.proformasService.getProformaCostAnalysis(this.selectedProforma.id.toString())
        .subscribe({
            next: (response: AnalisisCostos) => {
                this.reportData = response;
                this.generatingReport = false;
                // Forzar la detección de cambios
                this.cdr.detectChanges();
                this.toast.success('Reporte generado correctamente');
            },
            error: (error: HttpErrorResponse) => {
                console.error('Error al generar el reporte:', error);
                this.generatingReport = false;
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo generar el reporte. Por favor, intente nuevamente.'
                });
            }
        });
  }

  exportToExcel() {
    if (!this.reportData) {
      this.toast.warning('No hay datos para exportar');
      return;
    }
    // Implementar la exportación a Excel
  }
} 