import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductsComponent } from './products.component';
import { ListProductComponent } from './list-product/list-product.component';
import { CreateProductComponent } from './create-product/create-product.component';
import { EditProductComponent } from './edit-product/edit-product.component';
import { EntradasProductosComponent } from './entradas-productos/entradas-productos.component';
import { SalidasProductosComponent } from './salidas-productos/salidas-productos.component';

const routes: Routes = [
  {
    path: '',
    component: ProductsComponent,
    children: [
      {
        path: 'list',
        component: ListProductComponent
      },
      {
        path: 'registro',
        component: CreateProductComponent
      },
      {
        path: 'list/editar/:id',
        component: EditProductComponent
      },
      {
        path: 'entradas',
        component: EntradasProductosComponent
      },
      {
        path: 'salidas',
        component: SalidasProductosComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProductsRoutingModule { }
