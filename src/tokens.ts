/**
 * Injection tokens.
 *
 * These are plain strings rather than symbols on purpose. The package ships
 * both an ESM and a CommonJS build, and a consumer that ends up loading both
 * copies would get two distinct symbols for the same concept and a provider
 * that resolves in one half of the application but not the other. String
 * tokens compare equal across both builds.
 *
 * Queue names are interpolated verbatim, without case folding: Azure treats
 * queue names as case sensitive, so `orders` and `Orders` are different queues
 * and must not collapse onto one token.
 */
export const AZURE_SERVICE_BUS_CLIENT = 'AZURE_SERVICE_BUS_CLIENT';

export const AZURE_SERVICE_BUS_ADMIN_CLIENT = 'AZURE_SERVICE_BUS_ADMIN_CLIENT';

export const senderToken = (queue: string): string =>
  `AZURE_SERVICE_BUS_SENDER:${queue}`;

export const receiverToken = (queue: string): string =>
  `AZURE_SERVICE_BUS_RECEIVER:${queue}`;
