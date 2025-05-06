<?php

    include 'DtoDireccion.php';
    include 'CasaRemate.php';
    include 'Rematador.php';
    include 'Lote.php';

    class Subasta extends Model{


        protected $table = 'casa_remate'; 

        protected $fillable = [ 
            'duracionMinutos', 
            'fecha'
        ]; 

        protected $hidden = []; // Columnas ocultas en las respuestas JSON


        public function casaRemate() {
            return $this->hasOne(CasaRemate::class);
        }

        public function rematador() {
            return $this->hasOne(Rematador::class);
        }

        public function direccion() {
            return $this->hasOne(DtoDireccion::class);
        }

    }


?>