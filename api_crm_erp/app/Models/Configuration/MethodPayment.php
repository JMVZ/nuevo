<?php

namespace App\Models\Configuration;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Proforma\ProformaPayment;

class MethodPayment extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Campos asignables masivamente
     */
    protected $fillable = [
        'name',
        'method_payment_id',
        'state',
    ];

    /**
     * Booted hook para mantener integridad referencial
     */
    protected static function booted()
    {
        static::deleting(function (MethodPayment $mp) {
            // Limpiar referencias en ProformaPayment
            ProformaPayment::where('method_payment_id', $mp->id)
                ->update(['method_payment_id' => null]);
        });
    }

    /**
     * Relación al método de pago padre
     */
    public function method_payment()
    {
        return $this->belongsTo(MethodPayment::class, 'method_payment_id');
    }

    /**
     * Relación a métodos de pago hijos
     */
    public function method_payments()
    {
        return $this->hasMany(MethodPayment::class, 'method_payment_id');
    }

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
}