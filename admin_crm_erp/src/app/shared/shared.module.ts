import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchProductsComponent } from '../modules/proformas/componets/search-products/search-products.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { DatePipe } from '@angular/common';

@NgModule({
  declarations: [
    SearchProductsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    NgbModule
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    NgbModule,
    SearchProductsComponent,
    DatePipe
  ],
  providers: [
    DatePipe
  ]
})
export class SharedModule { } 