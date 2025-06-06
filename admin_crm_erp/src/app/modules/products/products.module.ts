import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProductsRoutingModule } from './products-routing.module';
import { ProductsComponent } from './products.component';
import { CreateProductComponent } from './create-product/create-product.component';
import { EditProductComponent } from './edit-product/edit-product.component';
import { DeleteProductComponent } from './delete-product/delete-product.component';
import { ListProductComponent } from './list-product/list-product.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule, NgbModalModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { EditWalletPriceProductComponent } from './wallet/edit-wallet-price-product/edit-wallet-price-product.component';
import { DeleteWalletPriceProductComponent } from './wallet/delete-wallet-price-product/delete-wallet-price-product.component';
import { EditWarehouseProductComponent } from './warehouse/edit-warehouse-product/edit-warehouse-product.component';
import { DeleteWarehouseProductComponent } from './warehouse/delete-warehouse-product/delete-warehouse-product.component';
import { ImportProductsComponent } from './import-products/import-products.component';
import { EntradasProductosComponent } from './entradas-productos/entradas-productos.component';
import { SalidasProductosComponent } from './salidas-productos/salidas-productos.component';
import { RegisterProductOutputComponent } from './warehouse/register-product-output/register-product-output.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    ProductsComponent,
    CreateProductComponent,
    EditProductComponent,
    DeleteProductComponent,
    ListProductComponent,
    EditWalletPriceProductComponent,
    DeleteWalletPriceProductComponent,
    EditWarehouseProductComponent,
    DeleteWarehouseProductComponent,
    ImportProductsComponent,
    EntradasProductosComponent,
    SalidasProductosComponent,
    RegisterProductOutputComponent
  ],
  imports: [
    CommonModule,
    ProductsRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    NgbModalModule,
    NgbPaginationModule,
    InlineSVGModule,
    SharedModule
  ]
})
export class ProductsModule { }
