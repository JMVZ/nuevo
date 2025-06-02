import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ReportsService } from '../../services/reports.service';
import { ProductWarehousesService } from '../../../products/service/product-warehouses.service';
import { ProformasService } from '../../../proformas/service/proformas.service';

@Component({
  selector: 'app-proforma-outputs-report',
  templateUrl: './proforma-outputs-report.component.html',
  styleUrls: ['./proforma-outputs-report.component.scss']
})
export class ProformaOutputsReportComponent implements OnInit {
  filterForm: FormGroup;
  reportData: any[] = [];
  loading = false;
  warehouses: any[] = [];
  proformas: any[] = [];

  constructor(
    private fb: FormBuilder,
    private reportsService: ReportsService,
    private productWarehousesService: ProductWarehousesService,
    private proformasService: ProformasService
  ) {
    this.filterForm = this.fb.group({
      startDate: [''],
      endDate: [''],
      warehouseId: [''],
      proformaId: ['']
    });
  }

  ngOnInit(): void {
    this.loadWarehouses();
    this.loadProformas();
  }

  loadWarehouses(): void {
    this.productWarehousesService.getAllWarehouses().subscribe((res: any) => {
      this.warehouses = res.data || res;
    });
  }

  loadProformas(): void {
    this.proformasService.listProformas(1, {}).subscribe((res: any) => {
      this.proformas = res.data || res;
    });
  }

  generateReport(): void {
    if (!this.filterForm.get('startDate')?.value || !this.filterForm.get('endDate')?.value) {
      return;
    }

    this.loading = true;
    this.reportsService.getProformaOutputs(this.filterForm.value).subscribe({
      next: (data) => {
        this.reportData = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al generar el reporte:', error);
        this.loading = false;
      }
    });
  }

  exportToExcel(): void {
    // Implementar la exportación a Excel
  }
} 