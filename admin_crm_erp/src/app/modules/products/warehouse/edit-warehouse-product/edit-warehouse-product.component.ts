import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { ProductWarehousesService } from '../../service/product-warehouses.service';
import { isSuperAdmin, isInventoryProtectionEnabled } from 'src/app/config/config';

@Component({
  selector: 'app-edit-warehouse-product',
  templateUrl: './edit-warehouse-product.component.html',
  styleUrls: ['./edit-warehouse-product.component.scss']
})
export class EditWarehouseProductComponent {

  @Output() WarehouseE: EventEmitter<any> = new EventEmitter();
  @Input() WAREHOUSES_PROD:any;
  
  @Input() UNITS:any = [];
  @Input() WAREHOUSES:any = [];

  isLoading:any;
  isProtected: boolean = false;
  isSuperAdminUser: boolean = false;

  unit_warehouse:string = '';
  almacen_warehouse:string = '';
  quantity_warehouse:number = 0;

  constructor(
    public modal: NgbActiveModal,
    public productWarehouseService: ProductWarehousesService,
    public toast: ToastrService,
  ) {
    
  }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.unit_warehouse = this.WAREHOUSES_PROD.unit.id;
    this.almacen_warehouse = this.WAREHOUSES_PROD.warehouse.id;
    this.quantity_warehouse = this.WAREHOUSES_PROD.quantity;
    
    // Verificar modo de seguridad de inventario
    this.isSuperAdminUser = isSuperAdmin();
    this.isProtected = isInventoryProtectionEnabled();
  }

  store(){
    // Verificar si está en modo seguro y el usuario no es Administrador
    if (this.isProtected && !this.isSuperAdminUser) {
      this.toast.error("ACCESO RESTRINGIDO", "🔒 Modo seguro activado. Solo el Administrador puede modificar cantidades.");
      return;
    }

    let data = {
      unit_id: this.unit_warehouse,
      warehouse_id: this.almacen_warehouse,
      quantity: this.quantity_warehouse
    }

    this.productWarehouseService.updateProductWarehouse(this.WAREHOUSES_PROD.id,data).subscribe((resp:any) => {
      console.log(resp);
      if(resp.message == 403){
        this.toast.error("Validación",resp.message_text);
      }else{
        this.toast.success("Exito","La existencia del producto ha sido editada correctamente");
        this.WarehouseE.emit(resp.product_warehouse);
        this.modal.close();
      }
    })
  }

  // Método helper para usar en el template
  canEdit(): boolean {
    return !this.isProtected || this.isSuperAdminUser;
  }


}
