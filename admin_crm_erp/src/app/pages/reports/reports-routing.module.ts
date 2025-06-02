import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReportsComponent } from './reports.component';
import { AuthGuard } from '../../modules/auth/services/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: ReportsComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: ['report_product_outputs', 'report_user_consumption', 'report_proforma_outputs']
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportsRoutingModule { } 