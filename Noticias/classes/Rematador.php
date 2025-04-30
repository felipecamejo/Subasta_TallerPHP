<?php

include 'Usuario.php';
include 'DtoDireccion.php';
include 'Subasta.php';
include 'CasaRemate.php';

class Rematador extends Usuario {
    private string $matricula;
    private array $casasRemate;
    private array $subastas;

    public function __construct(string $nombre, string $cedula, string $email, string $telefono, DtoDireccion $direccionFiscal, string $imagen, string $matricula) {
        parent::__construct($nombre, $cedula, $email, $telefono, $direccionFiscal, $imagen);
        $this->matricula = $matricula;
        $this->casasRemate = [];
        $this->subastas = [];
    }

    public function getMatricula(): string {
        return $this->matricula;
    }

    public function getCasasRemate(): array {
        return $this->casasRemate;
    }

    public function getSubastas(): array {
        return $this->subastas;
    }

    public function setMatricula(string $matricula): void {
        $this->matricula = $matricula;
    }

    public function setSubasta(array $subastas): void {
        $this->subastas = $subastas;
    }

    public function addSubasta(Subasta $subasta): void {
        $this->subasta[] = $subasta;
    }

    public function setCasasRemate(array $casasRemate): void {
        $this->casasRemate = $casasRemate;
    }

    public function addCasasRemate(CasaRemate $casaRemate): void {
        $this->casasRemate[] = $casaRemate;
    }
}