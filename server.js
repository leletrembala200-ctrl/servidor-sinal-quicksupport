const WebSocket = require('ws');
const port = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port });

const clientes = new Map();

wss.on('connection', (ws) => {
  console.log('Novo cliente conectado');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'register') {
        clientes.set(data.deviceMac, ws);
        ws.deviceMac = data.deviceMac;
        console.log(`Dispositivo registrado: ${data.deviceMac}`);
      }
      
      if (data.target && clientes.has(data.target)) {
        const alvo = clientes.get(data.target);
        if (alvo.readyState === WebSocket.OPEN) {
          alvo.send(message);
        }
      }
    } catch (e) {
      console.error('Erro ao processar mensagem:', e);
    }
  });

  ws.on('close', () => {
    if (ws.deviceMac) {
      clientes.delete(ws.deviceMac);
      console.log(`Dispositivo desconectado: ${ws.deviceMac}`);
    }
  });
});

console.log(`Servidor de sinalização rodando na porta ${port}`);