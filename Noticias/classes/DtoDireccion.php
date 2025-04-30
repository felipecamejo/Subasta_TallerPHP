<?php

class DtoDireccion {
    private string $calle1;
    private string $calle2;
    private int $numero;
    private string $ciudad;
    private string $pais;

    public function __construct(string $calle1, string $calle2, int $numero, string $ciudad, string $pais) {
        $this->calle1 = $calle1;
        $this->calle2 = $calle2;
        $this->numero = $numero;
        $this->ciudad = $ciudad;
        $this->pais = $pais;
    }
    
    public function getCalle1(): string {
        return $this->calle1;
    }

    public function getCalle2(): string {
        return $this->calle2;
    }

    public function getNumero(): int {
        return $this->numero;
    }

    public function getCiudad(): string {
        return $this->ciudad;
    }

    public function getPais(): string {
        return $this->pais;
    }
}


?>