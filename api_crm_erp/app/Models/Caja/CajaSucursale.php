<?php

namespace App\Models\Caja;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Askedio\SoftCascade\Traits\SoftCascadeTrait;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\User;

class CajaSucursale extends Model
{
    use HasFactory, SoftDeletes, SoftCascadeTrait;

    /**
     * Relaciones que se soft-deletean automáticamente en cascada
     */
    protected $softCascade = [
        'histories',
        'egresos',
    ];

    /**
     * Campos asignables masivamente
     */
    protected $fillable = [
        'user_id',
        'caja_id',
        'state',
        'user_close',
        'date_close',
        'efectivo_initial',
        'ingresos',
        'egresos',
        'efectivo_process',
        'efectivo_finish',
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
     * Relaciones
     */
    public function user_apertura()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function user_cierre()
    {
        return $this->belongsTo(User::class, 'user_close');
    }

    public function caja()
    {
        return $this->belongsTo(Caja::class, 'caja_id');
    }

    public function histories()
    {
        return $this->hasMany(CajaHistorie::class, 'caja_sucursale_id');
    }

    public function egresos()
    {
        return $this->hasMany(CajaEgreso::class, 'caja_sucursale_id');
    }
}
