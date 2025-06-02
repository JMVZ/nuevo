import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductWarehousesService } from '../service/product-warehouses.service';
import { ProductsService } from '../service/products.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { RegisterProductOutputComponent } from '../warehouse/register-product-output/register-product-output.component';
import { ToastrService } from 'ngx-toastr';
import { SearchProductsComponent } from '../../proformas/componets/search-products/search-products.component';

@Component({
  selector: 'app-salidas-productos',
  templateUrl: './salidas-productos.component.html',
  styleUrls: ['./salidas-productos.component.scss']
})
export class SalidasProductosComponent implements OnInit {
  formSalida: FormGroup;
  productos: any[] = [];
  productosFiltrados: any[] = [];
  unidades: any[] = [];
  almacenes: any[] = [];
  showSuggestions = false;
  productoSeleccionado: any = null;
  productoIdSeleccionado: number | null = null;
  mensaje: string = '';
  tipoMensaje: 'success' | 'danger' | '' = '';
  isLoading = false;
  searchTerm: string = '';
  salidas: any[] = [];
  page = 1;
  pageSize = 10;
  totalItems = 0;
  stockDisponible: number | null = null;

  constructor(
    private fb: FormBuilder,
    private productWarehousesService: ProductWarehousesService,
    private productsService: ProductsService,
    private modalService: NgbModal,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private toast: ToastrService
  ) {
    this.formSalida = this.fb.group({
      producto: ['', Validators.required],
      unidad: ['', Validators.required],
      almacen: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.cargarProductos();
    this.cargarSalidas();
    
    // Suscribirse al estado de carga del servicio
    this.productWarehousesService.isLoading$.subscribe(
      loading => {
        this.isLoading = loading;
        this.cdr.detectChanges();
      }
    );

    this.formSalida.get('producto')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term: string) => this.filtrarProductos(term))
      )
      .subscribe((resultados: any[]) => {
        this.productosFiltrados = resultados;
        this.showSuggestions = !!(this.searchTerm && resultados.length > 0);
        this.cdr.detectChanges();
      });

    this.formSalida.get('unidad')?.valueChanges.subscribe(() => this.actualizarStockDisponible());
    this.formSalida.get('almacen')?.valueChanges.subscribe(() => this.actualizarStockDisponible());
  }

  cargarProductos() {
    console.log('Iniciando carga de productos...');
    this.productsService.listProducts(1, { all: true }).subscribe({
      next: (resp: any) => {
        console.log('Respuesta del servidor:', resp);
        this.productos = resp.products.data || resp.products || [];
        console.log('Productos cargados:', this.productos.length);
        this.productosFiltrados = this.productos;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
        this.mensaje = 'Error al cargar los productos';
        this.tipoMensaje = 'danger';
        this.cdr.detectChanges();
      }
    });
  }

  cargarSalidas() {
    this.productWarehousesService.getSalidas(this.page, this.pageSize).subscribe({
      next: (resp: any) => {
        this.salidas = resp.salidas.data || [];
        this.totalItems = resp.salidas.total || 0;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar salidas:', error);
        this.mensaje = 'Error al cargar el historial de salidas';
        this.tipoMensaje = 'danger';
        this.cdr.detectChanges();
      }
    });
  }

  filtrarProductos(term: string): Observable<any[]> {
    this.searchTerm = term;
    if (!term || term.length < 1) {
        return of([]);
    }
    const lowerTerm = term.toLowerCase();
    console.log('Buscando productos con término:', lowerTerm);
    console.log('Total de productos disponibles:', this.productos.length);
    
    const filtrados = this.productos.filter(prod => {
        const titleMatch = prod.title?.toLowerCase().includes(lowerTerm);
        const skuMatch = prod.sku?.toLowerCase().includes(lowerTerm);
        const descMatch = prod.description?.toLowerCase().includes(lowerTerm);
        const nameMatch = prod.name?.toLowerCase().includes(lowerTerm);
        
        const matches = titleMatch || skuMatch || descMatch || nameMatch;
        if (matches) {
            console.log('Producto encontrado:', prod.title);
        }
        return matches;
    });
    
    console.log('Productos encontrados:', filtrados.length);
    return of(filtrados);
  }

  onProductoInput(event: any) {
    const valor = event.target.value;
    this.formSalida.patchValue({ unidad: '', almacen: '' });
    
    if (valor.length >= 1) {
        const lowerValor = valor.toLowerCase();
        console.log('Buscando en input:', lowerValor);
        console.log('Total de productos:', this.productos.length);
        
        this.productosFiltrados = this.productos.filter(prod => {
            const titleMatch = prod.title?.toLowerCase().includes(lowerValor);
            const skuMatch = prod.sku?.toLowerCase().includes(lowerValor);
            const descMatch = prod.description?.toLowerCase().includes(lowerValor);
            const nameMatch = prod.name?.toLowerCase().includes(lowerValor);
            
            const matches = titleMatch || skuMatch || descMatch || nameMatch;
            if (matches) {
                console.log('Producto encontrado:', prod.title);
            }
            return matches;
        });
        
        console.log('Resultados encontrados:', this.productosFiltrados.length);
        this.showSuggestions = true;
        this.cdr.detectChanges();
    } else {
        this.productosFiltrados = [];
        this.showSuggestions = false;
    }
  }

  searchProducts() {
    if (!this.searchTerm) {
      this.toast.error("Validación", "Necesitas ingresar al menos uno de los campos");
      return;
    }
    this.productsService.listProducts(1, { search: this.searchTerm }).subscribe((resp: any) => {
      console.log(resp);
      if (resp.products.data.length > 1) {
        this.openSelectedProduct(resp.products.data);
      } else {
        if (resp.products.data.length == 1) {
          this.seleccionarProducto(resp.products.data[0]);
          this.toast.success("Éxito", "Se seleccionó el producto");
        } else {
          this.toast.error("Validación", "No hay coincidencia en la búsqueda");
        }
      }
    });
  }

  openSelectedProduct(products: any = []) {
    const modalRef = this.modalService.open(SearchProductsComponent, { size: 'lg', centered: true });
    modalRef.componentInstance.products = products;

    modalRef.componentInstance.ProductSelected.subscribe((product: any) => {
      this.seleccionarProducto(product);
      this.toast.success("Éxito", "Se seleccionó el producto");
    });
  }

  seleccionarProducto(prod: any) {
    this.formSalida.patchValue({ producto: prod.title });
    this.productoSeleccionado = null;
    this.productoIdSeleccionado = prod.id;
    this.showSuggestions = false;
    this.productsService.showProduct(prod.id).subscribe({
      next: (resp: any) => {
        this.productoSeleccionado = resp.product || resp;
        this.almacenes = (this.productoSeleccionado.warehouses || []).map((w: any) => w.warehouse);
        this.unidades = (this.productoSeleccionado.warehouses || []).map((w: any) => w.unit);
        // Eliminar duplicados
        this.almacenes = this.almacenes.filter((v: any, i: number, a: any[]) => a.findIndex(t => t.id === v.id) === i);
        this.unidades = this.unidades.filter((v: any, i: number, a: any[]) => a.findIndex(t => t.id === v.id) === i);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar detalles del producto:', error);
        this.mensaje = 'Error al cargar los detalles del producto';
        this.tipoMensaje = 'danger';
        this.cdr.detectChanges();
      }
    });
  }

  onProductoInputBlur() {
    setTimeout(() => {
      this.showSuggestions = false;
      this.cdr.detectChanges();
    }, 200);
  }

  abrirModalRegistro() {
    if (this.formSalida.invalid || !this.productoIdSeleccionado) {
      this.mensaje = 'Completa todos los campos correctamente.';
      this.tipoMensaje = 'danger';
      this.cdr.detectChanges();
      return;
    }

    const { unidad, almacen } = this.formSalida.value;

    // Buscar el registro product_warehouse correspondiente
    const warehouse = (this.productoSeleccionado.warehouses || []).find(
      (w: any) => w.unit.id == unidad && w.warehouse.id == almacen
    );

    if (!warehouse) {
      this.mensaje = 'No se encontró la combinación de producto, unidad y almacén. Por favor, revisa que exista stock para esa combinación.';
      this.tipoMensaje = 'danger';
      this.cdr.detectChanges();
      return;
    }

    const modalRef = this.modalService.open(RegisterProductOutputComponent, { size: 'lg' });
    modalRef.componentInstance.WAREHOUSE_PRODUCT = warehouse;
    
    modalRef.componentInstance.OutputRegistered.subscribe(() => {
      this.cargarSalidas();
      this.formSalida.reset();
      this.productoSeleccionado = null;
      this.productoIdSeleccionado = null;
      this.almacenes = [];
      this.unidades = [];
      this.stockDisponible = null;
      this.cdr.detectChanges();
    });
  }

  onPageChange(page: number) {
    this.page = page;
    this.cargarSalidas();
  }

  actualizarStockDisponible() {
    const unidad = this.formSalida.get('unidad')?.value;
    const almacen = this.formSalida.get('almacen')?.value;
    if (this.productoSeleccionado && unidad && almacen) {
      const warehouse = (this.productoSeleccionado.warehouses || []).find(
        (w: any) => w.unit.id == unidad && w.warehouse.id == almacen
      );
      this.stockDisponible = warehouse ? warehouse.quantity : 0;
    } else {
      this.stockDisponible = null;
    }
  }
} 