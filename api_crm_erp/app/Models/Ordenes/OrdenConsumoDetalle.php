<?php

namespace App\Models\Ordenes;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class OrdenConsumoDetalle extends Model
{
    use HasFactory;

    protected $table = 'orden_consumo_detalles';

    protected $fillable = [
        'orden_consumo_id',
        'product_id',
        'unit_id',
        'cantidad',
    ];
}
