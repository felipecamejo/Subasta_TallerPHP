<?php
    include 'Vendedor.php';
    include 'Puja.php';

    class Factura {
        private int $id;
        private float $montoTotal;
        private string $condicionesDePago;
        private string $entrega;
        private Vendedor $vendedor;
        private Puja $puja;

        public function __construct(int $id, float $montoTotal, string $condicionesDePago, string $entrega, Vendedor $vendedor, Puja $puja){
            $this->montoTotal = $montoTotal;
            $this->condicionesDePago = $condicionesDePago;
            $this->entrega = $entrega;
            $this->vendedor = $vendedor;
            $this->puja = $puja;
        }
        
        public function getId() {
            return $this->id;
        }

        public function getMontoTotal(){
            return $this->montoTotal;
        }

        public function getCondicionesDePago(){
            return $this->condicionesDePago;
        }

        public function getEntrega(){
            return $this->entrega;
        }
        
        public function getVendedor(): Vendedor {
            return $this->vendedor;
        }

        public function getPuja(): Puja {
            return $this->puja;
        }

        public function setId(int $id){
            $this->id = $id;
        }

        public function setMontoTotal(float $montoTotal){
            $this->montoTotal = $montoTotal;
        }

        public function setCondicionesDePago(string $condicionesDePago){
            $this->condicionesDePago = $condicionesDePago;
        }

        public function setEntrega(string $entrega){
            $this->entrega = $entrega;
        }

        public function setVendedor(Vendedor $vendedor) {
            return $this->vendedor;
        }

        public function setPuja(Puja $puja) {
            return $this->puja;
        }
    }
?>