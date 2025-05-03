<?php

    include 'DtoDireccion.php';
    include 'CasaRemate.php';
    include 'Rematador.php';
    include 'Lote.php';

    class Subasta{
        private DateTime $fecha;
        private int $duracionMinutos;
        private DtoDireccion $direccion;
        private Rematador $rematador;
        private CasaRemate $remate;
        private array $lotes;

        function __construct(DateTime $fecha, int $duracionMinutos, DtoDireccion $direccion, Rematador $rematador, CasaRemate $remate) {
            $this->fecha = $fecha;
            $this->duracionMinutos = $duracionMinutos;
            $this->direccion = $direccion;
            $this->rematador = $rematador;
            $this->remate = $remate;
            $this->lotes = [];
        }

        //Getters
        public function getFecha(): DateTime {
            return $this->fecha;
        }

        public function getDuracionNinutos(): int {
            return $this->duracionMinutos;
        }

        public function getDireccion(): DtoDireccion {
            return $this->direccion;
        }

        public function getRemate(): CasaRemate {
            return $this->remate;
        }

        public function getRematador(): Rematador {
            return $this->rematador;
        }

        public function getLotes(): array {
            return $this->lotes;
        }

        // Setters
        public function setDireccion(DtoDireccion $direccion): void {
            $this->direccion = $direccion;
        }

        public function setFecha(DateTime $fecha): void {
            $this->fecha = $fecha;
        }

        public function setDuracionMinutos(int $duracionMinutos): void {
            $this->duracionMinutos = $duracionMinutos;
        }

        public function setCasaRemate(CasaRemate $remate): void {
            $this->remate = $remate;
        }

        public function setRematador(Rematador $rematador): void {
            $this->rematador = $rematador;
        }

        public function setLote(array $lotes): void {
            $this->lotes = $lotes;
        }

        public function addLote(Lote $lote): void {
            $this->lotes[] = $lote;
        }
    }


?>