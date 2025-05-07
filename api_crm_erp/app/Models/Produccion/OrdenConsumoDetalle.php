<?php
namespace App\Models\Produccion;

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

    public function orden()
    {
        return $this->belongsTo(OrdenConsumo::class, 'orden_consumo_id');
    }

    public function producto()
    {
        return $this->belongsTo(\App\Models\Product\Product::class, 'product_id');
    }

    public function unidad()
    {
        return $this->belongsTo(\App\Models\Configuration\Unit::class, 'unit_id');
    }
}