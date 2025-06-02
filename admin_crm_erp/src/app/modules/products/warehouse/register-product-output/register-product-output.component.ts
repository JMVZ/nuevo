import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { ProductWarehousesService } from '../../service/product-warehouses.service';
import { ProformasService } from '../../../proformas/service/proformas.service';
import { UsersService } from '../../../users/service/users.service';

@Component({
  selector: 'app-register-product-output',
  templateUrl: './register-product-output.component.html',
  styleUrls: ['./register-product-output.component.scss']
})
export class RegisterProductOutputComponent {
  @Input() WAREHOUSE_PRODUCT: any = {
    product: { name: '' },
    warehouse: { name: '' },
    unit: { name: '' },
    quantity: 0
  };
  @Output() OutputRegistered: EventEmitter<any> = new EventEmitter();

  formData: any = {
    quantity: null,
    reason: '',
    proforma_id: undefined,
    user_id: undefined
  };

  proformas: any[] = [];
  productionUsers: any[] = [];
  isLoading = false;

  constructor(
    public modal: NgbActiveModal,
    private productWarehouseService: ProductWarehousesService,
    private proformasService: ProformasService,
    private usersService: UsersService,
    private toast: ToastrService
  ) {
    this.cargarProformas();
    this.cargarUsuariosProduccion();
  }

  cargarProformas() {
    this.proformasService.listProformas(1).subscribe({
      next: (resp: any) => {
        this.proformas = resp.proformas?.data || [];
      },
      error: (error) => {
        console.error('Error al cargar proformas:', error);
        this.toast.error('Error', 'No se pudieron cargar las proformas');
      }
    });
  }

  cargarUsuariosProduccion() {
    console.log('Iniciando carga de usuarios de producción...');
    this.usersService.getProductionUsers().subscribe({
      next: (resp: any) => {
        console.log('Respuesta del servicio:', resp);
        if (resp?.users?.data) {
          this.productionUsers = resp.users.data;
        } else if (resp?.users) {
          this.productionUsers = resp.users;
        } else if (resp?.data) {
          this.productionUsers = resp.data;
        } else if (Array.isArray(resp)) {
          this.productionUsers = resp;
        } else {
          this.productionUsers = [];
          console.warn('Formato de respuesta inesperado:', resp);
        }
        console.log('Usuarios cargados:', this.productionUsers);
      },
      error: (error) => {
        console.error('Error al cargar usuarios de producción:', error);
        console.error('Detalles del error:', {
          status: error.status,
          statusText: error.statusText,
          error: error.error
        });
        this.toast.error('Error', 'No se pudieron cargar los usuarios de producción');
        this.productionUsers = [];
      }
    });
  }

  register() {
    if (!this.formData.quantity || this.formData.quantity <= 0) {
      this.toast.error('Error', 'La cantidad debe ser mayor a 0');
      return;
    }

    if (!this.formData.reason) {
      this.toast.error('Error', 'Debe especificar un motivo');
      return;
    }

    const data = {
      product_warehouse_id: this.WAREHOUSE_PRODUCT.id,
      quantity: this.formData.quantity,
      reason: this.formData.reason,
      proforma_id: this.formData.proforma_id,
      user_id: this.formData.user_id
    };

    this.isLoading = true;
    this.productWarehouseService.registrarSalida(data).subscribe({
      next: (res: any) => {
        this.toast.success('Éxito', 'Salida registrada correctamente');
        this.OutputRegistered.emit(res);
        this.modal.close();
      },
      error: (error) => {
        console.error('Error al registrar salida:', error);
        if (error.status === 422 && error.error && error.error.errors) {
          const mensajes = (Object.values(error.error.errors) as string[][]).reduce((acc: string[], val: string[]) => acc.concat(val), []).join(' ');
          this.toast.error('Error de validación', mensajes);
        } else if (error.error && error.error.message) {
          this.toast.error('Error', error.error.message);
        } else {
          this.toast.error('Error', 'No se pudo registrar la salida');
        }
        this.isLoading = false;
      }
    });
  }
}
 