import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { UsersService } from '../../../users/service/users.service';

interface ProductoAsignacion {
  detalle_id: number;
  producto_id: number;
  producto_nombre: string;
  producto_descripcion: string;
  cantidad: number;
  unidad: string;
  subproyecto_nombre?: string;
  user_id?: number;
  user_name?: string;
}

@Component({
  selector: 'app-assign-production-users',
  templateUrl: './assign-production-users.component.html',
  styleUrls: ['./assign-production-users.component.scss']
})
export class AssignProductionUsersComponent implements OnInit {
  @Input() productos: ProductoAsignacion[] = [];
  @Output() asignacionCompletada: EventEmitter<ProductoAsignacion[]> = new EventEmitter();

  productionUsers: any[] = [];
  isLoading = false;
  productosAsignados: ProductoAsignacion[] = [];

  constructor(
    public modal: NgbActiveModal,
    private usersService: UsersService,
    private toast: ToastrService
  ) {
    console.log('AssignProductionUsersComponent constructor llamado');
  }

  ngOnInit() {
    console.log('ngOnInit - Productos recibidos:', this.productos);
    this.cargarUsuariosProduccion();
  }

  cargarUsuariosProduccion() {
    console.log('Iniciando carga de usuarios de producción...');
    this.isLoading = true;
    this.usersService.getProductionUsers().subscribe({
      next: (resp: any) => {
        console.log('Respuesta usuarios de producción:', resp);
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
        }
        console.log('Usuarios de producción cargados:', this.productionUsers);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar usuarios de producción:', error);
        this.toast.error('Error al cargar los usuarios de producción');
        this.isLoading = false;
      }
    });
  }

  onUsuarioChange(userId: number | undefined, producto: ProductoAsignacion) {
    this.asignarUsuario(producto, userId);
  }

  asignarUsuario(producto: ProductoAsignacion, userId?: number) {
    if (userId) {
      const user = this.productionUsers.find(u => u.id === userId);
      if (user) {
        producto.user_id = userId;
        producto.user_name = user.full_name || `${user.name} ${user.surname || ''}`;
      }
    } else {
      producto.user_id = undefined;
      producto.user_name = undefined;
    }
  }

  todosProductosAsignados(): boolean {
    return this.productos.length > 0 && this.productos.every(p => p.user_id);
  }

  confirmarAsignacion() {
    if (!this.todosProductosAsignados()) {
      this.toast.warning('Debe asignar un usuario de producción a todos los productos');
      return;
    }

    this.asignacionCompletada.emit(this.productos);
    this.modal.close(this.productos);
  }

  cancelar() {
    this.modal.dismiss();
  }

  getProductosPorSubproyecto() {
    const grupos: { [key: string]: ProductoAsignacion[] } = {};
    
    this.productos.forEach(producto => {
      const subproyectoId = (producto as any).subproyecto_id;
      const key = subproyectoId ? subproyectoId.toString() : 'sin_subproyecto';
      if (!grupos[key]) {
        grupos[key] = [];
      }
      grupos[key].push(producto);
    });
    
    return Object.entries(grupos).map(([key, productos]) => ({
      subproyecto_id: key === 'sin_subproyecto' ? null : parseInt(key),
      subproyecto_nombre: key === 'sin_subproyecto' ? 'Sin subproyecto' : `Subproyecto ${key}`,
      productos: productos
    }));
  }
} 