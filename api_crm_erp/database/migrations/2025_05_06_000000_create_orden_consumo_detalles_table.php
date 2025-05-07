<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateOrdenConsumoDetallesTable extends Migration
{
    public function up()
    {
        Schema::create('orden_consumo_detalles', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('orden_consumo_id');
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('unit_id');
            $table->decimal('cantidad', 10, 2);
            $table->timestamps();

            $table->foreign('orden_consumo_id')
                ->references('id')->on('ordenes_consumo')
                ->onDelete('cascade');

            $table->foreign('product_id')
                ->references('id')->on('products')
                ->onDelete('restrict');

            $table->foreign('unit_id')
                ->references('id')->on('units')
                ->onDelete('restrict');
        });
    }

    public function down()
    {
        Schema::dropIfExists('orden_consumo_detalles');
    }
}