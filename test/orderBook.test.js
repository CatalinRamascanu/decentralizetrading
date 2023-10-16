const OrderBook = require('../src/orderBook');

describe('OrderBook', () => {
    let orderBook;

    beforeEach(() => {
        orderBook = new OrderBook();
    });

    test('adds buy order correctly', () => {
        const order = { type: 'buy', price: 100, amount: 5 };
        orderBook.addOrder(order);
        expect(orderBook.buyOrders).toContainEqual(order);
    });

    test('adds sell order correctly', () => {
        const order = { type: 'sell', price: 100, amount: 5 };
        orderBook.addOrder(order);
        expect(orderBook.sellOrders).toContainEqual(order);
    });

    test('matches orders correctly', () => {
        const buyOrder = { type: 'buy', price: 100, amount: 5 };
        const sellOrder = { type: 'sell', price: 100, amount: 3 };

        orderBook.addOrder(buyOrder);
        const match = orderBook.matchOrder(sellOrder);

        expect(match).not.toBeNull();
        expect(match.tradedAmount).toBe(3);
        expect(buyOrder.amount).toBe(2);
    });
});
