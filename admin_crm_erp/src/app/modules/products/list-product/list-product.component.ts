import { Component, ViewChild } from '@angular/core';
import { ProductsService } from '../service/products.service';
import { DeleteProductComponent } from '../delete-product/delete-product.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { isPermission, URL_SERVICIOS } from 'src/app/config/config';
import { ImportProductsComponent } from '../import-products/import-products.component';
import { ChangeDetectorRef } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-list-product',
  templateUrl: './list-product.component.html',
  styleUrls: ['./list-product.component.scss']
})
export class ListProductComponent {

  search:string = '';
  PRODUCTS:any = [];
  isLoading$:any;
  sortOrder: 'asc' | 'desc' = 'asc';

  CATEGORIES:any = [];
  SUCURSALES:any = [];
  WAREHOUSES:any = [];
  CLIENT_SEGMENTS:any = [];
  UNITS:any = [];

  totalPages:number = 0;
  currentPage:number = 1;

  product_categorie_id:string = '';
  disponibilidad:string = '';
  tax_selected:string = '';
  sucursale_price_multiple:string = '';
  almacen_warehouse:string = '';
  client_segment_price_multiple :string = '';
  unit_warehouse:string = '';
  state_stock:string = '';
  num_products_agotado:number = 0;
  num_products_por_agotar:number = 0;
  totalItems: number = 0;

  insumosNegativos: any[] = [];
  @ViewChild('modalInsumosNegativos') modalInsumosNegativos: any;

  productosFiltrados: any[] = [];
  num_products_bajo: number = 0;

  constructor(
    public modalService: NgbModal,
    public productService: ProductsService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {
    
  }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.isLoading$ = this.productService.isLoading$;
    this.listProducts();
    this.configAll();
    this.productosFiltrados = this.PRODUCTS;
  }

  listProducts(page = 1){
      let data = {
        all: false,
        paginate: true,
        per_page: 50,
        product_categorie_id: this.product_categorie_id,
        disponibilidad: this.disponibilidad,
        tax_selected: this.tax_selected,
        search: this.search,
        // FILTER SPECIAL
        sucursale_price_multiple: this.sucursale_price_multiple,
        client_segment_price_multiple: this.client_segment_price_multiple,
        almacen_warehouse: this.almacen_warehouse,
        unit_warehouse: this.unit_warehouse,
        state_stock: this.state_stock,
      }
    console.log('Solicitando productos con parámetros:', data);
    
    this.productService.listProducts(page,data).subscribe({
      next: (resp:any) => {
        console.log('Respuesta completa del servidor:', resp);
        
        if (resp.products && resp.products.data) {
          this.PRODUCTS = resp.products.data;
          console.log('Productos cargados:', this.PRODUCTS.length);
          console.log('Total de productos en el sistema:', resp.products.total);
          
          // Actualizar contadores
          this.num_products_agotado = resp.num_products_agotado || 0;
          this.num_products_por_agotar = resp.num_products_por_agotar || 0;
          console.log('Productos agotados:', this.num_products_agotado);
          console.log('Productos por agotar:', this.num_products_por_agotar);
          
          // Verificar si tenemos todos los productos
          if (this.PRODUCTS.length < resp.products.total) {
            console.warn('No se cargaron todos los productos. Cargados:', this.PRODUCTS.length, 'de', resp.products.total);
          }
        } else {
          console.error('No se recibieron productos válidos. Respuesta:', resp);
        }
        
        this.PRODUCTS.sort((a: any, b: any) => {
          const titleA = a.title.toLowerCase();
          const titleB = b.title.toLowerCase();
          return this.sortOrder === 'asc' 
            ? titleA.localeCompare(titleB)
            : titleB.localeCompare(titleA);
        });

        this.totalPages = resp.products?.total || 0;
        this.currentPage = page;
        this.totalItems = resp.products?.total || 0;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
      }
    });
  }

  resetlistProducts() {
    this.product_categorie_id = '';
    this.disponibilidad = '';
    this.tax_selected = '';
    this.search = '';
    this.sucursale_price_multiple= '';
    this.client_segment_price_multiple= '';
    this.almacen_warehouse= '';
    this.unit_warehouse = '';
    this.state_stock = '';
    this.listProducts();
  }
  configAll(){
    this.productService.configAll().subscribe((resp:any) => {
      console.log(resp);
      this.CATEGORIES = resp.categories;
      this.SUCURSALES = resp.sucursales;
      this.WAREHOUSES = resp.almacens;
      this.CLIENT_SEGMENTS = resp.segments_clients;
      this.UNITS = resp.units;
    })
  }
  getDisponibilidad(val:number){
    let TEXTO = "";
    switch (val) {
      case 1:
        TEXTO = "Vender los productos sin stock"
        break;
        case 2:
          TEXTO = "No vender los productos sin stock"
          break;
          case 3:
        TEXTO = "Proyectar con los contratos que se tenga"
        break;
      default:
        break;
    }
    return TEXTO;
  }
  getTaxSelected(val:number) {
    let TEXTO = "";
    switch (val) {
      case 1:
        TEXTO = "Tax Free"
        break;
        case 2:
          TEXTO = "IVA"
          break;
          case 3:
        TEXTO = "Downloadable Product"
        break;
      default:
        break;
    }
    return TEXTO;
  }
  loadPage($event:any){
    this.listProducts($event);
  }
  selectAgotado(){
    this.state_stock = '3';
    this.listProducts();
  }
  selectPorAgotado(){
    this.state_stock = '2';
    this.listProducts();
  }
  deleteProduct(PRODUCT:any){
    const modalRef = this.modalService.open(DeleteProductComponent,{centered:true, size: 'md'});
    modalRef.componentInstance.PRODUCT_SELECTED = PRODUCT;

    modalRef.componentInstance.ProductD.subscribe((prod:any) => {
      let INDEX = this.PRODUCTS.findIndex((prod:any) => prod.id == PRODUCT.id);
      if(INDEX != -1){
        this.PRODUCTS.splice(INDEX,1);
      }
    })
  }

  downloadProducts(){
    let LINK = "";
    if(this.disponibilidad){
      LINK += "&disponibilidad="+this.disponibilidad;
    }
    if(this.search){
      LINK += "&search="+this.search;
    }
    if(this.sucursale_price_multiple){
      LINK += "&sucursale_price_multiple="+this.sucursale_price_multiple;
    }
    if(this.client_segment_price_multiple){
      LINK += "&client_segment_price_multiple="+this.client_segment_price_multiple;
    }
    if(this.almacen_warehouse){
      LINK += "&almacen_warehouse="+this.almacen_warehouse;
    }
    if(this.unit_warehouse){
      LINK += "&unit_warehouse="+this.unit_warehouse;
    }
    if(this.state_stock){
      LINK += "&state_stock="+this.state_stock;
    }
    if(this.product_categorie_id){
      LINK += "&product_categorie_id="+this.product_categorie_id;
    }

    // Crear un elemento <a> temporal
    const link = document.createElement('a');
    link.href = URL_SERVICIOS+"/excel/export-products?k=1"+LINK+"&all=1";
    link.setAttribute('download', 'productos_descargados.xlsx');
    
    // Realizar la petición con el token
    this.http.get(link.href, {
      headers: {
        'Authorization': 'Bearer ' + this.productService.authservice.token
      },
      responseType: 'blob'
    })
    .subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, error => {
      console.error('Error al descargar el archivo:', error);
    });
  }

  printProducts(){
    // Obtener todos los productos para impresión
    this.productService.getAllProducts().subscribe((resp: any) => {
      const allProducts = resp.products ? resp.products.data : resp.data || [];
      
      // Crear el contenido HTML para imprimir
      let printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Listado de Productos</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 1cm;
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 12px;
              line-height: 1.4;
              margin: 0;
              padding: 0;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
            }
            .header h1 {
              margin: 0;
              font-size: 18px;
              color: #333;
            }
            .header p {
              margin: 5px 0;
              color: #666;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
              vertical-align: top;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
              font-size: 11px;
            }
            td {
              font-size: 10px;
            }
            .product-name {
              font-weight: bold;
              color: #333;
            }
            .category {
              color: #666;
              font-style: italic;
            }
            .stock {
              text-align: center;
              font-weight: bold;
            }
            .stock.low {
              color: #ff6b6b;
            }
            .stock.medium {
              color: #ffa726;
            }
            .stock.high {
              color: #4caf50;
            }
            .footer {
              margin-top: 20px;
              text-align: center;
              font-size: 10px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 10px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>LISTADO DE PRODUCTOS</h1>
            <p>Fecha de impresión: ${new Date().toLocaleDateString('es-ES', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="width: 60%">Nombre y Descripción</th>
                <th style="width: 15%">Cantidad</th>
                <th style="width: 25%">Categoría</th>
              </tr>
            </thead>
            <tbody>
      `;

      // Agregar los productos a la tabla
      allProducts.forEach((product: any) => {
        // Calcular stock total
        let totalStock = 0;
        if (product.warehouses && product.warehouses.length > 0) {
          totalStock = product.warehouses.reduce((sum: number, warehouse: any) => sum + (warehouse.stock || 0), 0);
        }

        // Determinar clase de stock
        let stockClass = 'stock';
        if (totalStock === 0) {
          stockClass += ' low';
        } else if (totalStock < 10) {
          stockClass += ' medium';
        } else {
          stockClass += ' high';
        }

        // Crear nombre completo con descripción
        let fullName = product.title;
        if (product.description) {
          fullName += ' - ' + product.description;
        }

        printContent += `
          <tr>
            <td class="product-name">${fullName}</td>
            <td class="${stockClass}">${totalStock}</td>
            <td class="category">${product.product_categorie ? product.product_categorie.name : '---'}</td>
          </tr>
        `;
      });

      printContent += `
            </tbody>
          </table>
          
          <div class="footer">
            <p>Total de productos: ${allProducts.length}</p>
            <p>Sistema de Gestión de Inventario - ${new Date().getFullYear()}</p>
          </div>
        </body>
        </html>
      `;

      // Abrir ventana de impresión
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // Esperar a que se cargue el contenido y luego imprimir
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
          }, 250);
        };
      }
    });
  }

  importProducts(){
    const modalRef = this.modalService.open(ImportProductsComponent,{centered:true, size: 'md'});
    modalRef.componentInstance.ImportProductD.subscribe((prod:any) => {
      this.listProducts();
    })
  }

  isPermission(permission:string){
    return isPermission(permission);
  }

  cargarProductos(page: number = 1) {
    this.productService.listProducts(page).subscribe((resp: any) => {
      this.PRODUCTS = resp.products.data || resp.products || [];
      this.totalPages = resp.products.total || 0;
      this.num_products_agotado = resp.num_products_agotado;
      this.num_products_por_agotar = resp.num_products_por_agotar;
      this.currentPage = page;
      this.totalItems = resp.products.total || 0;
      this.cdr.detectChanges();
    });
  }

  toggleSort() {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.listProducts(this.currentPage);
  }

  abrirModalInsumosNegativos() {
    this.calcularInsumosNegativos();
    this.modalService.open(this.modalInsumosNegativos, { size: 'lg' });
  }

  calcularInsumosNegativos() {
    this.insumosNegativos = [];
    console.log('Iniciando cálculo de insumos negativos...');
    
    // Obtener proformas pendientes
    this.productService.getProformasPendientes().subscribe({
      next: (resp: any) => {
        console.log('Respuesta completa de proformas:', resp);
        
        // Verificar si tenemos proformas
        if (!resp || !resp.proformas || !resp.proformas.data) {
          console.error('No se recibieron proformas válidas. Respuesta:', resp);
          return;
        }

        const proformas = resp.proformas.data;
        console.log('Proformas pendientes encontradas:', proformas.length);
        console.log('Proformas:', JSON.stringify(proformas, null, 2));

        if (proformas.length === 0) {
          console.log('No hay proformas pendientes');
          return;
        }

        // Crear mapa de productos requeridos
        const requeridosPorProducto: { [productId: string]: number } = {};
        
        // Sumar cantidades requeridas por producto
        proformas.forEach((proforma: any) => {
          console.log('Procesando proforma ID:', proforma.id);
          if (proforma.details && Array.isArray(proforma.details)) {
            proforma.details.forEach((detalle: any) => {
              const productId = detalle.product_id.toString();
              if (!requeridosPorProducto[productId]) {
                requeridosPorProducto[productId] = 0;
              }
              requeridosPorProducto[productId] += parseFloat(detalle.quantity) || 0;
            });
          } else {
            console.log('Proforma sin detalles:', proforma);
          }
        });

        console.log('Productos requeridos:', requeridosPorProducto);

        // Procesar cada producto requerido
        const procesarProducto = (productId: string) => {
          return new Promise<void>((resolve) => {
            this.productService.showProduct(productId).subscribe((resp: any) => {
              const producto = resp.product;
              console.log(`Detalles del producto ${productId}:`, producto);
              
              let stockDisponible = 0;
              if (producto.warehouses && producto.warehouses.length > 0) {
                console.log(`Almacenes del producto ${productId}:`, producto.warehouses);
                stockDisponible = producto.warehouses.reduce((acc: number, w: any) => {
                  const cantidad = parseFloat(w.quantity) || 0;
                  console.log(`Cantidad en almacén para producto ${productId}:`, cantidad);
                  return acc + cantidad;
                }, 0);
              }

              const cantidadRequerida = requeridosPorProducto[productId];
              const diferencia = stockDisponible - cantidadRequerida;
              
              console.log(`Producto ${productId}:`);
              console.log(`- Stock disponible: ${stockDisponible}`);
              console.log(`- Cantidad requerida: ${cantidadRequerida}`);
              console.log(`- Diferencia: ${diferencia}`);

              // Un insumo será negativo si el stock disponible es menor que lo requerido
              if (diferencia < 0) {
                console.log(`Producto ${productId} tendrá stock negativo: ${diferencia}`);
                this.insumosNegativos.push({
                  productId,
                  nombre: producto.title,
                  stockDisponible,
                  cantidadRequerida,
                  diferencia,
                  producto: producto
                });
              }

              resolve();
            });
          });
        };

        // Procesar todos los productos requeridos
        const procesarTodos = async () => {
          for (const productId in requeridosPorProducto) {
            await procesarProducto(productId);
          }
        };

        procesarTodos().then(() => {
          console.log('Cálculo de insumos negativos completado');
          console.log('Insumos negativos:', this.insumosNegativos);
        }).catch((error) => {
          console.error('Error al calcular insumos negativos:', error);
        });
      },
      error: (error) => {
        console.error('Error al obtener proformas:', error);
      }
    });
  }
}