<?php

    namespace App\Dtos;

    class DtoDireccion {
        public $latitud;
        public $longitud;
        public $direccionable_id;
        public $direccionable_type;

        public function __construct($latitud, $longitud, $direccionable_id = null, $direccionable_type = null) {
            $this->latitud = $latitud;
            $this->longitud = $longitud;
            $this->direccionable_id = $direccionable_id;
            $this->direccionable_type = $direccionable_type;
        }
    }
?>