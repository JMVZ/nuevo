import { Component, OnInit, ChangeDetectorRef, NgZone, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductsService } from '../service/products.service';
import { ProductWarehousesService } from '../service/product-warehouses.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';
import { Observable, of, Subject } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { SearchProductsComponent } from '../../proformas/componets/search-products/search-products.component';

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

  constructor(
    private fb: FormBuilder,
    private productsService: ProductsService,
    private productWarehousesService: ProductWarehousesService,
    private modalService: NgbModal,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private toast: ToastrService
  ) {
    this.formEntrada = this.fb.group({
      producto: ['', Validators.required],
      unidad: ['', Validators.required],
      almacen: ['', Validators.required],
      cantidad: ['', [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
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

    const { unidad, almacen, cantidad } = this.formEntrada.value;
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
    const nuevoStock = (warehouse.quantity || 0) + Number(cantidad);

    // Actualizar el stock
    this.productWarehousesService.updateProductWarehouse(warehouse.id, {
      unit_id: unidad,
      warehouse_id: almacen,
      quantity: nuevoStock
    }).subscribe({
      next: (response: any) => {
        this.ngZone.run(() => {
          // Limpiar el formulario después de añadir
          this.formEntrada.reset();
          this.productoSeleccionado = null;
          this.productoIdSeleccionado = null;
          this.searchTerm = '';
          this.almacenes = [];
          this.unidades = [];

          // Mostrar mensaje de éxito usando el título guardado
          this.mensaje = `✅ <b>${cantidad}</b> ${unidadNombre} de <b>${productoNombre}</b> añadidos al almacén <b>${almacenNombre}</b> correctamente.`;
          this.tipoMensaje = 'success';
          this.cdr.detectChanges();

          // Hacer scroll al mensaje
          setTimeout(() => {
            const mensajeDiv = document.getElementById('mensaje-entrada');
            if (mensajeDiv) {
              mensajeDiv.scrollIntoView({ behavior: 'smooth' });
            }
          }, 100);

          // Ocultar el mensaje después de 4 segundos con animación
          setTimeout(() => {
            const mensajeDiv = document.getElementById('mensaje-entrada');
            if (mensajeDiv) {
              mensajeDiv.classList.remove('show');
              setTimeout(() => {
                this.mensaje = '';
                this.cdr.detectChanges();
              }, 300); // Esperar a que termine la animación
            }
          }, 4000);
        });
      },
      error: (error: any) => {
        console.error('Error al actualizar stock:', error);
        this.mensaje = error.error?.message || 'Error al actualizar el stock. Por favor, intenta de nuevo.';
        this.tipoMensaje = 'danger';
        this.cdr.detectChanges();
      }
    });
  }
} 