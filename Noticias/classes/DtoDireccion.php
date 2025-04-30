<?php

class DtoDireccion {
    private string $calle1;
    private string $calle2;
    private int $numero;

    public function __construct(string $calle1, string $calle2, int $numero) {
        $this->calle1 = $calle1;
        $this->calle2 = $calle2;
        $this->numero = $numero;
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
}


?>