import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ReportsService } from '../../services/reports.service';
import { ProductWarehousesService } from 'src/app/modules/products/service/product-warehouses.service';
import { UsersService } from 'src/app/modules/users/service/users.service';

@Component({
  selector: 'app-user-consumption-report',
  templateUrl: './user-consumption-report.component.html',
  styleUrls: ['./user-consumption-report.component.scss']
})
export class UserConsumptionReportComponent implements OnInit {
  filterForm: FormGroup;
  users: any[] = [];
  warehouses: any[] = [];
  reportData: any[] = [];
  loading = false;

  constructor(
    private fb: FormBuilder,
    private datePipe: DatePipe,
    private reportsService: ReportsService,
    private productWarehousesService: ProductWarehousesService,
    private userService: UsersService
  ) {
    this.filterForm = this.fb.group({
      startDate: [''],
      endDate: [''],
      warehouseId: [''],
      userId: ['']
    });
  }

  ngOnInit() {
    this.loadWarehouses();
    this.loadUsers();
  }

  loadWarehouses() {
    this.productWarehousesService.getAllWarehouses().subscribe((res: any) => {
      this.warehouses = res.data || res;
    });
  }

  loadUsers() {
    this.userService.listUsers(1, '').subscribe((res: any) => {
      this.users = res.data || res;
    });
  }

  generateReport() {
    if (this.filterForm.valid) {
      this.loading = true;
      const filters = this.filterForm.value;
      this.reportsService.getUserConsumption(filters).subscribe((res: any) => {
        this.reportData = res;
        this.loading = false;
      }, () => {
        this.loading = false;
      });
    }
  }
} 