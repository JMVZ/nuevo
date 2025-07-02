import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProformasService } from '../../service/proformas.service';
import { ToastrService } from 'ngx-toastr';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { AssignProductionUsersComponent } from '../assign-production-users/assign-production-users.component';

interface Producto {
  detalle_id: number;
  producto_id: number;
  producto_nombre: string;
  producto_descripcion: string;
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
    public toast: ToastrService,
    private modalService: NgbModal
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
      // Ya no cerramos automáticamente el modal para permitir generar PDF
    }
  }

  updateProformaStatus() {
    // Método mantenido para compatibilidad, pero ya no cierra automáticamente
    console.log('Estado de proforma actualizado');
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

    console.log('Items seleccionados para tomar:', itemsToTake);

    // Preparar los productos para la asignación
    const productosParaAsignar = itemsToTake.map(item => {
      return {
        detalle_id: item.detalle_id,
        producto_id: item.producto_id,
        producto_nombre: item.producto_nombre,
        producto_descripcion: item.producto_descripcion,
        cantidad: item.cantidad,
        unidad: item.unidad,
        subproyecto_id: item.subproyecto_id || null,
        subproyecto_nombre: 'Subproyecto' // Se asignará correctamente en el modal
      };
    });

    console.log('Productos preparados para asignación:', productosParaAsignar);
    console.log('Intentando abrir modal AssignProductionUsersComponent...');

    try {
      // Abrir el modal de asignación de usuarios
      const modalRef = this.modalService.open(AssignProductionUsersComponent, {
        centered: true,
        size: 'xl',
        backdrop: 'static'
      });
      
      console.log('Modal abierto exitosamente:', modalRef);
      
      modalRef.componentInstance.productos = productosParaAsignar;
      
      modalRef.result.then((productosConUsuarios) => {
        console.log('Modal cerrado con resultado:', productosConUsuarios);
        if (productosConUsuarios) {
          this.procesarSalidaConUsuarios(productosConUsuarios);
        }
      }).catch((error) => {
        console.log('Modal cancelado o error:', error);
      });
    } catch (error) {
      console.error('Error al abrir el modal:', error);
      this.toast.error('Error al abrir el modal de asignación de usuarios');
    }
  }

  procesarSalidaConUsuarios(productosConUsuarios: any[]) {
    const formattedItems = productosConUsuarios.map(item => ({
      detalle_id: item.detalle_id,
      producto_id: item.producto_id,
      subproyecto_id: item.subproyecto_id || null,
      selected: true,
      quantity_to_take: item.cantidad,
      user_id: item.user_id // Incluir el usuario asignado
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
            this.toast.success('Productos tomados correctamente y asignados a usuarios de producción');
            // Recargar los items para mostrar el estado actualizado
            this.loadInventoryItems();
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

  getTakenItems(): Producto[] {
    const taken: Producto[] = [];
    Object.values(this.inventoryItems).forEach((subproyecto: Subproyecto) => {
      if (subproyecto?.productos) {
        const productosTomados = subproyecto.productos
          .filter((item: Producto) => item.tomado)
          .map((item: Producto) => ({
            ...item,
            subproyecto_id: subproyecto.subproyecto_id || null,
            subproyecto_nombre: subproyecto.subproyecto_nombre
          }));
        taken.push(...productosTomados);
      }
    });
    return taken;
  }

  generateSalidaPDF() {
    const takenItems = this.getTakenItems();
    if (takenItems.length === 0) {
      this.toast.warning('No hay insumos tomados para generar el PDF');
      return;
    }

    this.loading = true;
    console.log('Generando PDF para proforma:', this.PROFORMA.id);
    
    this.proformasService.generateSalidaInsumosPDF(this.PROFORMA.id)
      .pipe(
        takeUntil(this.destroy$),
        catchError((error: any) => {
          console.error('Error completo al generar PDF:', {
            error: error,
            status: error?.status,
            statusText: error?.statusText,
            message: error?.message,
            errorBody: error?.error,
            url: error?.url
          });
          
          // Si el error contiene un Blob, intentar extraer su contenido
          if (error?.error instanceof Blob) {
            error.error.text().then((blobText: string) => {
              console.error('Contenido del Blob de error:', blobText);
              try {
                const errorJson = JSON.parse(blobText);
                console.error('Error JSON del servidor:', errorJson);
                this.toast.error('Error del servidor: ' + (errorJson.message || errorJson.error_details || 'Error desconocido'));
              } catch (parseError) {
                console.error('Error al parsear JSON del Blob:', parseError);
                this.toast.error('Error del servidor (texto): ' + blobText.substring(0, 200));
              }
            }).catch((blobError: any) => {
              console.error('Error al leer Blob:', blobError);
              this.toast.error('Error del servidor (no se pudo leer)');
            });
            return of(null);
          }
          
          let errorMessage = 'Error desconocido al generar PDF';
          if (error?.error?.error_details) {
            errorMessage = error.error.error_details;
          } else if (error?.error?.message) {
            errorMessage = error.error.message;
          } else if (error?.message) {
            errorMessage = error.message;
          } else if (error?.status === 500) {
            errorMessage = 'Error interno del servidor. Por favor contacte al administrador.';
          }
          
          this.toast.error('Error al generar PDF: ' + errorMessage);
          return of(null);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (resp: any) => {
          if (resp) {
            try {
              // Crear un blob con el PDF y descargarlo
              const blob = new Blob([resp], { type: 'application/pdf' });
              const url = window.URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `Orden_Salida_Insumos_Proforma_${this.PROFORMA.id}_${new Date().getTime()}.pdf`;
              link.click();
              window.URL.revokeObjectURL(url);
              this.toast.success('PDF generado y descargado correctamente');
            } catch (downloadError) {
              console.error('Error al descargar PDF:', downloadError);
              this.toast.error('Error al descargar el PDF');
            }
          }
        },
        error: (error: any) => {
          console.error('Error en la suscripción del PDF:', error);
          this.toast.error('Error al procesar la respuesta del PDF');
        }
      });
  }

  debugSalidaInsumos() {
    console.log('Ejecutando debug para proforma:', this.PROFORMA.id);
    this.loading = true;
    
    this.proformasService.debugSalidaInsumos(this.PROFORMA.id)
      .pipe(
        takeUntil(this.destroy$),
        catchError((error: any) => {
          console.error('Error en debug:', error);
          this.toast.error('Error en debug: ' + (error?.error?.message || error?.message || 'Error desconocido'));
          return of(null);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (resp: any) => {
          if (resp) {
            console.log('Datos de debug:', resp);
            this.toast.success('Debug completado. Revisa la consola para más detalles.');
            
            // Mostrar información útil en un alert
            const debugInfo = `
DEBUG INFORMACIÓN:
- Proforma ID: ${resp.proforma?.id}
- Código: ${resp.proforma?.codigo}
- Cliente: ${resp.proforma?.client_name || 'N/A'}
- Total grupos de insumos: ${resp.total_grupos}
- PHP Version: ${resp.system_info?.php_version}
- Memory Limit: ${resp.system_info?.memory_limit}
- Max Execution Time: ${resp.system_info?.max_execution_time}

Revisa la consola del navegador para más detalles.
            `;
            alert(debugInfo);
          }
        },
        error: (error: any) => {
          console.error('Error en la suscripción del debug:', error);
          this.toast.error('Error al procesar el debug');
        }
      });
  }

  debugSalidaInsumosHTML() {
    console.log('Ejecutando debug HTML para proforma:', this.PROFORMA.id);
    this.loading = true;
    
    this.proformasService.debugSalidaInsumosHTML(this.PROFORMA.id)
      .pipe(
        takeUntil(this.destroy$),
        catchError((error: any) => {
          console.error('Error en debug HTML:', error);
          this.toast.error('Error en debug HTML: ' + (error?.error?.message || error?.message || 'Error desconocido'));
          return of(null);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (html: string | null) => {
          if (html) {
            console.log('HTML generado exitosamente, tamaño:', html.length);
            console.log('Contenido HTML (primeros 500 caracteres):', html.substring(0, 500));
            
            // Abrir el HTML en una nueva ventana para visualizarlo
            const newWindow = window.open('', '_blank');
            if (newWindow) {
              newWindow.document.write(html);
              newWindow.document.close();
              this.toast.success('HTML generado correctamente. Se abrió en una nueva ventana.');
            } else {
              this.toast.warning('HTML generado pero no se pudo abrir ventana. Revisa la consola.');
            }
          }
        },
        error: (error: any) => {
          console.error('Error en la suscripción del debug HTML:', error);
          this.toast.error('Error al procesar el debug HTML');
        }
      });
  }

  close() {
    this.modal.dismiss(false);
  }
} 