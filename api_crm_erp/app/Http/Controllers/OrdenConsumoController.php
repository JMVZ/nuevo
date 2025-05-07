<?php

namespace App\Http\Controllers\Produccion;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\Proforma\Proforma;
use App\Models\Produccion\OrdenConsumo;
use App\Models\Produccion\OrdenConsumoDetalle;
use App\Models\Product\ProductWarehouse;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

class OrdenConsumoController extends Controller
{
    public function tomarInsumos($proforma_id)
    {
        $proforma = Proforma::with('details')->findOrFail($proforma_id);

        DB::beginTransaction();

        try {
            // Crear orden de consumo
            $orden = OrdenConsumo::create([
                'proforma_id' => $proforma->id,
                'descripcion' => 'Insumos tomados automáticamente al generar orden de consumo.'
            ]);

            // Validar stock y descontar
            foreach ($proforma->details as $detalle) {
                $product_id = $detalle->product_id;
                $unit_id = $detalle->unit_id;
                $cantidad = $detalle->quantity;

                // Buscar el inventario correspondiente
                $warehouse = ProductWarehouse::where('product_id', $product_id)
                    ->where('unit_id', $unit_id)
                    ->first();

                if (!$warehouse || $warehouse->stock < $cantidad) {
                    throw new HttpException(422, "Stock insuficiente para el producto ID: $product_id");
                }

                // Descontar del inventario
                $warehouse->stock -= $cantidad;
                $warehouse->save();

                // Crear detalle de orden de consumo
                OrdenConsumoDetalle::create([
                    'orden_consumo_id' => $orden->id,
                    'product_id' => $product_id,
                    'unit_id' => $unit_id,
                    'cantidad' => $cantidad,
                ]);
            }

            // Cambiar estado de la proforma a "en_produccion" o similar
            $proforma->state_proforma = 'en_produccion';
            $proforma->save();

            DB::commit();

            return response()->json(['message' => 'Insumos tomados correctamente. Orden creada.']);

        } catch (\Throwable $th) {
            DB::rollBack();
            throw new HttpException(500, $th->getMessage());
        }
    }
}
