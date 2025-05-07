<?php

namespace App\Models\Ordenes;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class OrdenConsumo extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'ordenes_consumo';

    protected $fillable = [
        'proforma_id',
        'descripcion',
    ];

    public function detalles()
    {
        return $this->hasMany(OrdenConsumoDetalle::class, 'orden_consumo_id');
    }
}
