import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { SettingsComponent } from './settings/settings.component';
import { RouterModule } from '@angular/router';
import { SettingsService } from './services/settings.service';
import { HttpClientModule } from '@angular/common/http';

import { ConfigurationRoutingModule } from './configuration-routing.module';
import { SucursalesModule } from './sucursales/sucursales.module';
import { WarehousesModule } from './warehouses/warehouses.module';
import { SucursalDeliveriesModule } from './sucursal-deliveries/sucursal-deliveries.module';
import { MethodPaymentModule } from './method-payment/method-payment.module';
import { ClientSegmentModule } from './client-segment/client-segment.module';
import { ProductCategoriesModule } from './product-categories/product-categories.module';
import { ProvidersModule } from './providers/providers.module';
import { GComissionsModule } from './g-comissions/g-comissions.module';

@NgModule({
  declarations: [
    SettingsComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule.forChild([
      {
        path: 'settings',
        component: SettingsComponent
      }
    ]),
    ConfigurationRoutingModule,
    SucursalesModule,
    WarehousesModule,
    SucursalDeliveriesModule,
    MethodPaymentModule,
    ClientSegmentModule,
    ProductCategoriesModule,
    ProvidersModule,
    GComissionsModule
  ],
  providers: [
    SettingsService
  ]
})
export class ConfigurationModule { }
