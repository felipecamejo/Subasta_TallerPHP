<?php

    include 'Factura.php';
    include 'CasaRemate.php';
    include 'Articulo.php';

    class Vendedor{
        private int $id;
        private String $nombre;
        private array $facturas;
        private array $articulos;
        private array $casasRemate;

        public function __construct(int $id, String $nombre){
            $this->id = $id;
            $this->nombre = $nombre;
            $this->facturas = [];
            $this->articulos = [];
            $this->casasRemate = [];
        }

        public function getId(){
            return $this->id;
        }

        public function getNombre(){
            return $this->nombre; 
        }

        public function getFacturas () {
            return $this->facturas;
        }

        public function getArticulos () {
            return $this->articulos;
        }

        public function getCasasRemate () {
            return $this->casasRemate;
        } 
    
        public function setId(int $id){
            $this->id = $id;
        }

        public function setNombre(String $nombre){
            $this->nombre = $nombre;
        }

        public function setFacturas(array $facturas) {
            $this->facturas = $facturas;
        }

        public function addFacturas(Factura $factura) {
            $this->facturas[] = $factura;
        }

        public function setArticulos(array $articulos) {
            $this->articulos = $articulos;
        }

        public function addArticulos(Articulo $articulo) {
            $this->articulos[] = $articulo;
        }

        public function setCasasremate(array $casasRemate) {
            $this->casasRemate = $casasRemate;
        }

        public function addCasasRemate(CasaRemate $casaRemate) {
            $this->casasRemate[] = $casaRemate;
        }

        
    }
?>