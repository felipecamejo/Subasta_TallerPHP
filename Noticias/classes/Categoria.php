<?php
    class Categoria {
        
        private string $nombre;
        private array $categoriasPadre;
        private array $articulos;

        public function __construct(string $nombre, array $categoriasPadre, array $articulos) {
            $this->nombre = $nombre;
            $this->categorias = $categoriasPadre;
            $this->articulos = $articulos;
        }

        //Getters
        public function getNombre(): string {
            return $this->nombre;
        }

        public function getCategoriasPadre(): array {
            return $this->categoriasPadre;
        }

        public function getArticulos(): array {
            return $this->articulos;
        }

        //Setters
        public function setNombre(string $nombre): void {
            $this->nombre = $nombre;
        }

        public function setCategoriasPadre(array $categoriasPadre): void {
            $this->categoriasPadre = $categoriasPadre;
        }

        public function setArticulos(array $articulos): void {
            $this->articulos = $articulos;
        }

    }


?>