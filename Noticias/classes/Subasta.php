<?php
require 'DtoDireccion.php';
require 'CasaRemate.php';

class Subasta{
    // En el diagrama estaba el atributo tipo subasta pero entiendo que ahora eso
    // es la relacion con Lote, no?
    private DateTime $fecha;
    private int $duracion;
    private DtoDireccion $direccion;
    private CasaRemate $remate;

    //Getters
    public function getFecha(): DateTime {
        return $this->fecha;
    }

    public function getDuracion(): int {
        return $this->duracion;
    }

    public function getDireccion(): DtoDireccion {
        return $this->direccion;
    }

    public function getRemate(): CasaRemate {
        return $this->remate;
    }

    // Setters
    public function setDireccion(DtoDireccion $direccion): void {
        $this->direccion = $direccion;
    }

    public function setFecha(DateTime $fecha): void {
        $this->fecha = $fecha;
    }

    public function setDuracion(int $duracion): void {
        $this->duracion = $duracion;
    }

    public function setCasaRemate(CasaRemate $remate): void {
        $this->remate = $remate;
    }
}


?>