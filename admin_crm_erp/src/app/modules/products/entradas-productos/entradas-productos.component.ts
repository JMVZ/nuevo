import { Component, OnInit, ChangeDetectorRef, NgZone, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductsService } from '../service/products.service';
import { ProductWarehousesService } from '../service/product-warehouses.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';
import { Observable, of, Subject } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { SearchProductsComponent } from '../../proformas/componets/search-products/search-products.component';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-entradas-productos',
  templateUrl: './entradas-productos.component.html',
  styleUrls: ['./entradas-productos.component.scss']
})
export class EntradasProductosComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  formEntrada: FormGroup;
  productos: any[] = [];
  almacenes: any[] = [];
  unidades: any[] = [];
  productoSeleccionado: any = null;
  productoIdSeleccionado: number | null = null;
  mensaje: string = '';
  tipoMensaje: 'success' | 'danger' | '' = '';
  isLoading = false;
  searchTerm: string = '';
  
  // Variables para el historial
  entradas: any[] = [];
  page = 1;
  pageSize = 10;
  totalItems = 0;

  constructor(
    private fb: FormBuilder,
    private productsService: ProductsService,
    private productWarehousesService: ProductWarehousesService,
    private modalService: NgbModal,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private toast: ToastrService,
    private authService: AuthService
  ) {
    this.formEntrada = this.fb.group({
      producto: ['', Validators.required],
      unidad: ['', Validators.required],
      almacen: ['', Validators.required],
      cantidad: ['', [Validators.required, Validators.min(1)]],
      motivo: ['']
    });
  }

  ngOnInit(): void {
    this.cargarAlmacenes();
    this.cargarEntradas();
    this.productWarehousesService.isLoading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isLoading = loading;
        this.cdr.detectChanges();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarAlmacenes() {
    this.productsService.configAll().subscribe({
      next: (resp: any) => {
        this.almacenes = resp.almacens || [];
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar almacenes:', error);
      }
    });
  }

  cargarEntradas() {
    this.productWarehousesService.getEntradas(this.page, this.pageSize).subscribe({
      next: (resp: any) => {
        this.entradas = resp.entradas.data || [];
        this.totalItems = resp.entradas.total || 0;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar entradas:', error);
        this.mensaje = 'Error al cargar el historial de entradas';
        this.tipoMensaje = 'danger';
        this.cdr.detectChanges();
      }
    });
  }

  onPageChange(page: number) {
    this.page = page;
    this.cargarEntradas();
  }

  searchProducts() {
    if (!this.searchTerm || this.searchTerm.length < 1) {
      this.toast.error('Por favor ingresa un término de búsqueda');
      return;
    }

    this.productsService.listProducts(1, { search: this.searchTerm }).subscribe({
      next: (resp: any) => {
        const productos = resp.products.data || resp.products || [];
        if (productos.length === 0) {
          this.toast.error('No se encontraron productos');
          return;
        }

        if (productos.length === 1) {
          this.seleccionarProducto(productos[0]);
          return;
        }

        const modalRef = this.modalService.open(SearchProductsComponent, { size: 'lg' });
        const modalComponent = modalRef.componentInstance as SearchProductsComponent;
        modalComponent.products = productos;

        modalComponent.ProductSelected.subscribe((producto: any) => {
          this.seleccionarProducto(producto);
          modalRef.close();
        });
      },
      error: (error) => {
        console.error('Error al buscar productos:', error);
        this.toast.error('Error al buscar productos');
      }
    });
  }

  seleccionarProducto(prod: any) {
    this.formEntrada.patchValue({ producto: prod.title });
    this.productoSeleccionado = null;
    this.productoIdSeleccionado = prod.id;
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

  registrarEntrada() {
    if (this.formEntrada.invalid || !this.productoIdSeleccionado) {
      this.mensaje = 'Completa todos los campos correctamente.';
      this.tipoMensaje = 'danger';
      this.cdr.detectChanges();
      return;
    }

    const { unidad, almacen, cantidad, motivo } = this.formEntrada.value;
    // Buscar el registro product_warehouse correspondiente
    const warehouse = (this.productoSeleccionado.warehouses || []).find((w: any) => w.unit.id == unidad && w.warehouse.id == almacen);
    if (!warehouse) {
      this.mensaje = 'No se encontró la combinación de producto, unidad y almacén.';
      this.tipoMensaje = 'danger';
      this.cdr.detectChanges();
      return;
    }

    // Obtener nombres para el mensaje
    const unidadNombre = warehouse.unit.name;
    const almacenNombre = warehouse.warehouse.name;
    const productoNombre = this.productoSeleccionado.title;

    // Registrar la entrada usando el endpoint correcto
    const data = {
      product_warehouse_id: warehouse.id,
      quantity: Number(cantidad),
      user_id: this.authService.user?.id || null,
      reason: motivo || null
    };

    this.isLoading = true;
    this.productWarehousesService.registrarEntrada(data).subscribe({
      next: (response: any) => {
        this.ngZone.run(() => {
          // Limpiar el formulario después de añadir
          this.formEntrada.reset();
          this.productoSeleccionado = null;
          this.productoIdSeleccionado = null;
          this.searchTerm = '';
          this.almacenes = [];
          this.unidades = [];

          // Recargar el historial de entradas
          this.cargarEntradas();

          // Mostrar mensaje de éxito
          this.mensaje = `✅ <b>${cantidad}</b> ${unidadNombre} de <b>${productoNombre}</b> añadidos al almacén <b>${almacenNombre}</b> correctamente.`;
          this.tipoMensaje = 'success';
          this.isLoading = false;
          this.cdr.detectChanges();

          // Hacer scroll al mensaje
          setTimeout(() => {
            const mensajeDiv = document.getElementById('mensaje-entrada');
            if (mensajeDiv) {
              mensajeDiv.scrollIntoView({ behavior: 'smooth' });
            }
          }, 100);

          // Ocultar el mensaje después de 4 segundos
          setTimeout(() => {
            this.mensaje = '';
            this.cdr.detectChanges();
          }, 4000);
        });
      },
      error: (error: any) => {
        console.error('Error al registrar entrada:', error);
        this.mensaje = error.error?.message || 'Error al registrar la entrada. Por favor, intenta de nuevo.';
        this.tipoMensaje = 'danger';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
} 