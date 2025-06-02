import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ReportsService } from '../../services/reports.service';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-product-outputs-report',
  templateUrl: './product-outputs-report.component.html',
  styleUrls: ['./product-outputs-report.component.scss']
})
export class ProductOutputsReportComponent implements OnInit {
  filterForm: FormGroup;
  reportData: any[] = [];
  loading = false;
  warehouses: any[] = [];
  products: any[] = [];
  users: any[] = [];

  constructor(
    private fb: FormBuilder,
    private reportsService: ReportsService,
    private toast: ToastrService,
    private cdr: ChangeDetectorRef
  ) {
    this.filterForm = this.fb.group({
      startDate: [''],
      endDate: [''],
      warehouseId: [''],
      productId: [''],
      userId: ['']
    });
  }

  ngOnInit(): void {
    this.loadWarehouses();
    this.loadProducts();
    this.loadUsers();
  }

  loadWarehouses(): void {
    this.reportsService.getWarehouses().subscribe({
      next: (data) => {
        this.warehouses = Array.isArray(data) ? data : [];
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar almacenes:', error);
        this.toast.error('Error al cargar los almacenes');
        this.warehouses = [];
        this.cdr.detectChanges();
      }
    });
  }

  loadProducts(): void {
    this.reportsService.getProducts().subscribe({
      next: (data) => {
        this.products = Array.isArray(data) ? data : [];
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
        this.toast.error('Error al cargar los productos');
        this.products = [];
        this.cdr.detectChanges();
      }
    });
  }

  loadUsers(): void {
    this.reportsService.getUsers().subscribe({
      next: (response) => {
        this.users = response.users;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
        this.toast.error('Error al cargar los usuarios');
        this.users = [];
        this.cdr.detectChanges();
      }
    });
  }

  generateReport(): void {
    if (!this.filterForm.get('startDate')?.value || !this.filterForm.get('endDate')?.value) {
      this.toast.warning('Por favor seleccione un rango de fechas');
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    this.reportsService.getProductOutputs(this.filterForm.value)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (data) => {
          this.reportData = Array.isArray(data) ? data : [];
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error al generar el reporte:', error);
          this.toast.error(error.error?.message || 'Error al generar el reporte');
          this.reportData = [];
          this.cdr.detectChanges();
        }
      });
  }

  exportToExcel(): void {
    if (!this.reportData.length) {
      this.toast.warning('No hay datos para exportar');
      return;
    }
    // Implementar la exportación a Excel
  }
} 