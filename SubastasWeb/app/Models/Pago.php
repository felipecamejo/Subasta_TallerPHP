<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pago extends Model
{
    use HasFactory;

    protected $fillable = [
        'factura_id',
        'transaction_id',
        'amount',
        'status',
        'payment_method',
        'payment_details'
    ];

    public function factura()
    {
        return $this->belongsTo(Factura::class);
    }
}
