import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ReportsService } from '../../services/reports.service';
import { ProductWarehousesService } from 'src/app/modules/products/service/product-warehouses.service';
import { ProformasService } from 'src/app/modules/proformas/service/proformas.service';

@Component({
  selector: 'app-proforma-outputs-report',
  templateUrl: './proforma-outputs-report.component.html',
  styleUrls: ['./proforma-outputs-report.component.scss']
})
export class ProformaOutputsReportComponent implements OnInit {
  filterForm: FormGroup;
  proformas: any[] = [];
  warehouses: any[] = [];
  reportData: any[] = [];
  loading = false;

  constructor(
    private fb: FormBuilder,
    private datePipe: DatePipe,
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

  ngOnInit() {
    this.loadWarehouses();
    this.loadProformas();
  }

  loadWarehouses() {
    this.productWarehousesService.getAllWarehouses().subscribe((res: any) => {
      this.warehouses = res.data || res;
    });
  }

  loadProformas() {
    this.proformasService.listProformas(1, {}).subscribe((res: any) => {
      this.proformas = res.data || res;
    });
  }

  generateReport() {
    if (this.filterForm.valid) {
      this.loading = true;
      const filters = this.filterForm.value;
      this.reportsService.getProformaOutputs(filters).subscribe((res: any) => {
        this.reportData = res;
        this.loading = false;
      }, () => {
        this.loading = false;
      });
    }
  }
} 