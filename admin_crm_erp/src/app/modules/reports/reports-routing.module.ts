import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReportsComponent } from './reports/reports.component';
import { AuthGuard } from '../../modules/auth/services/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: ReportsComponent,
    canActivate: [AuthGuard],
    data: {
      permissions: ['reports.view']
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportsRoutingModule { }
