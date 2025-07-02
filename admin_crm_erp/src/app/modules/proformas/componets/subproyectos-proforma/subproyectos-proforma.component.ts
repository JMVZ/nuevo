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
  @ViewChild('editarInsumoModal') editarInsumoModal!: TemplateRef<any>;

  @Input() proforma_id: number = 0;
  @Input() CLIENT_SELECTED: any;
  @Input() sucursale_asesor: string = '';
  @Input() user: any;
  @Output() subproyectosChanged = new EventEmitter<any>();

  subproyectos: Subproyecto[] = [];
  
  // Getter para determinar si está en modo crear
  get isCreateMode(): boolean {
    return this.proforma_id === 0;
  }

  // Getter para determinar si está en modo editar
  get isEditMode(): boolean {
    return this.proforma_id > 0;
  }

  // Getters seguros para arrays usados en el template
  get safeSubproyectos(): Subproyecto[] {
    return Array.isArray(this.subproyectos) ? this.subproyectos : [];
  }

  get safeProductsFound(): any[] {
    return Array.isArray(this.PRODUCTS_FOUND) ? this.PRODUCTS_FOUND : [];
  }

  get safeProductSelectedUnits(): any[] {
    return this.PRODUCT_SELECTED && Array.isArray(this.PRODUCT_SELECTED.units) ? this.PRODUCT_SELECTED.units : [];
  }

  get safeExitsWarehouse(): any[] {
    return Array.isArray(this.exits_warehouse) ? this.exits_warehouse : [];
  }

  get safeNuevoSubproyectoProductos(): any[] {
    return Array.isArray(this.nuevoSubproyecto.productos) ? this.nuevoSubproyecto.productos : [];
  }

  // Método para obtener productos seguros de un subproyecto específico
  getSafeSubproyectoProductos(subproyecto: any): any[] {
    return subproyecto && Array.isArray(subproyecto.productos) ? subproyecto.productos : [];
  }

  // TrackBy functions para optimizar *ngFor
  trackBySubproyectoId(index: number, subproyecto: any): any {
    return subproyecto.id || index;
  }

  trackByProductoId(index: number, producto: any): any {
    return producto.id || index;
  }

  trackByProductId(index: number, product: any): any {
    return product.id || index;
  }

  trackByUnitId(index: number, unit: any): any {
    return unit.id || index;
  }

  trackByWarehouseId(index: number, warehouse: any): any {
    return warehouse.id || index;
  }

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
  PRODUCT_SELECTED: any = null;
  price: number = 0;
  quantity_product: number = 1;
  unidad_product: string = '';
  amount_discount: number = 0;
  is_gift: number = 1;
  description_product: string = '';
  warehouses_product: any[] = [];
  exits_warehouse: any[] = [];
  selectedSubproyectoIndex: number = -1;
  selected_warehouse: any = null;

  // Productos encontrados para el modal de selección
  PRODUCTS_FOUND: any[] = [];

  // Variables para edición de insumos
  editingProduct: any = null;
  editingSubproyectoIndex: number = -1;
  editingProductoIndex: number = -1;
  insumoEditando: any = null;
  insumoOriginal: any = null;

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
    // Inicializar todas las variables como arrays
    this.ensureArrays();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['proforma_id'] && changes['proforma_id'].currentValue !== changes['proforma_id'].previousValue) {
      console.log('proforma_id cambió:', changes['proforma_id'].currentValue);
      if (changes['proforma_id'].currentValue > 0) {
        this.loadSubproyectos();
      }
    }
    // Asegurar que las variables sean arrays después de cambios
    this.ensureArrays();
  }

  // Método para asegurar que todas las variables sean arrays
  private ensureArrays() {
    if (!Array.isArray(this.subproyectos)) {
      this.subproyectos = [];
    }
    if (!Array.isArray(this.PRODUCTS_FOUND)) {
      this.PRODUCTS_FOUND = [];
    }
    if (!Array.isArray(this.warehouses_product)) {
      this.warehouses_product = [];
    }
    if (!Array.isArray(this.exits_warehouse)) {
      this.exits_warehouse = [];
    }
    if (!Array.isArray(this.nuevoSubproyecto.productos)) {
      this.nuevoSubproyecto.productos = [];
    }
    
    // Validar subproyectos y sus productos
    this.subproyectos.forEach(subproyecto => {
      if (!Array.isArray(subproyecto.productos)) {
        subproyecto.productos = [];
      }
    });

    // Validar PRODUCT_SELECTED units
    if (this.PRODUCT_SELECTED && !Array.isArray(this.PRODUCT_SELECTED.units)) {
      this.PRODUCT_SELECTED.units = [];
    }
    if (this.PRODUCT_SELECTED && !Array.isArray(this.PRODUCT_SELECTED.warehouses)) {
      this.PRODUCT_SELECTED.warehouses = [];
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
            this.subproyectos = Array.isArray(resp.subproyectos) ? resp.subproyectos.map((sub: any) => ({
              ...sub,
              productos: Array.isArray(sub.productos) ? sub.productos.map((prod: any) => {
                const productoMapeado = {
                  ...prod,
                  cantidad: prod.quantity || prod.cantidad || 0, // Mapear quantity a cantidad
                  precio_unitario: prod.price_unit || prod.precio_unitario || 0
                };
                console.log('Producto mapeado:', productoMapeado.product?.title, 'cantidad:', productoMapeado.cantidad);
                return productoMapeado;
              }) : []
            })) : [];
            console.log('Subproyectos cargados:', this.subproyectos);
            this.ensureArrays(); // Asegurar arrays después de cargar
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

    // Asegurar arrays antes de procesar
    this.ensureArrays();

    // Si la proforma no existe aún (proforma_id = 0), manejar localmente
    if (this.proforma_id === 0) {
      // Crear un ID temporal para el subproyecto
      const tempId = Date.now();
      const nuevoSubproyectoLocal = {
        ...this.nuevoSubproyecto,
        id: tempId,
        proforma_id: 0,
        productos: Array.isArray(this.nuevoSubproyecto.productos) ? this.nuevoSubproyecto.productos : [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      this.subproyectos.push(nuevoSubproyectoLocal);
      this.resetNuevoSubproyecto();
      this.toast.success("Éxito", "Subproyecto agregado (se guardará al crear la proforma)");
      this.ensureArrays(); // Asegurar arrays después de agregar
      this.emitChanges();
      return;
    }

    // Si la proforma ya existe, enviar al backend
    this.nuevoSubproyecto.proforma_id = this.proforma_id;
    
    this.subproyectosService.store(this.nuevoSubproyecto).subscribe((resp: any) => {
      if (resp.success) {
        // Asegurar que el subproyecto recibido tenga productos como array
        const subproyectoRecibido = {
          ...resp.subproyecto,
          productos: Array.isArray(resp.subproyecto.productos) ? resp.subproyecto.productos : []
        };
        this.subproyectos.push(subproyectoRecibido);
        this.resetNuevoSubproyecto();
        this.toast.success("Éxito", "Subproyecto creado correctamente");
        this.ensureArrays(); // Asegurar arrays después de agregar
        this.emitChanges();
      } else {
        this.toast.error("Error", resp.message || "Error al crear subproyecto");
      }
    });
  }

  editarSubproyecto(index: number) {
    this.ensureArrays(); // Asegurar arrays antes de editar
    this.selectedSubproyectoIndex = index;
    const subproyecto = this.subproyectos[index];
    
    this.nuevoSubproyecto = { 
      ...subproyecto,
      productos: Array.isArray(subproyecto.productos) ? [...subproyecto.productos] : []
    };
  }

  actualizarSubproyecto() {
    if (this.selectedSubproyectoIndex === -1) return;

    const subproyecto = this.subproyectos[this.selectedSubproyectoIndex];
    
    // Si la proforma no existe aún (proforma_id = 0), actualizar localmente
    if (this.proforma_id === 0) {
      this.subproyectos[this.selectedSubproyectoIndex] = {
        ...this.nuevoSubproyecto,
        id: subproyecto.id,
        productos: [...subproyecto.productos], // Mantener los productos existentes
        updated_at: new Date().toISOString()
      };
      this.resetNuevoSubproyecto();
      this.toast.success("Éxito", "Subproyecto actualizado (se guardará al crear la proforma)");
      this.emitChanges();
      return;
    }

    // Preparar datos para enviar al backend
    const dataToSend = {
      proforma_id: this.proforma_id,
      nombre: this.nuevoSubproyecto.nombre,
      descripcion: this.nuevoSubproyecto.descripcion || '',
      estado: this.nuevoSubproyecto.estado,
      productos: subproyecto.productos.map(p => ({
        product_id: p.product_id,
        product_categorie_id: p.product?.product_categorie_id,
        unit_id: p.unit_id,
        cantidad: p.cantidad,
        precio_unitario: p.precio_unitario,
        total: p.total,
        warehouse_id: p.warehouse_id || null,
        created_at: p.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
    };

    console.log('Datos a enviar al backend:', dataToSend);

    // Si la proforma ya existe, enviar al backend
    this.subproyectosService.update(subproyecto.id!, dataToSend).subscribe({
      next: (resp: any) => {
        if (resp.success) {
          // Actualizar el subproyecto manteniendo los productos existentes
          this.subproyectos[this.selectedSubproyectoIndex] = {
            ...resp.subproyecto,
            productos: subproyecto.productos.map(p => ({
              ...p,
              product: p.product,
              unit: p.unit
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
    // Validar que no esté en modo crear
    if (this.isCreateMode) {
      this.toast.error("Acción no permitida", "No se pueden buscar productos durante la creación de la proforma. Guarda la proforma primero y luego edítala para agregar productos.");
      return;
    }

    if (!this.search_product.trim()) {
      this.toast.error("Validación", "Ingrese un término de búsqueda");
      return;
    }

    this.proformasService.searchProducts(this.search_product).subscribe((resp: any) => {
      console.log('=== DEBUG: Respuesta completa del backend ===');
      console.log('Respuesta completa:', resp);
      console.log('Tipo de resp:', typeof resp);
      console.log('resp.products:', resp.products);
      console.log('Tipo de resp.products:', typeof resp.products);
      console.log('Es array resp.products?:', Array.isArray(resp.products));
      
      // Intentar convertir a array si es necesario
      let products = resp.products;
      
      // Si resp.products es un objeto con datos anidados (Laravel Collection)
      if (products && typeof products === 'object' && !Array.isArray(products)) {
        console.log('Productos es un objeto, intentando extraer datos...');
        
        // Laravel Collections a veces se serializan con una estructura anidada
        if (products.data && Array.isArray(products.data)) {
          console.log('Encontrado products.data como array');
          products = products.data;
        } else if (Object.keys(products).length > 0) {
          // Si el objeto tiene propiedades numericas (indices), convertir a array
          const keys = Object.keys(products);
          console.log('Claves del objeto products:', keys);
          
          if (keys.every(key => !isNaN(Number(key)))) {
            console.log('Objeto con claves numéricas, convirtiendo a array...');
            products = Object.values(products);
          }
        }
      }
      
      console.log('Productos finales:', products);
      console.log('Es array productos finales?:', Array.isArray(products));
      console.log('Cantidad de productos:', Array.isArray(products) ? products.length : 'No es array');
      
      this.PRODUCTS_FOUND = Array.isArray(products) ? products : [];
      
      if (this.PRODUCTS_FOUND.length === 0) {
        this.toast.warning("Sin resultados", "No se encontraron productos con ese término");
      } else {
        this.modalService.open(this.productSelectionModal, { size: 'lg' });
      }
    });
  }

  selectProduct(product: any) {
    // Validar que no esté en modo crear
    if (this.isCreateMode) {
      this.toast.error("Acción no permitida", "No se pueden seleccionar productos durante la creación de la proforma.");
      return;
    }

    console.log('=== DEBUG: Producto seleccionado ===');
    console.log('Producto completo:', product);
    console.log('product.warehouses:', product.warehouses);
    console.log('Tipo de warehouses:', typeof product.warehouses);
    console.log('Es array warehouses?:', Array.isArray(product.warehouses));
    console.log('product.units:', product.units);
    console.log('Tipo de units:', typeof product.units);
    console.log('Es array units?:', Array.isArray(product.units));
    
    this.PRODUCT_SELECTED = product;
    this.price = 0; // Establecer precio en 0 siempre
    
    // Asegurarse de que warehouses sea un array y mapear quantity a stock
    let warehouses = Array.isArray(product.warehouses) ? product.warehouses : [];
    warehouses = warehouses.map((warehouse: any) => ({
      ...warehouse,
      stock: warehouse.quantity || warehouse.stock || 0  // Mapear quantity a stock
    }));
    
    console.log('Warehouses después del mapeo:', warehouses);
    this.warehouses_product = warehouses;
    
    // Asegurarse de que units sea un array
    if (this.PRODUCT_SELECTED) {
      this.PRODUCT_SELECTED.units = Array.isArray(this.PRODUCT_SELECTED.units) ? this.PRODUCT_SELECTED.units : [];
      this.PRODUCT_SELECTED.warehouses = warehouses; // Usar los warehouses mapeados
      
      console.log('Units finales:', this.PRODUCT_SELECTED.units);
      console.log('Warehouses finales:', this.PRODUCT_SELECTED.warehouses);
    }
    
    // Reinicializar exits_warehouse
    this.exits_warehouse = [];
    
    this.modalService.dismissAll();
  }

  changeUnitProduct(event: any) {
    // Validar que no esté en modo crear
    if (this.isCreateMode) {
      this.toast.error("Acción no permitida", "No se pueden modificar unidades durante la creación de la proforma.");
      return;
    }

    // Resto de la lógica original
    const unit_id = event.target.value;
    
    console.log('=== DEBUG: changeUnitProduct ===');
    console.log('unit_id seleccionado:', unit_id);
    console.log('Tipo de unit_id:', typeof unit_id);
    console.log('warehouses_product completos:', this.warehouses_product);
    
    // Asegurarse de que warehouses_product sea un array antes de filtrar
    if (Array.isArray(this.warehouses_product)) {
      console.log('warehouses_product es un array válido');
      
      // Verificar la estructura de cada warehouse
      this.warehouses_product.forEach((warehouse, index) => {
        console.log(`Warehouse ${index}:`, warehouse);
        console.log(`- unit_id del warehouse: ${warehouse.unit_id} (tipo: ${typeof warehouse.unit_id})`);
        console.log(`- unit completa:`, warehouse.unit);
        console.log(`- warehouse info:`, warehouse.warehouse);
        console.log(`- stock:`, warehouse.stock);
      });
      
      // Intentar filtrar con conversión de tipos
      this.exits_warehouse = this.warehouses_product.filter((item: any) => {
        // El backend envía warehouse.unit.id, no warehouse.unit_id
        const warehouseUnitId = item.unit?.id || item.unit_id;
        const selectedUnitId = unit_id;
        
        console.log(`Comparando: warehouse.unit.id(${warehouseUnitId}) == selected_unit_id(${selectedUnitId})`);
        console.log(`Resultado == :`, warehouseUnitId == selectedUnitId);
        console.log(`Resultado === :`, warehouseUnitId === selectedUnitId);
        
        // Intentar comparación con conversión de tipos
        return warehouseUnitId == selectedUnitId || 
               String(warehouseUnitId) === String(selectedUnitId) ||
               Number(warehouseUnitId) === Number(selectedUnitId);
      });
      
      console.log('exits_warehouse después del filtro:', this.exits_warehouse);
      console.log('Cantidad de almacenes filtrados:', this.exits_warehouse.length);
    } else {
      console.log('warehouses_product NO es un array:', this.warehouses_product);
      this.exits_warehouse = [];
    }
  }

  agregarProducto() {
    // Validar que no esté en modo crear
    if (this.isCreateMode) {
      this.toast.error("Acción no permitida", "No se pueden agregar productos durante la creación de la proforma. Guarda la proforma primero y luego edítala para agregar productos.");
      return;
    }

    if (!this.PRODUCT_SELECTED) {
      this.toast.error("Validación", "Debe seleccionar un producto");
      return;
    }

    if (this.quantity_product < 0) {
      this.toast.error("Validación", "La cantidad no puede ser negativa");
      return;
    }

    if (!this.unidad_product) {
      this.toast.error("Validación", "Debe seleccionar una unidad");
      return;
    }

    if (!this.selected_warehouse) {
      this.toast.error("Validación", "Debe seleccionar un almacén");
      return;
    }

    // Usar precio 0 siempre (sin cálculo de total con precios)
    const precio_unitario = 0;
    const total = 0;

    const nuevoProducto: SubproyectoProducto = {
      product_id: this.PRODUCT_SELECTED.id,
      product_categorie_id: this.PRODUCT_SELECTED.product_categorie_id,
      product: this.PRODUCT_SELECTED,
      unit_id: Number(this.unidad_product),
      unit: this.PRODUCT_SELECTED.units.find((u: any) => u.id == this.unidad_product),
      cantidad: this.quantity_product,
      precio_unitario: precio_unitario,
      total: total,
      warehouse_id: this.selected_warehouse,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
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
        precio_unitario: precio_unitario,
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



  resetProduct() {
    this.PRODUCT_SELECTED = null;
    this.search_product = '';
    this.price = 0; // Mantener precio en 0
    this.quantity_product = 1;
    this.warehouses_product = [];
    this.exits_warehouse = [];
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
    this.ensureArrays(); // Asegurar arrays después del reset
  }



  isGift() {
    this.is_gift = this.is_gift == 1 ? 2 : 1;
    // No modificar el precio al marcar como obsequio, mantener en 0
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

  // ==================== NUEVAS FUNCIONALIDADES PARA EDICIÓN DE INSUMOS ====================

  /**
   * Abre el modal de selección de productos para agregar a un subproyecto específico
   */
  agregarInsumoASubproyecto(subproyectoIndex: number) {
    if (this.isCreateMode) {
      this.toast.error("Acción no permitida", "No se pueden agregar insumos durante la creación de la proforma. Guarda la proforma primero y luego edítala para agregar productos.");
      return;
    }

    // Establecer el subproyecto seleccionado
    this.selectedSubproyectoIndex = subproyectoIndex;
    
    // Abrir modal para buscar productos
    this.resetProduct();
    this.toast.info("Buscar Producto", "Usa el buscador para encontrar el producto que deseas agregar");
  }

  /**
   * Inicia la edición en línea de un insumo
   */
  startEditInsumo(producto: any, subproyectoIndex: number, productoIndex: number) {
    if (this.isCreateMode) {
      return;
    }

    // Guardar estado anterior si había alguna edición en curso
    this.cancelEditInsumo();

    // Configurar nueva edición
    this.editingProduct = { ...producto };
    this.editingSubproyectoIndex = subproyectoIndex;
    this.editingProductoIndex = productoIndex;

    console.log('Iniciando edición de insumo:', producto);
  }

  /**
   * Cancela la edición en línea actual
   */
  cancelEditInsumo() {
    this.editingProduct = null;
    this.editingSubproyectoIndex = -1;
    this.editingProductoIndex = -1;
  }

  /**
   * Guarda los cambios de la edición en línea
   */
  saveInsumoEdit(subproyectoIndex: number, productoIndex: number) {
    if (!this.editingProduct) {
      return;
    }

    // Validaciones
    if (this.editingProduct.cantidad <= 0) {
      this.toast.error("Validación", "La cantidad debe ser mayor a 0");
      return;
    }

    // Actualizar el producto en el subproyecto
    const subproyecto = this.subproyectos[subproyectoIndex];
    const producto = subproyecto.productos[productoIndex];

    // Actualizar valores (solo cantidad, no precios)
    producto.cantidad = parseFloat(this.editingProduct.cantidad) || 0;
    producto.updated_at = new Date().toISOString();

    // Si el subproyecto existe en el backend, actualizar
    if (subproyecto.id && producto.id && this.proforma_id > 0) {
      this.updateInsumoBackend(subproyecto.id, producto);
    } else {
      // Actualización local
      this.toast.success("Éxito", "Insumo actualizado localmente");
      this.emitChanges();
    }

    // Limpiar edición
    this.cancelEditInsumo();
  }

  /**
   * Actualiza un insumo en el backend usando el endpoint específico
   */
  private updateInsumoBackend(subproyectoId: number, producto: any) {
    const datosActualizacion = {
      cantidad: producto.cantidad,
      precio_unitario: 0 // Precio siempre en 0
    };

    this.subproyectosService.updateProduct(subproyectoId, producto.id, datosActualizacion).subscribe({
      next: (response) => {
        if (response.success) {
          this.toast.success("Éxito", "Insumo actualizado correctamente");
          this.loadSubproyectos(); // Recargar para obtener datos actualizados
        } else {
          this.toast.error("Error", response.message || "Error al actualizar el insumo");
          this.loadSubproyectos(); // Recargar para revertir cambios
        }
      },
      error: (error) => {
        console.error('Error al actualizar producto:', error);
        const mensajeError = error.error?.message || error.message || 'Error desconocido';
        this.toast.error("Error", "Error al actualizar el insumo: " + mensajeError);
        this.loadSubproyectos(); // Recargar para revertir cambios
      }
    });
  }

  /**
   * Abre el modal de edición detallada de un insumo
   */
  editarInsumoDetallado(producto: any, subproyectoIndex: number, productoIndex: number) {
    if (this.isCreateMode) {
      return;
    }

    // Guardar referencia al insumo original
    this.insumoOriginal = { ...producto };
    this.insumoEditando = { 
      ...producto,
      cantidad: parseFloat(producto.cantidad) || 0
    };
    this.editingSubproyectoIndex = subproyectoIndex;
    this.editingProductoIndex = productoIndex;

    // Abrir modal
    this.modalService.open(this.editarInsumoModal, { 
      size: 'md',
      backdrop: 'static',
      keyboard: false
    });
  }

  /**
   * Valida el insumo en edición
   */
  validarInsumoEditando(): boolean {
    if (!this.insumoEditando) {
      return false;
    }

    const cantidad = parseFloat(this.insumoEditando.cantidad) || 0;
    return cantidad > 0;
  }

  /**
   * Guarda los cambios del modal de edición detallada
   */
  guardarInsumoDetallado() {
    if (!this.validarInsumoEditando()) {
      this.toast.error("Validación", "Por favor verifica que la cantidad sea correcta");
      return;
    }

    // Actualizar el producto en el subproyecto
    const subproyecto = this.subproyectos[this.editingSubproyectoIndex];
    const producto = subproyecto.productos[this.editingProductoIndex];

    // Actualizar valores (solo cantidad)
    producto.cantidad = parseFloat(this.insumoEditando.cantidad);
    producto.updated_at = new Date().toISOString();

    // Si el subproyecto existe en el backend, actualizar
    if (subproyecto.id && producto.id && this.proforma_id > 0) {
      this.updateInsumoBackend(subproyecto.id, producto);
    } else {
      // Actualización local
      this.toast.success("Éxito", "Insumo actualizado localmente");
      this.emitChanges();
    }

    // Cerrar modal y limpiar
    this.modalService.dismissAll();
    this.limpiarEdicionInsumo();
  }

  /**
   * Limpia las variables de edición de insumo
   */
  private limpiarEdicionInsumo() {
    this.insumoEditando = null;
    this.insumoOriginal = null;
    this.editingSubproyectoIndex = -1;
    this.editingProductoIndex = -1;
  }

  /**
   * Recalcula el total de un subproyecto específico (siempre retorna 0)
   */
  getTotalSubproyectoByIndex(subproyecto: any): number {
    return 0;
  }

  /**
   * Recalcula el total general de todos los subproyectos (siempre retorna 0)
   */
  getTotalGeneral(): number {
    return 0;
  }

  /**
   * Método para emitir cambios sin precios
   */
  emitChanges() {
    this.ensureArrays(); // Asegurar arrays antes de emitir
    this.subproyectosChanged.emit({
      subproyectos: this.subproyectos,
      total: 0
    });
  }
} 