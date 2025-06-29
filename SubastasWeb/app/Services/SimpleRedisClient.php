<?php

namespace App\Services;

use Exception;

class SimpleRedisClient
{
    private $host;
    private $port;
    private $socket;
    private $timeout;

    public function __construct($host = '127.0.0.1', $port = 6379, $timeout = 5)
    {
        $this->host = $host;
        $this->port = $port;
        $this->timeout = $timeout;
    }

    private function connect()
    {
        if (!$this->socket) {
            $this->socket = @fsockopen($this->host, $this->port, $errno, $errstr, $this->timeout);
            if (!$this->socket) {
                throw new Exception("Could not connect to Redis: $errstr ($errno)");
            }
        }
    }

    private function sendCommand($command)
    {
        $this->connect();
        
        // Enviar comando usando protocolo RESP
        fwrite($this->socket, $command);
        
        // Leer respuesta
        $response = fgets($this->socket);
        
        if ($response === false) {
            throw new Exception("Failed to read Redis response");
        }
        
        return $this->parseResponse($response);
    }

    private function parseResponse($response)
    {
        if (!$response) {
            return null;
        }
        
        $type = $response[0];
        $data = trim(substr($response, 1));
        
        switch ($type) {
            case '+': // Simple string
                return $data;
            case '-': // Error
                throw new Exception("Redis error: $data");
            case ':': // Integer
                return (int) $data;
            case '$': // Bulk string
                $length = (int) $data;
                if ($length === -1) {
                    return null;
                }
                if ($length === 0) {
                    fread($this->socket, 2); // Read \r\n
                    return '';
                }
                $bulk = fread($this->socket, $length + 2); // +2 for \r\n
                return substr($bulk, 0, -2); // Remove \r\n
            case '*': // Array
                $count = (int) $data;
                if ($count === -1) {
                    return null;
                }
                $array = [];
                for ($i = 0; $i < $count; $i++) {
                    $array[] = $this->parseResponse(fgets($this->socket));
                }
                return $array;
            default:
                throw new Exception("Unknown Redis response type: $type");
        }
    }

    public function set($key, $value)
    {
        $command = "*3\r\n$3\r\nSET\r\n$" . strlen($key) . "\r\n$key\r\n$" . strlen($value) . "\r\n$value\r\n";
        return $this->sendCommand($command);
    }

    public function get($key)
    {
        $command = "*2\r\n$3\r\nGET\r\n$" . strlen($key) . "\r\n$key\r\n";
        return $this->sendCommand($command);
    }

    public function hset($hash, $field, $value)
    {
        $command = "*4\r\n$4\r\nHSET\r\n$" . strlen($hash) . "\r\n$hash\r\n$" . strlen($field) . "\r\n$field\r\n$" . strlen($value) . "\r\n$value\r\n";
        return $this->sendCommand($command);
    }

    public function hget($hash, $field)
    {
        $command = "*3\r\n$4\r\nHGET\r\n$" . strlen($hash) . "\r\n$hash\r\n$" . strlen($field) . "\r\n$field\r\n";
        return $this->sendCommand($command);
    }

    public function hmset($hash, $fields)
    {
        $parts = ["*" . (count($fields) * 2 + 2) . "\r\n", "$5\r\nHMSET\r\n", "$" . strlen($hash) . "\r\n$hash\r\n"];
        
        foreach ($fields as $field => $value) {
            $parts[] = "$" . strlen($field) . "\r\n$field\r\n";
            $parts[] = "$" . strlen($value) . "\r\n$value\r\n";
        }
        
        $command = implode('', $parts);
        return $this->sendCommand($command);
    }

    public function hmget($hash, $fields)
    {
        $parts = ["*" . (count($fields) + 2) . "\r\n", "$5\r\nHMGET\r\n", "$" . strlen($hash) . "\r\n$hash\r\n"];
        
        foreach ($fields as $field) {
            $parts[] = "$" . strlen($field) . "\r\n$field\r\n";
        }
        
        $command = implode('', $parts);
        return $this->sendCommand($command);
    }

    public function zadd($key, $score, $member)
    {
        $command = "*4\r\n$4\r\nZADD\r\n$" . strlen($key) . "\r\n$key\r\n$" . strlen($score) . "\r\n$score\r\n$" . strlen($member) . "\r\n$member\r\n";
        return $this->sendCommand($command);
    }

    public function zrange($key, $start, $stop, $withScores = false)
    {
        if ($withScores) {
            $command = "*5\r\n$6\r\nZRANGE\r\n$" . strlen($key) . "\r\n$key\r\n$" . strlen($start) . "\r\n$start\r\n$" . strlen($stop) . "\r\n$stop\r\n$10\r\nWITHSCORES\r\n";
        } else {
            $command = "*4\r\n$6\r\nZRANGE\r\n$" . strlen($key) . "\r\n$key\r\n$" . strlen($start) . "\r\n$start\r\n$" . strlen($stop) . "\r\n$stop\r\n";
        }
        return $this->sendCommand($command);
    }

    public function zrevrange($key, $start, $stop, $withScores = false)
    {
        if ($withScores) {
            $command = "*5\r\n$9\r\nZREVRANGE\r\n$" . strlen($key) . "\r\n$key\r\n$" . strlen($start) . "\r\n$start\r\n$" . strlen($stop) . "\r\n$stop\r\n$10\r\nWITHSCORES\r\n";
        } else {
            $command = "*4\r\n$9\r\nZREVRANGE\r\n$" . strlen($key) . "\r\n$key\r\n$" . strlen($start) . "\r\n$start\r\n$" . strlen($stop) . "\r\n$stop\r\n";
        }
        return $this->sendCommand($command);
    }

    public function zcard($key)
    {
        $command = "*2\r\n$5\r\nZCARD\r\n$" . strlen($key) . "\r\n$key\r\n";
        return $this->sendCommand($command);
    }

    public function sadd($key, $member)
    {
        $command = "*3\r\n$4\r\nSADD\r\n$" . strlen($key) . "\r\n$key\r\n$" . strlen($member) . "\r\n$member\r\n";
        return $this->sendCommand($command);
    }

    public function scard($key)
    {
        $command = "*2\r\n$5\r\nSCARD\r\n$" . strlen($key) . "\r\n$key\r\n";
        return $this->sendCommand($command);
    }

    public function expire($key, $seconds)
    {
        $command = "*3\r\n$6\r\nEXPIRE\r\n$" . strlen($key) . "\r\n$key\r\n$" . strlen($seconds) . "\r\n$seconds\r\n";
        return $this->sendCommand($command);
    }

    public function publish($channel, $message)
    {
        $command = "*3\r\n$7\r\nPUBLISH\r\n$" . strlen($channel) . "\r\n$channel\r\n$" . strlen($message) . "\r\n$message\r\n";
        return $this->sendCommand($command);
    }

    public function eval($script, $numKeys, ...$args)
    {
        $parts = ["*" . (count($args) + 3) . "\r\n", "$4\r\nEVAL\r\n", "$" . strlen($script) . "\r\n$script\r\n", "$" . strlen($numKeys) . "\r\n$numKeys\r\n"];
        
        foreach ($args as $arg) {
            $parts[] = "$" . strlen($arg) . "\r\n$arg\r\n";
        }
        
        $command = implode('', $parts);
        return $this->sendCommand($command);
    }

    public function ping()
    {
        $command = "*1\r\n$4\r\nPING\r\n";
        return $this->sendCommand($command);
    }

    public function keys($pattern)
    {
        $command = "*2\r\n$4\r\nKEYS\r\n$" . strlen($pattern) . "\r\n$pattern\r\n";
        return $this->sendCommand($command);
    }

    public function del($key)
    {
        $command = "*2\r\n$3\r\nDEL\r\n$" . strlen($key) . "\r\n$key\r\n";
        return $this->sendCommand($command);
    }

    public function __destruct()
    {
        if ($this->socket) {
            fclose($this->socket);
        }
    }
}
