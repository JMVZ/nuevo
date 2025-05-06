<?php

namespace App\Models\Caja;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CajaEgreso extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Campos que se pueden asignar masivamente
     */
    protected $fillable = [
        'caja_sucursale_id',
        'description',
        'amount',
    ];

    /**
     * Mutators para timestamps con zona America/Lima
     */
    public function setCreatedAtAttribute($value)
    {
        date_default_timezone_set('America/Lima');
        $this->attributes['created_at'] = Carbon::now();
    }

    public function setUpdatedAtAttribute($value)
    {
        date_default_timezone_set('America/Lima');
        $this->attributes['updated_at'] = Carbon::now();
    }

    /**
     * Relación con la sucursal de caja
     */
    public function caja_sucursale()
    {
        return $this->belongsTo(CajaSucursale::class, 'caja_sucursale_id');
    }
}
