class OrderBook {
    constructor() {
        this.buyOrders = [];
        this.sellOrders = [];
    }

    addOrder(order) {
        if (order.type === 'buy') {
            this.buyOrders.push(order);
        } else {
            this.sellOrders.push(order);
        }
    }

    matchOrder(order) {
        const oppositeOrders = order.type === 'buy' ? this.sellOrders : this.buyOrders;

        for (let i = 0; i < oppositeOrders.length; i++) {
            const existingOrder = oppositeOrders[i];

            if (order.type === 'buy' && order.price >= existingOrder.price ||
                order.type === 'sell' && order.price <= existingOrder.price) {

                // Create deep copies of the orders to return their pre-trade state
                const originalOrder = JSON.parse(JSON.stringify(order));
                const originalExistingOrder = JSON.parse(JSON.stringify(existingOrder));

                // Assuming a simple full match for simplicity
                const tradedAmount = Math.min(originalOrder.amount, originalExistingOrder.amount);
                order.amount -= tradedAmount;
                existingOrder.amount -= tradedAmount;

                if (existingOrder.amount === 0) oppositeOrders.splice(i, 1); // Remove fully matched orders

                const remainingOrder = order.amount > 0 ? order : null;

                return {
                    buyOrder: originalOrder.type === 'buy' ? originalOrder : originalExistingOrder,
                    sellOrder: originalOrder.type === 'sell' ? originalOrder : originalExistingOrder,
                    tradedAmount,
                    remainingOrder: remainingOrder  // Return remaining order if any
                };
            }
        }

        // If no match found, add to the appropriate order book
        if (order.type === 'buy') {
            this.buyOrders.push(order);
        } else {
            this.sellOrders.push(order);
        }

        return null;
    }

    updateWithTrade(trade) {
        // Get the buy and sell orders from the trade
        const buyOrder = trade.buyOrder;
        const sellOrder = trade.sellOrder;

        // Update the buy orders in the order book
        this.buyOrders = this.buyOrders.map(order => {
            if(order.clientId === buyOrder.clientId && order.price === buyOrder.price) {
                order.amount = buyOrder.amount;
            }
            return order;
        }).filter(order => order.amount > 0);

        // Update the sell orders in the order book
        this.sellOrders = this.sellOrders.map(order => {
            if(order.clientId === sellOrder.clientId && order.price === sellOrder.price) {
                order.amount = sellOrder.amount;
            }
            return order;
        }).filter(order => order.amount > 0);
    }
}

module.exports = OrderBook;