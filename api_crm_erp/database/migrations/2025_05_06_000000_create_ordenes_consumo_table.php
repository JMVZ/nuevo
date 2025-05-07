<?php
// Migración: ordenes_consumo
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateOrdenesConsumoTable extends Migration
{
    public function up()
    {
        Schema::create('ordenes_consumo', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('proforma_id'); // ID del proyecto
            $table->string('descripcion')->nullable();
            $table->timestamps();

            $table->foreign('proforma_id')
                ->references('id')->on('proformas')
                ->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('ordenes_consumo');
    }
}
