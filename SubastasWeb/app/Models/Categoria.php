<?php
    namespace App\Models;

    use Illuminate\Database\Eloquent\Model;
    use App\Models\Articulo;

    class Categoria extends Model{
        protected $table = 'categorias'; // Nombre de la tabla si es diferente al plural de la clase

        protected $fillable = [ 
            'nombre',
            'categoria_padre_id',
        ]; 

        protected $hidden = []; // Columnas ocultas en las respuestas JSON

        public function categoriaPadre(){
            return $this->belongsTo(Categoria::class, 'categoria_padre_id');
        }

        public function categoriasHijas(){
            return $this->hasMany(Categoria::class, 'categoria_padre_id');
        }

        public function articulos() {
            return $this->hasMany(Articulo::class);
        }

    }


?>