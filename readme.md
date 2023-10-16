# Prototype Decentralized Trading Platform

This solution creates a prototype of a decentralized trading platform where each client can place orders and the orders are matched in a decentralized manner. Every client maintains its own order book and matches incoming orders independently. The solution is built using `grenache-nodejs-http`, allowing the creation of a peer-to-peer network of trading clients and a central server that facilitates communication.

## How it Works

### Server Initialization

- **Components Initialization**: The server starts by setting up its peer server and client to handle incoming requests and communications.
- **Service Announcement**: It announces its service periodically to be discoverable by clients.
- **Request Handling**: Handles incoming requests like client registration, ping for availability, and forwarding orders and trades.

### Client Initialization

- **Client Set-Up**: Each client initializes its server and client components and an order book.
- **Registration**: Clients register with the main server for communication.
- **Heartbeat**: Sends a heartbeat ping to the main server to maintain the connection.

### Order Placement and Matching

- **Order Input**: Clients can input orders via the command line. These orders are added to the client’s order book and forwarded to the server.
- **Order Matching**: Clients listen for incoming orders and try to match them with their order book. If a match is found, a trade is executed.

### Trade Execution

- **Trade Notification**: Upon trade execution, the details are sent to all clients so that they can update their order books accordingly.

## Code Structure

### server.js

- Utilizes `grenache-nodejs-http` for a peer-to-peer network.
- Handles client registration, pinging, and order/trade forwarding.
- Maintains a list of connected clients and removes the unreachable ones.

### client.js

- Operates as a peer, placing and matching orders.
- Maintains a heartbeat ping with the main server for constant connectivity.
- Utilizes a command-line interface for placing orders and handling incoming orders.

### orderbook.js

- Manages the client's order book, including buy and sell orders.
- Handles order matching and updates the order book upon trade execution.

### Setting up the Environment

### Install Dependencies:
```bash
npm install
```

Before running the clients and the server, you need to start the `grape` instances for peer-to-peer communication. Execute the following commands:

```sh
grape --dp 20001 --aph 30001 --bn '127.0.0.1:20002'
grape --dp 20002 --aph 40001 --bn '127.0.0.1:20001'
```

## Usage

1. **Start the Server**: Run `node src/server.js` to start the main server.
2. **Start the Clients**: Run `node src/client.js` to start each client. Clients can place orders via the command line.
3. **Place Orders**: Use the command line interface to place buy and sell orders. Type `help` for list of commands available. 
4. **View Order Book**: Type `display` in the command line to view the current state of the order book and trade history.

Limitations and Future Considerations
- 
- **Limited functionality**: It does not cover all cases in syncronizing the order book between clients. And amount updating on orders is not working as expected.
- **Partial Order Matching**: It needs an enhanced mechanism to handle partial order matching.
- **Performance and Scalability**: Optimization is required to handle a large number of clients and orders efficiently.
- **Testing**: Comprehensive testing, including unit, integration and stress testing is necessary to ensure reliability and performance.

## Testing

- **Manual Testing**: The system can be tested manually by starting the server and multiple clients, placing orders, and observing the order matching and trade execution process.
- **Automated Testing**: The `orderBook.test.js` file provides automated testing for the `OrderBook` class, ensuring that buy and sell orders are added correctly and that order matching works as expected.
