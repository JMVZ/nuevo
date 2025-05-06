<?php

namespace App\Http\Resources\Caja\CajaHistorie;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\Caja\Proforma\ProformaCajaResource;

class CajaHistorieResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            "id" => $this->resource->id,
            "caja_sucursale_id" => $this->resource->caja_sucursale_id,
            "proforma_id" => $this->resource->proforma_id,
            "proforma" => ProformaCajaResource::make($this->resource->proforma),
            "amount" => $this->resource->amount,
            "created_at" => $this->resource->created_at->format("Y-m-d h:i A"),
            "pagos" => $this->resource->caja_payments->map(function($caja_payment) {
                $payment = $caja_payment->proforma_payment;

                return [
                    "id" => $caja_payment->id,
                    "amount_edit" => $caja_payment->amount,
                    "method_payment_id" => optional($payment)->method_payment_id,
                    "banco_id" => optional($payment)->banco_id,
                    "method_payment" => optional($payment?->method_payment) ? [
                        "id" => optional($payment->method_payment)->id,
                        "name" => optional($payment->method_payment)->name,
                    ] : null,
                    "amount" => optional($payment)->amount,
                    "date_validation" => optional($payment)->date_validation,
                    "n_transaccion" => optional($payment)->n_transaccion,
                    "verification" => optional($payment)->verification,
                    "user_verification" => optional($payment?->user_verific) ? [
                        "id" => optional($payment->user_verific)->id,
                        "full_name" => optional($payment->user_verific)->name . ' ' . optional($payment->user_verific)->surname,
                    ] : null,
                    "imagen" => optional($payment)->vaucher ? env("APP_URL") . "storage/" . $payment->vaucher : null,
                ];
            }),
        ];
    }
}
