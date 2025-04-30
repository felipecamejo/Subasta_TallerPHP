<?php
// Requiere hace que se detenga el codigo cuando da error a diferencia de include.
require 'DtoDireccion.php';

class CasaRemate {
    private string $nombre;
    private string $idFiscal;
    private DtoDireccion $direccion;
    private string $email;
    private string $telefono;
    private float $calificacion;
    private array $subastas = [];

    private array $rematadores = [];
    // Falta el get y set rematadores

    //Get´s
    public function getNombre(): string {
        return $this->nombre;
    }

    public function getIdFiscal(): string {
        return $this->idFiscal;
    }

    public function getEmail(): string {
        return $this->email;
    }

    public function getTelefono(): string {
        return $this->telefono;
    }

    public function getCalificacion(): float {
        return $this->calificacion;
    }

    public function getDireccion(): DtoDireccion {
        return $this->direccion;
    }

    public function getSubastas(): array {
        return $this->subastas;
    }

    // Setters
    public function setNombre(string $nombre): void {
        $this->nombre = $nombre;
    }

    public function setIdFiscal(string $idFiscal): void {
        $this->idFiscal = $idFiscal;
    }

    public function setEmail(string $email): void {
        $this->email = $email;
    }

    public function setTelefono(string $telefono): void {
        $this->telefono = $telefono;
    }

    public function setCalificacion(string $calificacion): void {
        $this->calificacion = $calificacion;
    }

    public function setDireccion(DtoDireccion $direccion): void {
        $this->direccion = $direccion;
    }

    // Es necesario tener un set y un add? 
    public function setSubastas(array $subastas): void {
        $this->subastas = $subastas;
    }

    public function addSubasta(Subasta $subastas): void {
        $this->subastas[] = $subastas;
    }


}

?>