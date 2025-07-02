import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { ProductWarehousesService } from '../../service/product-warehouses.service';
import { isSuperAdmin, isInventoryProtectionEnabled } from 'src/app/config/config';

@Component({
  selector: 'app-delete-warehouse-product',
  templateUrl: './delete-warehouse-product.component.html',
  styleUrls: ['./delete-warehouse-product.component.scss']
})
export class DeleteWarehouseProductComponent {

  @Output() WarehouseD: EventEmitter<any> = new EventEmitter();
  @Input()  WAREHOUSES_PROD:any;

  isLoading:any;
  isProtected: boolean = false;
  isSuperAdminUser: boolean = false;

  constructor(
    public modal: NgbActiveModal,
    public productWareHouseService: ProductWarehousesService,
    public toast: ToastrService,
  ) {
    
  }

  ngOnInit(): void {
    // Verificar modo de seguridad de inventario
    this.isSuperAdminUser = isSuperAdmin();
    this.isProtected = isInventoryProtectionEnabled();
  }

  delete(){
    // Verificar si está en modo seguro y el usuario no es Administrador
    if (this.isProtected && !this.isSuperAdminUser) {
      this.toast.error("ACCESO RESTRINGIDO", "🔒 Modo seguro activado. Solo el Administrador puede eliminar cantidades.");
      return;
    }
    
    this.productWareHouseService.deleteProductWarehouse(this.WAREHOUSES_PROD.id).subscribe((resp:any) => {
      console.log(resp);
      if(resp.message == 403){
        this.toast.error("Validación",resp.message_text);
      }else{
        this.toast.success("Exito","La existencia del producto se elimino correctamente");
        this.WarehouseD.emit(resp.message);
        this.modal.close();
      }
    })
  }

  // Método helper para usar en el template
  canDelete(): boolean {
    return !this.isProtected || this.isSuperAdminUser;
  }
}
