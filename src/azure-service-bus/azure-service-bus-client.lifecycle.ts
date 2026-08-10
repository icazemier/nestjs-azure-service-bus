import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import type { ServiceBusClient } from '@azure/service-bus';
import { AZURE_SERVICE_BUS_CLIENT } from '../tokens.js';

/**
 * Closes the AMQP connection when the application shuts down.
 *
 * Before 1.0.0 nothing ever closed the client, so every sender and receiver
 * kept its link open and a process that called `app.close()` would sit there
 * with a live connection instead of exiting.
 *
 * Closing the client is enough on its own: the Azure SDK documents that
 * `ServiceBusClient.close()` also closes every sender and receiver created
 * from it, so this does not need to track them. Nest calls `onModuleDestroy`
 * on `app.close()`; for signal-driven shutdown the application still has to
 * opt in with `app.enableShutdownHooks()`, which is Nest's own rule and not
 * something this package can decide.
 */
@Injectable()
export class AzureServiceBusClientLifecycle implements OnModuleDestroy {
  constructor(
    @Inject(AZURE_SERVICE_BUS_CLIENT)
    private readonly client: ServiceBusClient,
  ) {}

  async onModuleDestroy(): Promise<void> {
    await this.client.close();
  }
}
