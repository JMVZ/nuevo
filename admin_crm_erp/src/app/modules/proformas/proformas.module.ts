import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProformasRoutingModule } from './proformas-routing.module';
import { ProformasComponent } from './proformas.component';
import { CreateProformaComponent } from './create-proforma/create-proforma.component';
import { EditProformaComponent } from './edit-proforma/edit-proforma.component';
import { DeleteProformaComponent } from './delete-proforma/delete-proforma.component';
import { ListProformasComponent } from './list-proformas/list-proformas.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { SharedModule } from '../../shared/shared.module';
import { RouterModule } from '@angular/router';
import { EditProductDetailProformaComponent } from './componets/edit-product-detail-proforma/edit-product-detail-proforma.component';
import { OpenDetailProformaComponent } from './componets/open-detail-proforma/open-detail-proforma.component';
import { SelectInventoryItemsComponent } from './componets/select-inventory-items/select-inventory-items.component';
import { WeeklyProgressComponent } from './componets/weekly-progress/weekly-progress.component';
import { AlertService } from '../../services/alert.service';
import { SearchClientsComponent } from './componets/search-clients/search-clients.component';
import { SubproyectosProformaComponent } from './componets/subproyectos-proforma/subproyectos-proforma.component';

@NgModule({
  declarations: [
    ProformasComponent,
    CreateProformaComponent,
    EditProformaComponent,
    DeleteProformaComponent,
    ListProformasComponent,
    EditProductDetailProformaComponent,
    OpenDetailProformaComponent,
    SelectInventoryItemsComponent,
    WeeklyProgressComponent,
    SearchClientsComponent,
    SubproyectosProformaComponent
  ],
  imports: [
    CommonModule,
    ProformasRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    InlineSVGModule,
    SharedModule,
    RouterModule
  ],
  providers: [
    AlertService
  ]
})
export class ProformasModule { }
