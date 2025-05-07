<?php

  //  include 'Usuario.php';
 //   include 'DtoDireccion.php';
  //  include 'Puja.php';

    class Cliente extends Usuario {
        private array $notificaciones;
        private float $calificacion;
        private array $pujas;

        public function __construct(string $nombre, string $cedula, string $email, string $telefono, DtoDireccion $direccionFiscal, string $imagen, array $notificaciones, float $calificacion) {
            parent::__construct($nombre, $cedula, $email, $telefono, $direccionFiscal, $imagen);
            $this->notificaciones = $notificaciones;
            $this->calificacion = $calificacion;
            $this->pujas = [];
        }

        public function getNotificaciones(): array {
            return $this->notificaciones;
        }

        public function getCalificacion(): float {
            return $this->calificacion;
        }

        public function getPujas(): array {
            return $this->pujas;
        }

        public function setNotificaciones(array $notificaciones): void {
            $this->notificaciones = $notificaciones;
        }
        
        public function setCalificacion(float $calificacion): void {
            $this->calificacion = $calificacion;
        }

        public function setPujas(array $pujas): void {
            $this->pujas = $pujas;
        }

        public function addPujas(Puja $puja): void {
            $this->pujas[] = $puja;
        }

}