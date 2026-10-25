const WebSocket = require('ws');
const port = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port });

// Mapeia IDs de dispositivo para suas conexões
const clientes = new Map();

wss.on('connection', (ws, req) => {
  console.log('Novo cliente conectado');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      // Registro do dispositivo (enviado pelo app Flutter)
      if (data.type === 'register') {
        clientes.set(data.deviceMac, ws);
        ws.deviceMac = data.deviceMac;
        console.log(`Dispositivo registrado: ${data.deviceMac}`);
        return;
      }
      
      // O plugin envia mensagens com 'type' (webrtc-offer, webrtc-answer, ice-candidate)
      // e espera que o servidor repasse para o outro dispositivo.
      // O 'target' pode vir do app (ex: o técnico sabe o ID do cliente).
      if (data.target && clientes.has(data.target)) {
        const alvo = clientes.get(data.target);
        if (alvo.readyState === WebSocket.OPEN) {
          alvo.send(message);
          console.log(`Mensagem repassada de ${ws.deviceMac} para ${data.target}`);
        }
      } else if (ws.deviceMac && data.type) {
        // Se não tem target, assume que é para o "outro" dispositivo da sessão.
        // Isso é um fallback simples para a sua demo (funciona com 2 dispositivos).
        clientes.forEach((cliente, mac) => {
          if (cliente !== ws && cliente.readyState === WebSocket.OPEN) {
            cliente.send(message);
            console.log(`Mensagem (sem target) repassada de ${ws.deviceMac} para ${mac}`);
          }
        });
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
