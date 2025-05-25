const { createServer } = require('http');
const { Server } = require('socket.io');
const Redis = require('ioredis');

const server = createServer();
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

const redis = new Redis(); // Usa 127.0.0.1:6379 por defecto

redis.subscribe('canal-mensajes', () => {
  console.log('🟢 Suscrito a canal-mensajes...');
});

redis.on('message', (channel, message) => {
  const data = JSON.parse(message);
  console.log(`📨 Evento recibido: ${data.event}`, data.data);
  io.emit(data.event, data.data);
});

server.listen(3000, () => {
  console.log('🚀 Servidor WebSocket escuchando en puerto 3000');
});
