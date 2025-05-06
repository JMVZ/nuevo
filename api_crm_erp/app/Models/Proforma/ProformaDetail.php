<?php

namespace App\Models\Proforma;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\User;
use App\Models\Product\Product;
use App\Models\Configuration\Unit;
use App\Models\Configuration\Warehouse;
use App\Models\Configuration\ProductCategorie;

class ProformaDetail extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Los campos que se pueden asignar masivamente
     */
    protected $fillable = [
        'proforma_id',
        'product_id',
        'product_categorie_id',
        'quantity',
        'price_unit',
        'discount',
        'subtotal',
        'total',
        'description',
        'unit_id',
        'impuesto',
        'date_entrega',
        'user_entrega',
        'warehouse_id',
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
    public function proforma()
    {
        return $this->belongsTo(Proforma::class, 'proforma_id');
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class, 'unit_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function user_despacho()
    {
        return $this->belongsTo(User::class, 'user_entrega');
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
    }

    public function product_categorie()
    {
        return $this->belongsTo(ProductCategorie::class, 'product_categorie_id');
    }
}
