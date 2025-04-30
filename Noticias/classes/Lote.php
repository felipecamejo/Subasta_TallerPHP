<?php
    include 'Articulo.php';
    //incluir puja
    class Lote {
            private float $valorBase;
            private float $pujaMinima;
            private array $articulos;
            private array $pujas;

            function __construct(float $valorBase, float $pujaMinima) {
                $this->valorBase = $valorBase;
                $this->pujaMinima = $pujaMinima;
                $this->articulos = [];
                $this->pujas = [];
            }

            // Getters
            public function getValorBase(): float{
                return $this->valorBase;
            }

            public function getPujaMinima(): float{
                return $this->pujaMinima;
            }

            public function getArticulos(): array{
                return $this->articulos;
            }

            public function getPujas(): array{
                return $this->pujas;
            }

            // Setters
            public function setValorBase(float $valorBase): void{
                $this->valorBase = $valorBase;
            }

            public function setPujaMinima(float $pujaMinima): void{
                $this->pujaMinima = $pujaMinima;
            }

            public function setArticulos(array $articulos): void{
                $this->articulos = $articulos;
            }

            public function addArticulos(Articulo $articulo): void{
                $this->articulos[] = $articulo;
            }

            public function setPujas(array $pujas): void{
                $this->pujas = $pujas;
            }

            public function addPujas(Puja $puja): void{
                $this->pujas[] = $puja;
            }

        }

?>