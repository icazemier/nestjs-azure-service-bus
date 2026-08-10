import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ServiceBusClient } from '@azure/service-bus';
import { DefaultAzureCredential } from '@azure/identity';
import type {
  AzureServiceBusAsyncOptions,
  AzureServiceBusConnectionOptions,
  AzureServiceBusFeatureOptions,
} from '../options.js';
import {
  AZURE_SERVICE_BUS_CLIENT,
  receiverToken,
  senderToken,
} from '../tokens.js';
import { AzureServiceBusClientLifecycle } from './azure-service-bus-client.lifecycle.js';

const createClient = (
  options: AzureServiceBusConnectionOptions,
): ServiceBusClient =>
  'connectionString' in options
    ? new ServiceBusClient(options.connectionString)
    : new ServiceBusClient(
        options.fullyQualifiedNamespace,
        options.credential ?? new DefaultAzureCredential(),
      );

@Module({})
export class AzureServiceBusModule {
  /**
   * Registers the client for the whole application.
   *
   * The connection is opened by a factory rather than a `useValue`, so it is
   * established when Nest instantiates the provider instead of while the
   * module graph is still being described. Before 1.0.0 a call to `forRoot`
   * opened an AMQP connection as a side effect of evaluating the module
   * metadata, which meant importing a module was enough to connect.
   */
  static forRoot(options: AzureServiceBusConnectionOptions): DynamicModule {
    const clientProvider: Provider = {
      provide: AZURE_SERVICE_BUS_CLIENT,
      useFactory: (): ServiceBusClient => createClient(options),
    };

    return {
      module: AzureServiceBusModule,
      // Only the root registration is global. The class-level @Global() this
      // replaces also made every forFeature module global, which published
      // one feature's senders to the entire application.
      global: true,
      providers: [clientProvider, AzureServiceBusClientLifecycle],
      exports: [AZURE_SERVICE_BUS_CLIENT],
    };
  }

  static forRootAsync<TInjected extends readonly unknown[]>(
    options: AzureServiceBusAsyncOptions<TInjected>,
  ): DynamicModule {
    const clientProvider: Provider = {
      provide: AZURE_SERVICE_BUS_CLIENT,
      useFactory: async (...args: TInjected): Promise<ServiceBusClient> =>
        createClient(await options.useFactory(...args)),
      inject: options.inject ?? [],
    };

    return {
      module: AzureServiceBusModule,
      global: true,
      imports: options.imports ?? [],
      providers: [clientProvider, AzureServiceBusClientLifecycle],
      exports: [AZURE_SERVICE_BUS_CLIENT],
    };
  }

  /**
   * Opens senders and receivers for the given queues and exposes each one
   * under its own token, which is what `@Sender` and `@Receiver` resolve.
   */
  static forFeature(options: AzureServiceBusFeatureOptions): DynamicModule {
    const senderProviders: Provider[] = (options.senders ?? []).map(
      (queue) => ({
        provide: senderToken(queue),
        useFactory: (client: ServiceBusClient) => client.createSender(queue),
        inject: [AZURE_SERVICE_BUS_CLIENT],
      }),
    );

    const receiverProviders: Provider[] = (options.receivers ?? []).map(
      (queue) => ({
        provide: receiverToken(queue),
        useFactory: (client: ServiceBusClient) => client.createReceiver(queue),
        inject: [AZURE_SERVICE_BUS_CLIENT],
      }),
    );

    const providers = [...senderProviders, ...receiverProviders];

    return {
      module: AzureServiceBusModule,
      providers,
      exports: providers,
    };
  }
}
