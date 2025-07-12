import { Server } from 'socket.io';

let io = null;
let onlineCount = 0;

export function initSocket(server) {
  if (!io) {
    io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });
    io.on('connection', (socket) => {
      onlineCount++;
      io.emit('user:count', onlineCount);

      // Listen for product events
      socket.on('product:new', (product) => {
        io.emit('product:new', product);
      });
      socket.on('product:remove', (productId) => {
        io.emit('product:remove', productId);
      });

      socket.on('disconnect', () => {
        onlineCount = Math.max(onlineCount - 1, 0);
        io.emit('user:count', onlineCount);
      });
    });
  }
  return io;
}

export function getIO() {
  if (!io) throw new Error('Socket.io not initialized!');
  return io;
} 