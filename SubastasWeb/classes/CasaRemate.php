<?php
    include 'DtoDireccion.php';
    include 'Subasta.php';

    class CasaRemate {
        private string $nombre;
        private string $idFiscal;
        private DtoDireccion $direccion;
        private string $email;
        private string $telefono;
        private float $calificacion;
        private array $subastas;
        private array $rematadores;
        
        function __construct(string $nombre, string $idFiscal, DtoDireccion $direccion, string $email, string $telefono, float $calificacion) {
            $this->nombre = $nombre;
            $this->idFiscal = $idFiscal;
            $this->direccion = $direccion;
            $this->email = $email;
            $this->calificacion = $calificacion;
            $this->telefono = $telefono;
            $this->rematadores = [];
            $this->subastas = [];
        }

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

        public function getRematadores(): array {
            return $this->rematadores;
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

        public function setSubastas(array $subastas): void {
            $this->subastas = $subastas;
        }

        public function addSubasta(Subasta $subastas): void {
            $this->subastas[] = $subastas;
        }


    }

?>