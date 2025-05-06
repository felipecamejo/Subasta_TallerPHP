<?php
    namespace App\Models;
    use App\Models\DtoDireccion;
use DtoDireccion as GlobalDtoDireccion;
use Rematador;
use Subasta;

    class CasaRemate extends Model{


        protected $table = 'casa_remate'; 

        protected $fillable = [ 
            'nombre', 
            'idFiscal', 
            'email', 
            'telefono', 
            'calificacion'
        ]; 

        protected $hidden = []; // Columnas ocultas en las respuestas JSON

        public function rematadores() {
            return $this->belongsToMany(Rematador::class, 'casa_remate_rematador', 'casa_remate_id', 'rematador_id');
        }

        public function subastas() {
            return $this->belongsToMany(Subasta::class, 'casa_remate_subasta', 'casa_remate_id', 'subasta_id');
        }

        public function direccion() {
            return $this->hasOne(DtoDireccion::class);
        }

    }

?>