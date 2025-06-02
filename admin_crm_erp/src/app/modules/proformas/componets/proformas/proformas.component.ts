store() {
    if (!this.CLIENT_SELECTED) {
      this.toast.error("Validación", "Debe seleccionar un cliente");
      return;
    }

    if (!this.sucursale_deliverie_id) {
      this.toast.error("Validación", "Debe seleccionar una sucursal de entrega");
      return;
    }

    if (!this.date_entrega) {
      this.toast.error("Validación", "Debe seleccionar una fecha de entrega");
      return;
    }

    if (this.subproyectos.length === 0) {
      this.toast.error("Validación", "Debe agregar al menos un subproyecto");
      return;
    }

    // Validar que cada subproyecto tenga al menos un producto
    const subproyectosSinProductos = this.subproyectos.filter(sp => !sp.productos || sp.productos.length === 0);
    if (subproyectosSinProductos.length > 0) {
      this.toast.error("Validación", "Cada subproyecto debe tener al menos un producto");
      return;
    }

    const data = {
      client_id: this.CLIENT_SELECTED.id,
      client_segment_id: this.CLIENT_SELECTED.client_segment_id,
      sucursale_deliverie_id: this.sucursale_deliverie_id,
      date_entrega: this.date_entrega,
      address: this.address,
      ubigeo_region: this.ubigeo_region,
      ubigeo_provincia: this.ubigeo_provincia,
      ubigeo_distrito: this.ubigeo_distrito,
      region: this.region,
      provincia: this.provincia,
      distrito: this.distrito,
      agencia: this.agencia,
      full_name_encargado: this.full_name_encargado,
      documento_encargado: this.documento_encargado,
      telefono_encargado: this.telefono_encargado,
      subtotal: this.subtotal,
      total: this.total,
      igv: this.igv,
      debt: this.debt,
      paid_out: this.paid_out,
      description: this.description,
      final_product_title: this.final_product_title,
      final_product_description: this.final_product_description,
      weeks: this.weeks,
      SUBPROYECTOS_DATA: JSON.stringify(this.subproyectos.map(sp => ({
        nombre: sp.nombre,
        descripcion: sp.descripcion,
        estado: sp.estado,
        productos: sp.productos.map(p => ({
          product_id: p.product_id,
          unit_id: p.unit_id,
          cantidad: p.cantidad,
          precio_unitario: p.precio_unitario,
          total: p.total,
          warehouse_id: p.warehouse_id
        }))
      })))
    };

    this.proformasService.store(data).subscribe({
      next: (response) => {
        if (response.message == 200) {
          this.toast.success("Éxito", "Proforma creada correctamente");
          this.router.navigate(['/proformas']);
        } else {
          this.toast.error("Error", response.message_text || "Error al crear la proforma");
        }
      },
      error: (error) => {
        console.error('Error al crear proforma:', error);
        this.toast.error("Error", error.error?.message || "Error al crear la proforma");
      }
    });
} 