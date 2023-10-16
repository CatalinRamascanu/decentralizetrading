'use strict';

const { PeerRPCServer, PeerRPCClient } = require('grenache-nodejs-http');
const Link = require('grenache-nodejs-link');

class Server {
    constructor() {
        this.link = new Link({
            grape: 'http://127.0.0.1:30001'
        });
        this.link.start();

        this.peerServer = this.initPeerServer(this.link);
        this.peerClient = this.initPeerClient(this.link);

        this.port = 1040;
        this.service = this.peerServer.transport('server');
        this.service.listen(this.port);

        this.announceService(this.link, this.service);
        this.clients = this.initClientManagement(this.peerClient);

        this.service.on('request', (rid, key, payload, handler) => {
            this.handleRequest(this.peerClient, this.clients, payload, handler);
        });

        console.log('Server is starting...');
    }

    initPeerServer(link) {
        const server = new PeerRPCServer(link, { timeout: 300000 });
        server.init();
        return server;
    }

    initPeerClient(link) {
        const client = new PeerRPCClient(link, {});
        client.init();
        return client;
    }

    announceService(link, service) {
        setInterval(() => {
            link.announce('rpc_test', service.port, {}, () => {});
        }, 1000);
    }

    initClientManagement(peerClient) {
        const clients = [];

        setInterval(() => {
            clients.forEach((client, index) => {
                peerClient.request(client, { action: 'ping' }, { timeout: 10000 }, (err, data) => {
                    if (err) {
                        console.error(`Client ${client} is unreachable, removing from the list.`);
                        clients.splice(index, 1);
                    }
                });
            });
        }, 1000);

        return clients;
    }

    handleRequest(peerClient, clients, payload, handler) {
        switch (payload.action) {
            case 'register':
                clients.push(payload.serviceName);
                console.log('Client registered:', payload.serviceName);
                handler.reply(null, { msg: 'Client registered' });
                break;

            case 'ping':
                handler.reply(null, { msg: 'pong' });
                break;

            case 'tradeExecuted':
                clients
                    .filter(client => client !== payload.clientId)
                    .forEach(client => {
                        console.log(`Forwarding trade from ${payload.clientId} to :`, client);
                        peerClient.request(client, payload, { timeout: 10000 }, (err, data) => {
                            if (err) console.error(`Failed to send trade notification to client: ${client}`);
                            else console.log(data);
                        });
                    });
                handler.reply(null, { msg: 'Trade notification forwarded to clients' });
                break;

            default:
                this.forwardOrderToClients(peerClient, clients, payload, handler);
        }
    }

    forwardOrderToClients(peerClient, clients, payload, handler) {
        clients.forEach(client => {
            if (payload.clientId !== client) {
                console.log(`Forwarding order from ${payload.clientId} to :`, client);
                peerClient.request(client, payload, { timeout: 10000 }, (err, data) => {
                    if (err) console.error(`Failed to send order to client: ${client}`);
                    else console.log(data);
                });
            }
        });
        handler.reply(null, { msg: 'Order forwarded to clients' });
    }
}

new Server(); // Creating an instance of the server to start it
