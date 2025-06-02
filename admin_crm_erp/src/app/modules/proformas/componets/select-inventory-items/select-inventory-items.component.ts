import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ProformasService } from '../../service/proformas.service';
import { ToastrService } from 'ngx-toastr';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';

interface Producto {
  detalle_id: number;
  producto_id: number;
  producto_nombre: string;
  cantidad: number;
  unidad: string;
  precio_unitario: number;
  descuento: number;
  subtotal: number;
  impuesto: number;
  total: number;
  tomado: boolean;
  fecha_tomado: string | null;
  selected?: boolean;
  subproyecto_id?: number | null;
  warehouse_id?: number;
  stock_disponible?: number;
  stock_info?: {
    stock: number;
    warehouse_id: number;
    stocks_por_almacen: Array<{
      warehouse_id: number;
      warehouse_name: string;
      stock: number;
    }>;
    total_stock: number;
  };
}

interface Subproyecto {
  subproyecto_id: number | null;
  subproyecto_nombre: string;
  subproyecto_descripcion: string;
  productos: Producto[];
}

interface SubproyectoMap {
  [key: string]: Subproyecto;
}

interface ApiResponse {
  success: boolean;
  items: SubproyectoMap;
  message?: string;
}

@Component({
  selector: 'app-select-inventory-items',
  templateUrl: './select-inventory-items.component.html',
  styleUrls: ['./select-inventory-items.component.scss']
})
export class SelectInventoryItemsComponent implements OnInit, OnDestroy {
  @Input() PROFORMA: any;
  inventoryItems: SubproyectoMap = {};
  loading: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    public modal: NgbActiveModal,
    public proformasService: ProformasService,
    public toast: ToastrService
  ) {}

  ngOnInit(): void {
    if (!this.PROFORMA?.id) {
      this.toast.error('No se ha proporcionado una proforma válida');
      this.close();
      return;
    }
    
    this.checkProformaStatus();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadInventoryItems() {
    this.loading = true;
    console.log('Iniciando carga de items del inventario para proforma:', this.PROFORMA.id);
    
    this.proformasService.getProformaInventoryItems(this.PROFORMA.id)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error al cargar los productos - detalles completos:', {
            error: error,
            message: error?.message,
            status: error?.status,
            errorBody: error?.error,
            url: error?.url
          });
          this.toast.error('Error al cargar los productos: ' + (error?.error?.message || error?.message || 'Error desconocido'));
          return of({ success: false, items: {}, message: 'Error al cargar los productos' });
        }),
        finalize(() => {
          console.log('Finalizando carga de items del inventario');
          this.loading = false;
        })
      )
      .subscribe({
        next: (resp: ApiResponse) => {
          console.log('Respuesta recibida del servicio:', resp);
          
          if (!resp) {
            console.error('Respuesta es null o undefined');
            this.toast.error('No se recibió respuesta del servidor');
            return;
          }
          
          if (resp.success) {
            console.log('Respuesta exitosa, items:', resp.items);
            this.inventoryItems = resp.items || {};
            console.log('Items asignados al componente:', this.inventoryItems);
            
            if (!this.inventoryItems || Object.keys(this.inventoryItems).length === 0) {
              console.log('No hay productos disponibles para esta proforma');
            }
            
            this.checkIfAllItemsTaken();
          } else {
            console.error('Respuesta con error:', resp);
            this.toast.error(resp?.message || 'Error al cargar los productos');
          }
        },
        error: (error) => {
          console.error('Error en la suscripción:', error);
          this.toast.error('Error al cargar los productos');
        }
      });
  }

  checkProformaStatus() {
    this.proformasService.showProforma(this.PROFORMA.id)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error al verificar el estado de la proforma:', error);
          return of(null);
        })
      )
      .subscribe({
        next: (resp: any) => {
          if (resp && resp.proforma) {
            console.log('Estado actual de la proforma:', resp.proforma.state_proforma);
            
            if (resp.proforma.state_proforma === 2 || resp.proforma.state_proforma === '2') {
              this.toast.info('Todos los insumos de esta proforma ya han sido tomados');
              this.modal.close(false);
              return;
            }
            
            this.loadInventoryItems();
          } else {
            this.toast.error('No se pudo verificar el estado de la proforma');
            this.close();
          }
        },
        error: (error) => {
          console.error('Error al verificar estado:', error);
          this.toast.error('Error al verificar el estado de la proforma');
          this.close();
        }
      });
  }

  checkIfAllItemsTaken() {
    let allItemsTaken = true;
    let hasItems = false;
    
    Object.values(this.inventoryItems).forEach((subproyecto: Subproyecto) => {
      if (subproyecto?.productos && subproyecto.productos.length > 0) {
        hasItems = true;
        subproyecto.productos.forEach((producto: Producto) => {
          if (!producto.tomado) {
            allItemsTaken = false;
          }
        });
      }
    });
    
    if (hasItems && allItemsTaken) {
      console.log('Todos los productos ya han sido tomados');
      this.toast.info('Todos los productos de esta proforma ya han sido tomados');
      this.updateProformaStatus();
    }
  }

  updateProformaStatus() {
    setTimeout(() => {
        this.modal.close(true);
    }, 2000);
  }

  areAllItemsSelectedInSubproyecto(productos: Producto[]): boolean {
    return productos?.length > 0 && 
           productos.every(item => item.selected || item.tomado);
  }

  toggleAllItemsInSubproyecto(productos: Producto[]) {
    if (!productos?.length) return;
    
    const allSelected = this.areAllItemsSelectedInSubproyecto(productos);
    productos.forEach(item => {
      if (!item.tomado) {
        item.selected = !allSelected;
      }
    });
  }

  toggleItem(item: Producto) {
    if (!item.tomado) {
      if (item.stock_disponible !== undefined && item.stock_disponible < item.cantidad) {
        this.toast.warning(`No hay stock suficiente para ${item.producto_nombre}. Stock disponible: ${item.stock_disponible}, Cantidad solicitada: ${item.cantidad}`);
        return;
      }
      item.selected = !item.selected;
    }
  }

  getSelectedItems(): Producto[] {
    const selected: Producto[] = [];
    Object.values(this.inventoryItems).forEach((subproyecto: Subproyecto) => {
      if (subproyecto?.productos) {
        const productosSeleccionados = subproyecto.productos
          .filter((item: Producto) => item.selected && !item.tomado)
          .map((item: Producto) => ({
            ...item,
            subproyecto_id: subproyecto.subproyecto_id || null
          }));
        selected.push(...productosSeleccionados);
      }
    });
    return selected;
  }

  takeSelectedItems() {
    const itemsToTake = this.getSelectedItems();
    if (itemsToTake.length === 0) {
      this.toast.warning('Debe seleccionar al menos un producto');
      return;
    }

    const formattedItems = itemsToTake.map(item => ({
      detalle_id: item.detalle_id,
      producto_id: item.producto_id,
      subproyecto_id: item.subproyecto_id || null,
      selected: true,
      quantity_to_take: item.cantidad
    }));

    this.loading = true;
    this.proformasService.takeSelectedInventoryItems(this.PROFORMA.id, formattedItems)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error al tomar los productos:', error);
          this.toast.error('Error al tomar los productos: ' + (error.error?.message || error.message || 'Error desconocido'));
          return of(null);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (resp: any) => {
          if (resp?.success) {
            this.toast.success('Productos tomados correctamente');
            this.modal.close(true);
          } else if (resp) {
            this.toast.error(resp?.message || 'Error al tomar los productos');
          }
        },
        error: (error) => {
          console.error('Error en la suscripción:', error);
          this.toast.error('Error al tomar los productos');
        }
      });
  }

  close() {
    this.modal.dismiss(false);
  }
} 