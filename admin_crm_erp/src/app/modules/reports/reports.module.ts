import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ReportsRoutingModule } from './reports-routing.module';
import { ReportsComponent } from './reports/reports.component';
import { ProductOutputsReportComponent } from './components/product-outputs-report/product-outputs-report.component';
import { ProformaOutputsReportComponent } from './components/proforma-outputs-report/proforma-outputs-report.component';
import { ProformaCostAnalysisComponent } from './components/proforma-cost-analysis/proforma-cost-analysis.component';
import { SharedModule } from '../../shared/shared.module';
import { LayoutModule } from '../../_metronic/layout/layout.module';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@NgModule({
  declarations: [
    ReportsComponent,
    ProductOutputsReportComponent,
    ProformaOutputsReportComponent,
    ProformaCostAnalysisComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    SharedModule,
    ReportsRoutingModule,
    LayoutModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule
  ]
})
export class ReportsModule { }
