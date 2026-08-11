import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ServiceBusAdministrationClient } from '@azure/service-bus';
import { DefaultAzureCredential } from '@azure/identity';
import type {
  AzureServiceBusAsyncOptions,
  AzureServiceBusConnectionOptions,
} from '../options.js';
import { AZURE_SERVICE_BUS_ADMIN_CLIENT } from '../tokens.js';

const createAdminClient = (
  options: AzureServiceBusConnectionOptions,
): ServiceBusAdministrationClient =>
  'connectionString' in options
    ? new ServiceBusAdministrationClient(options.connectionString)
    : new ServiceBusAdministrationClient(
        options.fullyQualifiedNamespace,
        options.credential ?? new DefaultAzureCredential(),
      );

/**
 * The management client, for creating and inspecting queues, topics and
 * subscriptions.
 *
 * It speaks HTTP rather than AMQP and holds no connection, so unlike
 * `AzureServiceBusModule` there is nothing here to close on shutdown.
 */
@Module({})
export class AzureServiceBusAdminModule {
  static forRoot(options: AzureServiceBusConnectionOptions): DynamicModule {
    const adminClientProvider: Provider = {
      provide: AZURE_SERVICE_BUS_ADMIN_CLIENT,
      useFactory: (): ServiceBusAdministrationClient =>
        createAdminClient(options),
    };

    return {
      module: AzureServiceBusAdminModule,
      global: true,
      providers: [adminClientProvider],
      exports: [AZURE_SERVICE_BUS_ADMIN_CLIENT],
    };
  }

  static forRootAsync<TInjected extends readonly unknown[]>(
    options: AzureServiceBusAsyncOptions<TInjected>,
  ): DynamicModule {
    const adminClientProvider: Provider = {
      provide: AZURE_SERVICE_BUS_ADMIN_CLIENT,
      useFactory: async (
        ...args: TInjected
      ): Promise<ServiceBusAdministrationClient> =>
        createAdminClient(await options.useFactory(...args)),
      inject: options.inject ?? [],
    };

    return {
      module: AzureServiceBusAdminModule,
      global: true,
      imports: options.imports ?? [],
      providers: [adminClientProvider],
      exports: [AZURE_SERVICE_BUS_ADMIN_CLIENT],
    };
  }
}
