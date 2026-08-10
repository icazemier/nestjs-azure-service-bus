import { Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  ServiceBusClient,
  ServiceBusReceiver,
  ServiceBusSender,
} from '@azure/service-bus';
import { AzureServiceBusModule } from './azure-service-bus.module.js';
import {
  AZURE_SERVICE_BUS_CLIENT,
  receiverToken,
  senderToken,
} from '../tokens.js';

// The Azure SDK opens its AMQP links lazily, on the first send or receive, so
// real clients, senders and receivers can be built here without any network.
// That keeps these tests on the real implementation rather than on a mock that
// would only restate it.
const CONNECTION_STRING =
  'Endpoint=sb://example.servicebus.windows.net/;SharedAccessKeyName=root;SharedAccessKey=abc123=';

const NAMESPACE = 'example.servicebus.windows.net';

@Injectable()
class QueueNameSource {
  readonly connectionString = CONNECTION_STRING;
}

@Module({
  providers: [QueueNameSource],
  exports: [QueueNameSource],
})
class SourceModule {}

describe('AzureServiceBusModule', () => {
  describe('forRoot', () => {
    it('provides a client built from a connection string', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [
          AzureServiceBusModule.forRoot({
            connectionString: CONNECTION_STRING,
          }),
        ],
      }).compile();

      const client = moduleRef.get<ServiceBusClient>(AZURE_SERVICE_BUS_CLIENT);

      expect(client).toBeInstanceOf(ServiceBusClient);
      expect(client.fullyQualifiedNamespace).toBe(NAMESPACE);

      await moduleRef.close();
    });

    it('uses the credential it is given for a namespace', async () => {
      const credential = {
        getToken: () =>
          Promise.resolve({
            token: 'token',
            expiresOnTimestamp: Date.now() + 60_000,
          }),
      };

      const moduleRef = await Test.createTestingModule({
        imports: [
          AzureServiceBusModule.forRoot({
            fullyQualifiedNamespace: NAMESPACE,
            credential,
          }),
        ],
      }).compile();

      const client = moduleRef.get<ServiceBusClient>(AZURE_SERVICE_BUS_CLIENT);

      expect(client.fullyQualifiedNamespace).toBe(NAMESPACE);

      await moduleRef.close();
    });

    // Before 1.0.0 the client was built with `useValue`, inside the static
    // method, so merely describing the module opened a connection and a bad
    // connection string threw while the module graph was being assembled.
    it('builds nothing until the module is instantiated', () => {
      expect(() =>
        AzureServiceBusModule.forRoot({
          connectionString: 'not-a-connection-string',
        }),
      ).not.toThrow();
    });

    it('surfaces a bad connection string when the module starts', async () => {
      await expect(
        Test.createTestingModule({
          imports: [
            AzureServiceBusModule.forRoot({
              connectionString: 'not-a-connection-string',
            }),
          ],
        }).compile(),
      ).rejects.toThrow();
    });

    it('is global, so the client reaches modules that do not import it', () => {
      const definition = AzureServiceBusModule.forRoot({
        connectionString: CONNECTION_STRING,
      });

      expect(definition.global).toBe(true);
    });
  });

  describe('forRootAsync', () => {
    it('builds the client from an injected dependency', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [
          AzureServiceBusModule.forRootAsync({
            imports: [SourceModule],
            inject: [QueueNameSource],
            useFactory: (source: QueueNameSource) => ({
              connectionString: source.connectionString,
            }),
          }),
        ],
      }).compile();

      const client = moduleRef.get<ServiceBusClient>(AZURE_SERVICE_BUS_CLIENT);

      expect(client.fullyQualifiedNamespace).toBe(NAMESPACE);

      await moduleRef.close();
    });

    it('awaits a factory that resolves asynchronously', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [
          AzureServiceBusModule.forRootAsync({
            useFactory: () =>
              Promise.resolve({ connectionString: CONNECTION_STRING }),
          }),
        ],
      }).compile();

      expect(
        moduleRef.get<ServiceBusClient>(AZURE_SERVICE_BUS_CLIENT),
      ).toBeInstanceOf(ServiceBusClient);

      await moduleRef.close();
    });
  });

  describe('forFeature', () => {
    it('exposes a sender and a receiver per queue', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [
          AzureServiceBusModule.forRoot({
            connectionString: CONNECTION_STRING,
          }),
          AzureServiceBusModule.forFeature({
            senders: ['orders'],
            receivers: ['invoices'],
          }),
        ],
      }).compile();

      expect(
        moduleRef.get<ServiceBusSender>(senderToken('orders')).entityPath,
      ).toBe('orders');
      expect(
        moduleRef.get<ServiceBusReceiver>(receiverToken('invoices')).entityPath,
      ).toBe('invoices');

      await moduleRef.close();
    });

    it('keeps queues that differ only in case apart', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [
          AzureServiceBusModule.forRoot({
            connectionString: CONNECTION_STRING,
          }),
          AzureServiceBusModule.forFeature({ senders: ['orders', 'Orders'] }),
        ],
      }).compile();

      expect(
        moduleRef.get<ServiceBusSender>(senderToken('orders')).entityPath,
      ).toBe('orders');
      expect(
        moduleRef.get<ServiceBusSender>(senderToken('Orders')).entityPath,
      ).toBe('Orders');

      await moduleRef.close();
    });

    it('registers nothing when given no queues', () => {
      const definition = AzureServiceBusModule.forFeature({});

      expect(definition.providers).toHaveLength(0);
      expect(definition.exports).toHaveLength(0);
    });

    // A feature module that leaked into every other module would publish one
    // feature's senders application-wide; only forRoot is global.
    it('is not global', () => {
      expect(
        AzureServiceBusModule.forFeature({ senders: ['orders'] }).global,
      ).toBeUndefined();
    });
  });

  describe('shutdown', () => {
    it('closes the client when the application closes', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [
          AzureServiceBusModule.forRoot({
            connectionString: CONNECTION_STRING,
          }),
        ],
      }).compile();

      const client = moduleRef.get<ServiceBusClient>(AZURE_SERVICE_BUS_CLIENT);
      const close = jest.spyOn(client, 'close');

      await moduleRef.close();

      expect(close).toHaveBeenCalledTimes(1);
    });
  });
});
