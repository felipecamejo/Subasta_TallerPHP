<?php

namespace App\DTOs;

use App\DTOs\DtoUsuario;

class DtoCliente{
    public $id;
    public $usuario;
    public $calificacion;

    /** @var DtoPuja[] */
    public array $pujas;

    /** @var DtoNotificacion[] */
    public array $notificaciones;
    public function __construct($id, $calificacion, $pujas, $notificaciones, $usuario){ 
        $this->id = $id;
        $this->usuario = $usuario;
        $this->calificacion = $calificacion;
        $this->pujas = $pujas;
        $this->notificaciones = $notificaciones;
    }

    public function toArray(): array {
        return [
            'id' => $this->id,
            'usuario' => $this->usuario,
            'calificacion' => $this->calificacion,
            'pujas' => array_map(function($puja) {
                return $puja->toArray();
            }, $this->pujas),
            'notificaciones' => array_map(function($notificacion) {
                return $notificacion->toArray();
            }, $this->notificaciones)
        ];
    }
}