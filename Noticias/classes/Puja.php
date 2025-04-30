<?php

    include 'Factura.php';
    include 'Cliente.php';
    include 'Lote.php';

    class Puja{
        private int $id;
        private DateTime $fechaHora;
        private float $monto;
        private Factura $factura;
        private Lote $lote;
        private Cliente $cliente;

        public function __construct(int $id, DateTime $fechaHora, float $monto, Factura $factura, Lote $lote, Cliente $cliente){
            $this->id = $id;
            $this->fechaHora = $fechaHora;
            $this->monto = $monto;
            $this->factura = $factura;
            $this->lote = $lote;
            $this->cliente = $cliente;
        }

        public function getId(){
            return $this->id;
        }
        
        public function getFechaHora(){
            return $this->fechaHora;
        }

        public function getMonto(){
            return $this->monto;
        }

        public function getFactura(){
            return $this->factura;
        }

        public function getLote() {
            return $this->lote;
        }

        public function getCliente() {
            return $this->cliente;
        }

        public function setId(int $id){
            $this->id = $id;
        }

        public function setFechaHora(DateTime $fechaHora){
            $this->fechaHora = $fechaHora;
        }

        public function setMonto(float $monto){
            $this->monto = $monto;
        }

        public function setFactura(Factura $factura){
            $this->factura = $factura;
        }

        public function setCliente(Cliente $cliente){
            $this->cliente = $cliente;
        }

        public function setLote(Lote $lote){
            $this->lote = $lote;
        }
    }
?>