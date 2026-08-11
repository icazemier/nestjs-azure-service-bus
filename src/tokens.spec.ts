import { receiverToken, senderToken } from './tokens.js';

describe('injection tokens', () => {
  it('keeps the queue name exactly as given', () => {
    expect(senderToken('orders')).toBe('AZURE_SERVICE_BUS_SENDER:orders');
    expect(receiverToken('orders')).toBe('AZURE_SERVICE_BUS_RECEIVER:orders');
  });

  // Azure queue names are case sensitive, so `orders` and `Orders` are two
  // different queues. Deriving tokens by upper-casing the name, as this package
  // did before 1.0.0, silently collapsed them onto one provider.
  it('gives queues that differ only in case their own token', () => {
    expect(senderToken('orders')).not.toBe(senderToken('Orders'));
    expect(receiverToken('orders')).not.toBe(receiverToken('Orders'));
  });

  it('never gives a sender and a receiver the same token', () => {
    expect(senderToken('orders')).not.toBe(receiverToken('orders'));
  });

  it('keeps a queue whose name contains the separator distinct', () => {
    expect(senderToken('a:b')).not.toBe(senderToken('a'));
    expect(senderToken('a:b')).not.toBe(receiverToken('b'));
  });
});
