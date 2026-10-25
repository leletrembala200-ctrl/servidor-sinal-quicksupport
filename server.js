const WebSocket = require('ws');
const port = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port });

const clientes = new Map();

wss.on('connection', (ws, req) => {
    // Extrai o deviceMac direto da URL: /remote/{deviceMac}?token=...
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/');
    const deviceMac = pathParts[pathParts.length - 1];

    if (deviceMac) {
        ws.deviceMac = deviceMac;
        clientes.set(deviceMac, ws);
        console.log(`Dispositivo registrado: ${deviceMac}`);
    }

    ws.on('message', (message) => {
        try {
            // Repassa a mensagem para o "outro" dispositivo conectado
            clientes.forEach((cliente, mac) => {
                if (cliente !== ws && cliente.readyState === WebSocket.OPEN) {
                    cliente.send(message);
                    console.log(`Mensagem repassada de ${ws.deviceMac} para ${mac}`);
                }
            });
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
