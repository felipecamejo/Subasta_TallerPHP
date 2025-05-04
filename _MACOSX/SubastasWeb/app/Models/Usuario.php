<?php

    include 'DtoDireccion.php';

    class Usuario {
        private string $nombre;
        private string $cedula;
        private string $email;
        private string $telefono;
        private DtoDireccion $direccionFiscal;
        private string $imagen;

        public function __construct(string $nombre, string $cedula, string $email, string $telefono, DtoDireccion $direccionFiscal, string $imagen) {
            $this->nombre = $nombre;
            $this->cedula = $cedula;
            $this->email = $email;
            $this->telefono = $telefono;
            $this->direccionFiscal = $direccionFiscal;
            $this->imagen = $imagen;
        }

        public function getNombre(): string {
            return $this->nombre;
        }

        public function setNombre(string $nombre): void {
            $this->nombre = $nombre;
        }

        public function getCedula(): string {
            return $this->cedula;
        }

        public function setCedula(string $cedula): void {
            $this->cedula = $cedula;
        }

        public function getEmail(): string {
            return $this->email;
        }

        public function setEmail(string $email): void {
            $this->email = $email;
        }

        public function getTelefono(): string {
            return $this->telefono;
        }

        public function setTelefono(string $telefono): void {
            $this->telefono = $telefono;
        }

        public function getDireccionFiscal(): DtoDireccion {
            return $this->direccionFiscal;
        }

        public function setDireccionFiscal(DtoDireccion $direccionFiscal): void {
            $this->direccionFiscal = $direccionFiscal;
        }

        public function getImagen(): string {
            return $this->imagen;
        }

        public function setImagen(string $imagen): void {
            $this->imagen = $imagen;
        }
}