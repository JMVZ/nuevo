<?php

namespace App\Models\Produccion;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

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

    public function proforma()
    {
        return $this->belongsTo(\App\Models\Proforma\Proforma::class);
    }
}