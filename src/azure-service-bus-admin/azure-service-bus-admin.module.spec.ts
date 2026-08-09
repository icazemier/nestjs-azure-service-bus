import { Injectable } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ServiceBusAdministrationClient } from '@azure/service-bus';
import { AzureServiceBusAdminModule } from './azure-service-bus-admin.module.js';
import { Admin } from './azure-service-bus-admin.decorators.js';
import { AZURE_SERVICE_BUS_ADMIN_CLIENT } from '../tokens.js';

const CONNECTION_STRING =
  'Endpoint=sb://example.servicebus.windows.net/;SharedAccessKeyName=root;SharedAccessKey=abc123=';

@Injectable()
class QueueAdminService {
  constructor(@Admin() readonly admin: ServiceBusAdministrationClient) {}
}

describe('AzureServiceBusAdminModule', () => {
  it('provides an administration client', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        AzureServiceBusAdminModule.forRoot({
          connectionString: CONNECTION_STRING,
        }),
      ],
    }).compile();

    expect(moduleRef.get(AZURE_SERVICE_BUS_ADMIN_CLIENT)).toBeInstanceOf(
      ServiceBusAdministrationClient,
    );

    await moduleRef.close();
  });

  it('injects that client through the Admin decorator', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        AzureServiceBusAdminModule.forRoot({
          connectionString: CONNECTION_STRING,
        }),
      ],
      providers: [QueueAdminService],
    }).compile();

    expect(moduleRef.get(QueueAdminService).admin).toBeInstanceOf(
      ServiceBusAdministrationClient,
    );

    await moduleRef.close();
  });

  it('builds the client from an async factory', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        AzureServiceBusAdminModule.forRootAsync({
          useFactory: () =>
            Promise.resolve({ connectionString: CONNECTION_STRING }),
        }),
      ],
    }).compile();

    expect(moduleRef.get(AZURE_SERVICE_BUS_ADMIN_CLIENT)).toBeInstanceOf(
      ServiceBusAdministrationClient,
    );

    await moduleRef.close();
  });

  it('builds nothing until the module is instantiated', () => {
    expect(() =>
      AzureServiceBusAdminModule.forRoot({
        connectionString: 'not-a-connection-string',
      }),
    ).not.toThrow();
  });
});
