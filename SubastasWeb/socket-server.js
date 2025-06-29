const { createServer } = require('http');
const { Server } = require('socket.io');
const Redis = require('ioredis');

const server = createServer();
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: false
  },
  allowEIO3: true
});

// Configuración de Redis para Docker
const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
};

console.log('🔧 Configuración Redis:', redisConfig);
const redis = new Redis(redisConfig);

redis.on('connect', () => {
  console.log('✅ Conectado a Redis');
});

redis.on('error', (err) => {
  console.error('❌ Error de Redis:', err);
});

// Suscribirse a múltiples canales
const channels = ['canal-mensajes', 'pujas_channel'];
redis.subscribe(...channels, (err, count) => {
  if (err) {
    console.error('❌ Error suscribiendo a canales:', err);
  } else {
    console.log(`🟢 Suscrito a ${count} canales: ${channels.join(', ')}`);
  }
});

// También suscribirse dinámicamente a canales de lotes específicos
redis.psubscribe('lote_*_pujas', (err, count) => {
  if (err) {
    console.error('❌ Error suscribiendo a canales de lotes:', err);
  } else {
    console.log('🟢 Suscrito a patrones de canales de lotes');
  }
});

redis.on('message', (channel, message) => {
  try {
    const data = JSON.parse(message);
    console.log(`📨 Evento recibido en ${channel}:`, data.tipo || data.event);
    
    // Manejar diferentes tipos de eventos
    if (channel === 'pujas_channel' || channel.includes('_pujas')) {
      // Evento de puja - enviar a todos los clientes conectados
      io.emit('nueva_puja', data);
      console.log(`💰 Puja transmitida - Lote: ${data.puja?.lote_id}, Monto: ${data.puja?.monto}`);
    } else if (channel === 'canal-mensajes') {
      // Evento de mensaje/chat
      io.emit(data.event, data.data);
    }
  } catch (error) {
    console.error('❌ Error parseando mensaje:', error);
  }
});

// Manejar eventos de patrones (lote_*_pujas)
redis.on('pmessage', (pattern, channel, message) => {
  try {
    const data = JSON.parse(message);
    console.log(`📨 Evento de patrón ${pattern} en ${channel}:`, data.tipo || data.event);
    
    // Extraer el ID del lote del nombre del canal
    const loteId = channel.match(/lote_(\d+)_pujas/)?.[1];
    if (loteId) {
      // Enviar evento específico del lote
      io.emit(`puja_lote_${loteId}`, data);
      console.log(`💰 Puja específica transmitida - Lote ${loteId}: ${data.puja?.monto}`);
    }
  } catch (error) {
    console.error('❌ Error parseando mensaje de patrón:', error);
  }
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Agregar eventos de conexión para debug
io.on('connection', (socket) => {
  console.log('🔗 Cliente conectado:', socket.id);
  
  socket.on('disconnect', (reason) => {
    console.log('❌ Cliente desconectado:', socket.id, 'Razón:', reason);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor WebSocket Redis escuchando en ${HOST}:${PORT}`);
  console.log(`🌐 Socket.IO disponible en http://${HOST}:${PORT}`);
});
