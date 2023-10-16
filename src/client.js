'use strict';

const { PeerRPCClient, PeerRPCServer } = require('grenache-nodejs-http');
const Link = require('grenache-nodejs-link');
const OrderBook = require('./orderBook');
const readline = require('readline');

class Client {
    constructor() {
        this.link = new Link({
            grape: 'http://127.0.0.1:30001'
        });
        this.link.start();

        this.peer = new PeerRPCClient(this.link, {});
        this.peer.init();

        this.orderBook = new OrderBook();

        this.server = new PeerRPCServer(this.link, { timeout: 300000 });
        this.server.init();
        const port = 1024 + Math.floor(Math.random() * 1000);
        this.service = this.server.transport('server');
        this.clientId = 'client_' + Date.now();
        this.clientExecutedTrades = [];

        this.service.listen(port);
        this.link.announce(this.clientId, this.service.port, {});

        this.service.on('request', (rid, key, payload, handler) => {
            this.handleIncomingOrders(payload, handler);
        });

        console.log('Client is starting...');

        this.registerWithServer();
        this.sendHeartbeatPing();
        this.initPrompt();
    }

    handleIncomingOrders(payload, handler) {
        switch (payload.action) {
            case 'ping':
                handler.reply(null, { msg: 'pong' });
                return;
            case 'tradeExecuted':
                const trade = payload.trade;
                this.orderBook.updateWithTrade(trade);
                handler.reply(null, { msg: 'Trade applied to order book' });
                return;
        }

        // Skip if this order is from the same client
        if (payload.clientId === this.clientId) {
            handler.reply(null, { msg: 'Order added to my order book' });
            return;
        }

        const match = this.orderBook.matchOrder(payload);
        if (match) {
            const trade = {
                buyOrder: match.buyOrder,
                sellOrder: match.sellOrder,
                tradedAmount: match.tradedAmount,
                remainingOrder: match.remainingOrder
            };
            this.clientExecutedTrades.push(trade);
            // console.log('Trade executed:', trade);

            // Notify other clients of the trade
            const tradeNotification = {
                action: 'tradeExecuted',
                trade: trade,
                clientId: this.clientId
            };

            this.peer.request('rpc_test', tradeNotification, { timeout: 10000 }, (err, data) => {
                if (err) {
                    console.error("Error notifying trade to other clients", err);
                    return;
                }
            });
        }

        handler.reply(null, { msg: 'Order processing completed' });
    }

    registerWithServer() {
        const registrationMessage = {
            action: 'register',
            serviceName: this.clientId,
            port: this.service.port
        };

        this.peer.request('rpc_test', registrationMessage, { timeout: 10000 }, (err, data) => {
            if (err) {
                console.log("Error registering with server");
                console.error(err);
                return;
            }
            // console.log('Successfully registered with server.');
        });
    }

    // We send a ping to make sure we don't get disconnected due to inactivity on the client side
    sendHeartbeatPing() {
        setInterval(() => {
            const pingMessage = {
                action: 'ping',
                clientId: this.clientId
            };
            this.peer.request('rpc_test', pingMessage, { timeout: 10000 }, (err, data) => {
                if (err) {
                    console.log("Error sending heartbeat ping");
                    console.error(err);
                    return;
                }
            });
        }, 1000);
    }

    sendOrder(order) {
        order.clientId = this.clientId;
        this.orderBook.addOrder(order);  // Add own orders to the order book

        this.peer.request('rpc_test', order, { timeout: 10000 }, (err, data) => {
            if (err) {
                console.log("Error sending order");
                console.error(err);
                return;
            }
            // console.log('Order sent successfully.');
        });
    }


    initPrompt() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const prompt = () => {
            rl.question('Enter command: ', (input) => {
                const args = input.split(' ');
                const command = args[0];

                switch(command) {
                    case 'buy':
                        if(args.length < 3) {
                            console.log('Please provide amount and price');
                            break;
                        }
                        this.sendOrder({ type: 'buy', price: parseFloat(args[2]), amount: parseFloat(args[1]) });
                        break;

                    case 'sell':
                        if(args.length < 3) {
                            console.log('Please provide amount and price');
                            break;
                        }
                        this.sendOrder({ type: 'sell', price: parseFloat(args[2]), amount: parseFloat(args[1]) });
                        break;

                    case 'display':
                        console.log('Order Book:', this.orderBook);
                        console.log('Trade History:', this.clientExecutedTrades);
                        break;

                    case 'help':
                        console.log(`
                Available Commands:
                - buy <amount> <price>: Place a buy order with the specified amount and price.
                - sell <amount> <price>: Place a sell order with the specified amount and price.
                - display: Show the current state of the order book and trade history.
                - help: Display the list of available commands.
                - exit: Close the client.
                `);
                        break;

                    case 'exit':
                        rl.close();
                        process.exit(0);
                        break;

                    default:
                        console.log('Unknown command. Try again.');
                        break;
                }

                // Prompt again
                prompt();
            });
        };

        // Start the prompt for the first time
        prompt();
    }
}

new Client(); // Create a new Client instance to start it
