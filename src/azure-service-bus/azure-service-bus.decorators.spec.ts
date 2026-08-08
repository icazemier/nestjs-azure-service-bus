import { Injectable } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { ServiceBusReceiver, ServiceBusSender } from '@azure/service-bus';
import { AzureServiceBusModule } from './azure-service-bus.module.js';
import { Receiver, Sender } from './azure-service-bus.decorators.js';

const CONNECTION_STRING =
  'Endpoint=sb://example.servicebus.windows.net/;SharedAccessKeyName=root;SharedAccessKey=abc123=';

@Injectable()
class OrderService {
  constructor(
    @Sender('orders') readonly sender: ServiceBusSender,
    @Receiver('orders') readonly receiver: ServiceBusReceiver,
    @Sender('Orders') readonly differentlyCasedSender: ServiceBusSender,
  ) {}
}

describe('Sender and Receiver decorators', () => {
  // This is the contract that matters: the token a decorator asks for has to be
  // the token forFeature registered. Before 1.0.0 forFeatureAsync registered
  // array tokens instead, so anything it created was unreachable through these
  // decorators.
  it('inject the sender and receiver registered for the same queue', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        AzureServiceBusModule.forRoot({ connectionString: CONNECTION_STRING }),
        AzureServiceBusModule.forFeature({
          senders: ['orders', 'Orders'],
          receivers: ['orders'],
        }),
      ],
      providers: [OrderService],
    }).compile();

    const service = moduleRef.get(OrderService);

    expect(service.sender.entityPath).toBe('orders');
    expect(service.receiver.entityPath).toBe('orders');
    expect(service.differentlyCasedSender.entityPath).toBe('Orders');

    await moduleRef.close();
  });

  it('fail to resolve a queue that was never registered', async () => {
    @Injectable()
    class Unregistered {
      constructor(@Sender('missing') readonly sender: ServiceBusSender) {}
    }

    await expect(
      Test.createTestingModule({
        imports: [
          AzureServiceBusModule.forRoot({
            connectionString: CONNECTION_STRING,
          }),
          AzureServiceBusModule.forFeature({ senders: ['orders'] }),
        ],
        providers: [Unregistered],
      }).compile(),
    ).rejects.toThrow();
  });
});
