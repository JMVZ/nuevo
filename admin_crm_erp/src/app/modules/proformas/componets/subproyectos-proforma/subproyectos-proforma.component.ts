import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ViewChild, TemplateRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { SubproyectosService, Subproyecto, SubproyectoProducto } from '../../service/subproyectos.service';
import { ProformasService } from '../../service/proformas.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-subproyectos-proforma',
  templateUrl: './subproyectos-proforma.component.html',
  styleUrls: ['./subproyectos-proforma.component.scss']
})
export class SubproyectosProformaComponent implements OnInit, OnChanges {

  @ViewChild('productSelectionModal') productSelectionModal!: TemplateRef<any>;

  @Input() proforma_id: number = 0;
  @Input() CLIENT_SELECTED: any;
  @Input() sucursale_asesor: string = '';
  @Input() user: any;
  @Output() subproyectosChanged = new EventEmitter<any>();

  subproyectos: Subproyecto[] = [];
  
  // Nuevo subproyecto
  nuevoSubproyecto: Subproyecto = {
    proforma_id: 0,
    nombre: '',
    descripcion: '',
    estado: 'pendiente',
    productos: []
  };

  // Producto para agregar
  search_product: string = '';
  PRODUCT_SELECTED: any;
  price: number = 0;
  quantity_product: number = 1;
  unidad_product: string = '';
  amount_discount: number = 0;
  is_gift: number = 1;
  description_product: string = '';
  warehouses_product: any = [];
  exits_warehouse: any = [];
  selectedSubproyectoIndex: number = -1;
  selected_warehouse: any = null;

  // Productos encontrados para el modal de selección
  PRODUCTS_FOUND: any[] = [];

  isLoading$: any;

  constructor(
    public modalService: NgbModal,
    private toast: ToastrService,
    private subproyectosService: SubproyectosService,
    private proformasService: ProformasService
  ) {
    this.isLoading$ = this.subproyectosService.isLoading$;
  }

  ngOnInit(): void {
    // Solo cargar subproyectos del backend si la proforma ya existe
    if (this.proforma_id > 0) {
      this.loadSubproyectos();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['proforma_id'] && changes['proforma_id'].currentValue !== changes['proforma_id'].previousValue) {
      console.log('proforma_id cambió:', changes['proforma_id'].currentValue);
      if (changes['proforma_id'].currentValue > 0) {
        this.loadSubproyectos();
      }
    }
  }

  loadSubproyectos() {
    console.log('Cargando subproyectos para proforma_id:', this.proforma_id);
    if (this.proforma_id > 0) {
      this.subproyectosService.index(this.proforma_id).subscribe({
        next: (resp: any) => {
          console.log('Respuesta de subproyectos:', resp);
          if (resp.success) {
            // Mapear los productos para usar cantidad en lugar de quantity
            this.subproyectos = (resp.subproyectos || []).map((sub: any) => ({
              ...sub,
              productos: (sub.productos || []).map((prod: any) => {
                const productoMapeado = {
                  ...prod,
                  cantidad: prod.quantity || prod.cantidad || 0, // Mapear quantity a cantidad
                  precio_unitario: prod.price_unit || prod.precio_unitario || 0
                };
                console.log('Producto mapeado:', productoMapeado.product?.title, 'cantidad:', productoMapeado.cantidad);
                return productoMapeado;
              })
            }));
            console.log('Subproyectos cargados:', this.subproyectos);
            this.emitChanges();
          } else {
            console.error('Error en respuesta:', resp);
            this.toast.error("Error", resp.message || "Error al cargar subproyectos");
          }
        },
        error: (error) => {
          console.error('Error al cargar subproyectos:', error);
          let mensaje = "Error al cargar subproyectos";
          if (error.error && error.error.message) {
            mensaje = error.error.message;
          }
          this.toast.error("Error", mensaje);
        }
      });
    }
  }

  agregarSubproyecto() {
    if (!this.nuevoSubproyecto.nombre.trim()) {
      this.toast.error("Validación", "El nombre del subproyecto es obligatorio");
      return;
    }

    // Si la proforma no existe aún (proforma_id = 0), manejar localmente
    if (this.proforma_id === 0) {
      // Crear un ID temporal para el subproyecto
      const tempId = Date.now();
      const nuevoSubproyectoLocal = {
        ...this.nuevoSubproyecto,
        id: tempId,
        proforma_id: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      this.subproyectos.push(nuevoSubproyectoLocal);
      this.resetNuevoSubproyecto();
      this.toast.success("Éxito", "Subproyecto agregado (se guardará al crear la proforma)");
      this.emitChanges();
      return;
    }

    // Si la proforma ya existe, enviar al backend
    this.nuevoSubproyecto.proforma_id = this.proforma_id;
    
    this.subproyectosService.store(this.nuevoSubproyecto).subscribe((resp: any) => {
      if (resp.success) {
        this.subproyectos.push(resp.subproyecto);
        this.resetNuevoSubproyecto();
        this.toast.success("Éxito", "Subproyecto creado correctamente");
        this.emitChanges();
      } else {
        this.toast.error("Error", resp.message || "Error al crear subproyecto");
      }
    });
  }

  editarSubproyecto(index: number) {
    this.selectedSubproyectoIndex = index;
    this.nuevoSubproyecto = { ...this.subproyectos[index] };
  }

  actualizarSubproyecto() {
    if (this.selectedSubproyectoIndex === -1) return;

    const subproyecto = this.subproyectos[this.selectedSubproyectoIndex];
    
    // Si la proforma no existe aún (proforma_id = 0), actualizar localmente
    if (this.proforma_id === 0) {
      this.subproyectos[this.selectedSubproyectoIndex] = {
        ...this.nuevoSubproyecto,
        id: subproyecto.id,
        updated_at: new Date().toISOString()
      };
      this.resetNuevoSubproyecto();
      this.toast.success("Éxito", "Subproyecto actualizado (se guardará al crear la proforma)");
      this.emitChanges();
      return;
    }

    // Validar que los productos tengan todos los campos requeridos
    const productosValidos = this.nuevoSubproyecto.productos.every(p => 
      p.product_id && 
      p.unit_id && 
      p.cantidad && 
      p.precio_unitario && 
      p.total
    );

    if (!productosValidos) {
      this.toast.error("Error", "Todos los productos deben tener todos los campos requeridos");
      return;
    }

    // Preparar datos para enviar al backend
    const dataToSend = {
      proforma_id: this.proforma_id,
      nombre: this.nuevoSubproyecto.nombre,
      descripcion: this.nuevoSubproyecto.descripcion || '',
      estado: this.nuevoSubproyecto.estado,
      productos: this.nuevoSubproyecto.productos.map(p => ({
        product_id: p.product_id,
        product_categorie_id: p.product?.product_categorie_id,
        unit_id: p.unit_id,
        cantidad: p.cantidad,
        precio_unitario: p.precio_unitario,
        total: p.total,
        warehouse_id: p.warehouse_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
    };

    console.log('Datos a enviar al backend:', dataToSend);

    // Si la proforma ya existe, enviar al backend
    this.subproyectosService.update(subproyecto.id!, dataToSend).subscribe({
      next: (resp: any) => {
        if (resp.success) {
          // Actualizar el subproyecto con los datos de respuesta
          this.subproyectos[this.selectedSubproyectoIndex] = {
            ...resp.subproyecto,
            productos: resp.subproyecto.productos.map((p: any) => ({
              ...p,
              product: this.nuevoSubproyecto.productos.find(prod => prod.product_id === p.product_id)?.product,
              unit: this.nuevoSubproyecto.productos.find(prod => prod.unit_id === p.unit_id)?.unit
            }))
          };
          this.resetNuevoSubproyecto();
          this.toast.success("Éxito", "Subproyecto actualizado correctamente");
          this.emitChanges();
        } else {
          this.toast.error("Error", resp.message || "Error al actualizar subproyecto");
        }
      },
      error: (error) => {
        console.error('Error al actualizar subproyecto:', error);
        const mensajeError = error.error?.message || error.error?.error || 'Error desconocido';
        this.toast.error("Error", "Error al actualizar subproyecto: " + mensajeError);
      }
    });
  }

  eliminarSubproyecto(index: number) {
    const subproyecto = this.subproyectos[index];
    
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas eliminar el subproyecto "${subproyecto.nombre}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // Si la proforma no existe aún (proforma_id = 0), eliminar localmente
        if (this.proforma_id === 0) {
          this.subproyectos.splice(index, 1);
          this.toast.success("Éxito", "Subproyecto eliminado");
          this.emitChanges();
          return;
        }

        // Si la proforma ya existe, eliminar del backend
        this.subproyectosService.delete(subproyecto.id!).subscribe((resp: any) => {
          if (resp.success) {
            this.subproyectos.splice(index, 1);
            this.toast.success("Éxito", "Subproyecto eliminado correctamente");
            this.emitChanges();
          } else {
            this.toast.error("Error", resp.message || "Error al eliminar subproyecto");
          }
        });
      }
    });
  }

  searchProducts() {
    if (!this.search_product) {
      this.toast.error("Validación", "Necesitas ingresar el nombre del producto");
      return;
    }
    
    this.proformasService.searchProducts(this.search_product).subscribe((resp: any) => {
      if (resp.products.data.length > 1) {
        // Guardamos los productos encontrados
        this.PRODUCTS_FOUND = resp.products.data;
        // Abrimos el modal de selección
        this.openProductSelectionModal();
      } else if (resp.products.data.length === 1) {
        this.selectProduct(resp.products.data[0]);
      } else {
        this.toast.error("Validación", "No hay coincidencia en la búsqueda");
      }
    });
  }

  // Método para seleccionar un producto
  selectProduct(product: any) {
    this.PRODUCT_SELECTED = product;
    this.search_product = this.PRODUCT_SELECTED.title;
    this.price = this.PRODUCT_SELECTED.price_general;
    this.toast.success("Éxito", "Producto seleccionado");
  }

  // Método para abrir el modal de selección de productos
  openProductSelectionModal() {
    this.modalService.open(this.productSelectionModal, { 
      size: 'lg',
      centered: true,
      scrollable: true
    });
  }

  changeUnitProduct($event: any) {
    if (!this.CLIENT_SELECTED) {
      this.toast.error("Validación", "Es necesario seleccionar a un cliente");
      return;
    }

    let UNIT_SELECTED = $event.target.value;
    
    this.warehouses_product = this.PRODUCT_SELECTED.warehouses.filter((wareh: any) => wareh.unit.id == UNIT_SELECTED);
    this.exits_warehouse = this.warehouses_product.filter((wareh: any) => wareh.warehouse.sucursale_id == this.sucursale_asesor);
    
    // Cálculo de precio igual que en el componente original
    if (!this.PRODUCT_SELECTED.wallets || this.PRODUCT_SELECTED.wallets.length === 0) {
      this.price = this.PRODUCT_SELECTED.price_general;
      if (this.is_gift == 2) {
        this.price = 0;
      }
      return;
    }

    let WALLETS = this.PRODUCT_SELECTED.wallets;
    let WALLETS_FILTER = WALLETS.filter((wallet: any) => wallet.unit && wallet.sucursale && wallet.client_segment);
    let PRICE_S = WALLETS_FILTER.find((wallet: any) => 
      wallet.unit.id == UNIT_SELECTED && 
      wallet.sucursale.id == this.sucursale_asesor &&
      wallet.client_segment.id == this.CLIENT_SELECTED.client_segment.id
    );
    
    if (PRICE_S) {
      this.price = PRICE_S.price_general;
      if (this.is_gift == 2) {
        this.price = 0;
      }
      return;
    }

    this.price = this.PRODUCT_SELECTED.price_general;
    if (this.is_gift == 2) {
      this.price = 0;
    }
  }

  agregarProducto() {
    if (!this.PRODUCT_SELECTED) {
      this.toast.error("Validación", "No hay seleccionado un producto");
      return;
    }
    if (!this.quantity_product || this.quantity_product <= 0) {
      this.toast.error("Validación", "La cantidad debe ser mayor a 0");
      return;
    }
    if (!this.unidad_product) {
      this.toast.error("Validación", "No hay unidad del producto");
      return;
    }
    if (!this.selected_warehouse) {
      this.toast.error("Validación", "Debe seleccionar un almacén");
      return;
    }

    // Validar stock disponible
    const warehouse = this.exits_warehouse.find((w: any) => w.id == this.selected_warehouse);
    if (warehouse && warehouse.stock < this.quantity_product) {
      this.toast.error("Validación", `Stock insuficiente. Stock disponible: ${warehouse.stock}`);
      return;
    }

    const total = this.price * this.quantity_product;
    const UNIDAD = this.PRODUCT_SELECTED.units.find((item: any) => item.id == this.unidad_product);

    const nuevoProducto: SubproyectoProducto = {
      product_id: this.PRODUCT_SELECTED.id,
      product_categorie_id: this.PRODUCT_SELECTED.product_categorie_id,
      unit_id: Number(this.unidad_product),
      cantidad: this.quantity_product,
      precio_unitario: this.price,
      total: total,
      product: this.PRODUCT_SELECTED,
      unit: UNIDAD,
      warehouse_id: this.selected_warehouse
    };

    // Si el subproyecto ya existe en el backend (tiene ID) y la proforma existe (proforma_id > 0)
    if (this.selectedSubproyectoIndex !== -1 && 
        this.subproyectos[this.selectedSubproyectoIndex].id && 
        this.proforma_id > 0) {
      
      const subproyecto = this.subproyectos[this.selectedSubproyectoIndex];
      const subproyectoId = subproyecto.id;
      
      if (!subproyectoId) {
        this.toast.error("Error", "ID del subproyecto no válido");
        return;
      }

      // Crear el proforma_detail
      const proformaDetail: SubproyectoProducto = {
        subproyecto_id: subproyectoId,
        product_id: this.PRODUCT_SELECTED.id,
        product_categorie_id: this.PRODUCT_SELECTED.product_categorie_id,
        unit_id: Number(this.unidad_product),
        cantidad: this.quantity_product,
        precio_unitario: this.price,
        total: total,
        warehouse_id: this.selected_warehouse,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Enviando producto al backend:', proformaDetail);
      this.subproyectosService.addProduct(subproyectoId, proformaDetail).subscribe({
        next: (response) => {
          console.log('Producto agregado exitosamente:', response);
          this.toast.success('Producto agregado exitosamente');
          this.modalService.dismissAll();
          this.resetProduct();
          this.loadSubproyectos(); // Recargar los subproyectos para mostrar el nuevo producto
        },
        error: (error) => {
          console.error('Error al agregar producto:', error);
          this.toast.error(error.error?.message || 'Error al agregar el producto');
        }
      });
    } else {
      // Si el subproyecto aún no existe en el backend o la proforma es nueva (proforma_id = 0)
      // Agregar el producto localmente al subproyecto
      if (this.selectedSubproyectoIndex === -1) {
        this.toast.error("Error", "Debe seleccionar un subproyecto primero");
        return;
      }

      this.subproyectos[this.selectedSubproyectoIndex].productos.push(nuevoProducto);
      this.resetProduct();
      this.toast.success("Éxito", "Producto agregado al subproyecto (se guardará al crear la proforma)");
      this.emitChanges();
    }
  }

  eliminarProducto(index: number) {
    this.nuevoSubproyecto.productos.splice(index, 1);
  }

  // Nuevo método para eliminar producto de un subproyecto existente
  eliminarProductoDeSubproyecto(subproyectoIndex: number, productoIndex: number) {
    const subproyecto = this.subproyectos[subproyectoIndex];
    const producto = subproyecto.productos[productoIndex];
    
    if (!subproyecto.id || !producto.id) {
      // Si no hay IDs, eliminar localmente
      subproyecto.productos.splice(productoIndex, 1);
      this.toast.success("Éxito", "Producto eliminado");
      this.emitChanges();
      return;
    }
    
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas eliminar este producto del subproyecto?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.subproyectosService.removeProduct(subproyecto.id!, producto.id!).subscribe({
          next: (resp: any) => {
            if (resp.success) {
              subproyecto.productos.splice(productoIndex, 1);
              this.toast.success("Éxito", "Producto eliminado correctamente");
              this.emitChanges();
            } else {
              this.toast.error("Error", resp.message || "Error al eliminar producto");
            }
          },
          error: (error) => {
            console.error('Error al eliminar producto:', error);
            this.toast.error("Error", "Error al eliminar producto");
          }
        });
      }
    });
  }

  // Método helper para obtener nombre completo del producto
  getProductFullName(producto: any): string {
    const nombre = producto.product?.title || producto.title || 'Producto';
    const descripcion = producto.product?.description || producto.description || '';
    return descripcion ? `${nombre} - ${descripcion}` : nombre;
  }

  getTotalSubproyecto(): number {
    return Number(this.nuevoSubproyecto.productos.reduce((sum, producto) => {
      const total = Number(producto.total) || 0;
      return sum + total;
    }, 0).toFixed(2));
  }

  getTotalGeneral(): number {
    const totalSubproyectos = this.subproyectos.reduce((sum, subproyecto) => {
      const subTotal = subproyecto.productos.reduce((subSum, producto) => {
        const total = Number(producto.total) || 0;
        return subSum + total;
      }, 0);
      return sum + subTotal;
    }, 0);
    
    return Number((totalSubproyectos + this.getTotalSubproyecto()).toFixed(2));
  }

  getTotalSubproyectoByIndex(subproyecto: any): number {
    return Number(subproyecto.productos.reduce((sum: number, producto: any) => {
      const total = Number(producto.total) || 0;
      return sum + total;
    }, 0).toFixed(2));
  }

  resetProduct() {
    this.PRODUCT_SELECTED = null;
    this.search_product = '';
    this.price = 0;
    this.quantity_product = 1;
    this.warehouses_product = [];
    this.amount_discount = 0;
    this.description_product = '';
    this.unidad_product = '';
    this.is_gift = 1;
    this.selected_warehouse = null;
  }

  resetNuevoSubproyecto() {
    this.nuevoSubproyecto = {
      proforma_id: this.proforma_id,
      nombre: '',
      descripcion: '',
      estado: 'pendiente',
      productos: []
    };
    this.selectedSubproyectoIndex = -1;
    this.resetProduct();
  }

  emitChanges() {
    this.subproyectosChanged.emit({
      subproyectos: this.subproyectos,
      total: this.getTotalGeneral()
    });
  }

  isGift() {
    this.is_gift = this.is_gift == 1 ? 2 : 1;
    if (this.is_gift == 2) {
      this.price = 0;
    }
  }

  // Método para calcular el stock total de un producto
  getTotalStock(product: any): number {
    if (!product.warehouses || product.warehouses.length === 0) {
      return 0;
    }
    return product.warehouses.reduce((total: number, warehouse: any) => {
      return total + (warehouse.stock || 0);
    }, 0);
  }
} 