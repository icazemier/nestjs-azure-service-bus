import { Inject } from '@nestjs/common';
import { receiverToken, senderToken } from '../tokens.js';

/**
 * Injects the sender for `queue`, which must have been registered through
 * `AzureServiceBusModule.forFeature({ senders: [queue] })`.
 */
export const Sender = (queue: string): ReturnType<typeof Inject> =>
  Inject(senderToken(queue));

/**
 * Injects the receiver for `queue`, which must have been registered through
 * `AzureServiceBusModule.forFeature({ receivers: [queue] })`.
 */
export const Receiver = (queue: string): ReturnType<typeof Inject> =>
  Inject(receiverToken(queue));
