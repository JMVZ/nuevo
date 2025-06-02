import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { ReportsComponent } from './reports.component';
import { ProductOutputsReportComponent } from './components/product-outputs-report/product-outputs-report.component';
import { UserConsumptionReportComponent } from './components/user-consumption-report/user-consumption-report.component';
import { ProformaOutputsReportComponent } from './components/proforma-outputs-report/proforma-outputs-report.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ReportsRoutingModule } from './reports-routing.module';

@NgModule({
  declarations: [
    ReportsComponent,
    ProductOutputsReportComponent,
    UserConsumptionReportComponent,
    ProformaOutputsReportComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    NgbModule,
    ReportsRoutingModule
  ]
})
export class ReportsModule { } 