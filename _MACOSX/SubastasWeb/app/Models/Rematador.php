<?php
    namespace App\Models;
    use Illuminate\Database\Eloquent\Model;
    use App\Models\DtoDireccion;
    use App\Models\Usuario;
    use App\Models\Subasta;
    use App\Models\CasaRemate;

    class Rematador extends Usuario {
        protected $table = 'rematador';

        protected $fillable = [ 
            'matricula', 
        ]; 

        protected $hidden = []; // Columnas ocultas en las respuestas JSON

        public function subastas() {
            return $this->hasMany(Subasta::class);
        }

        public function casasRemate() {
            return $this->hasMany(CasaRemate::class);
        }

        public function __construct(string $nombre, string $cedula, string $email, string $telefono, DtoDireccion $direccionFiscal, string $imagen, string $matricula) {
            parent::__construct($nombre, $cedula, $email, $telefono, $direccionFiscal, $imagen);
            $this->matricula = $matricula;
            $this->casasRemate = [];
            $this->subastas = [];
        }

        public function getMatricula(): string {
            return $this->matricula;
        }

        public function getCasasRemate(): array {
            return $this->casasRemate;
        }

        public function getSubastas(): array {
            return $this->subastas;
        }

        public function setMatricula(string $matricula): void {
            $this->matricula = $matricula;
        }

        public function setSubasta(array $subastas): void {
            $this->subastas = $subastas;
        }

        public function addSubasta(Subasta $subasta): void {
            $this->subastas[] = $subasta;
        }

        public function setCasasRemate(array $casasRemate): void {
            $this->casasRemate = $casasRemate;
        }

        public function addCasasRemate(CasaRemate $casaRemate): void {
            $this->casasRemate[] = $casaRemate;
        }
}