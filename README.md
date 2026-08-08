NOTE: Forked repository from: https://github.com/engcfraposo/nestjs-azure-service-bus

This fork is published as `@icazemier/nestjs-azure-service-bus`. All credit for
the original work goes to [engcfraposo](https://github.com/engcfraposo); the
package, its API and its licence are unchanged.

# NestJS Azure Service Bus

[![npm version](https://img.shields.io/npm/v/@icazemier/nestjs-azure-service-bus.svg)](https://www.npmjs.com/package/@icazemier/nestjs-azure-service-bus)
[![license](https://img.shields.io/npm/l/@icazemier/nestjs-azure-service-bus.svg)](https://github.com/icazemier/nestjs-azure-service-bus/blob/main/LICENSE)

A dynamic module for NestJS that provides integration with Azure Service Bus.

## Installation

```bash
npm install @icazemier/nestjs-azure-service-bus
```

## Description

The NestJS Azure Service Bus package allows you to easily integrate Azure Service Bus into your NestJS applications. It provides decorators for injecting Azure Service Bus senders and receivers, as well as a dynamic module for configuring the Azure Service Bus client.

## Usage

### AzureServiceBusModule - Importing the module

To use the Azure Service Bus module, import it into your NestJS application's root module:

```typescript
import { Module } from '@nestjs/common';
import { AzureServiceBusModule } from '@icazemier/nestjs-azure-service-bus';

@Module({
  imports: [
    AzureServiceBusModule.forRoot({
      connectionString: '<your-connection-string>',
    }),
  ],
})
export class AppModule {}
```

Replace `<your-connection-string>` with your Azure Service Bus connection string.

### AzureServiceBusModule - Injecting Senders and Receivers

You can use the `Sender` and `Receiver` decorators provided by the module to inject Azure Service Bus senders and receivers into your classes:

```typescript
import { Injectable } from '@nestjs/common';
import { Sender, Receiver } from '@icazemier/nestjs-azure-service-bus';

@Injectable()
export class MyService {
  constructor(
    @Sender('my-queue') private readonly sender: ServiceBusSender,
    @Receiver('my-queue') private readonly receiver: ServiceBusReceiver,
  ) {}

  // Use the sender and receiver in your methods
}
```

Replace `'my-queue'` with the name of your Azure Service Bus queue.

### AzureServiceBusModule - Configuration Options

The `forRoot` method of the `AzureServiceBusModule` accepts a configuration object with two possible options:

- `connectionString`: The connection string for your Azure Service Bus namespace.
- `fullyQualifiedNamespace`: The fully qualified namespace of your Azure Service Bus namespace.

You can provide either the `connectionString` or the `fullyQualifiedNamespace`, but not both.

### AzureServiceBusModule - Dynamic Module Options

The `forFeature` method of the `AzureServiceBusModule` allows you to configure senders and receivers dynamically. It accepts an options object with two properties:

- `senders`: An array of sender names.
- `receivers`: An array of receiver names.

```typescript
import { Module } from '@nestjs/common';
import { AzureServiceBusModule } from '@icazemier/nestjs-azure-service-bus';

@Module({
  imports: [
    AzureServiceBusModule.forFeature({
      senders: ['queue-example'],
      receivers: ['queue-example'],
    }),
  ],
})
export class QueueModule {}
```

This will create senders and receivers for the specified queues.

```typescript
import { ServiceBusSender } from '@azure/service-bus';
import { Injectable } from '@nestjs/common';
import { Sender } from '@icazemier/nestjs-azure-service-bus';

@Injectable()
export class QueueSenderService {
  constructor(
    @Sender('test-queue') private readonly sender: ServiceBusSender,
  ) {}
  async sendMessage(body: string) {
    await this.sender.sendMessages({ body });
  }
}
```

```typescript
import { ServiceBusReceiver } from '@azure/service-bus';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Receiver } from '@icazemier/nestjs-azure-service-bus';

@Injectable()
export class QueueReceiverService implements OnModuleInit {
  constructor(
    @Receiver('test-queue') private readonly receiver: ServiceBusReceiver,
  ) {}
  onModuleInit() {
    this.receiver.subscribe({
      processMessage: async (message) => {
        console.log(`message.body: ${message.body}`);
      },
      processError: async (args) => {
        console.log(
          `Error occurred with ${args.entityPath} within ${args.fullyQualifiedNamespace}: `,
          args.error,
        );
      },
    });
  }
}
```

```typescript
import { Module } from '@nestjs/common';
import { QueueSenderService } from './queue-sender.service';
import { AzureServiceBusModule } from '@icazemier/nestjs-azure-service-bus';
import { QueueReceiverService } from './queue-receiver.service';

@Module({
  imports: [
    AzureServiceBusModule.forFeature({
      receivers: ['test-queue'],
      senders: ['test-queue'],
    }),
  ],
  providers: [QueueSenderService, QueueReceiverService],
  exports: [QueueSenderService],
})
export class QueueModule {}

```

for another method the `ServiceBusReceiver` and `ServiceBusSender` see the [azure sdk](https://www.npmjs.com/package/@azure/service-bus)

### AzureServiceBusAdminModule - Importing the module

To use the Azure Service Bus Admin module, import it into your NestJS application's root module:

```typescript
import { Module } from '@nestjs/common';
import { AzureServiceBusAdminModule } from '@icazemier/nestjs-azure-service-bus';

@Module({
  imports: [
    AzureServiceBusAdminModule.forRoot({
      connectionString: '<your-connection-string>',
    }),
  ],
})
export class AppModule {}
```

Replace `<your-connection-string>` with your Azure Service Bus connection string.

### AzureServiceBusAdminModule - Injecting Admin decorator

You can use the `Admin` decorator provided by the module to inject Azure Service Bus admin client into your classes:

```typescript
import { Injectable } from '@nestjs/common';
import { Admin } from '@icazemier/nestjs-azure-service-bus';

@Injectable()
export class MyService {
  constructor(
    @Admin() private readonly admin: ServiceBusAdministrationClient,
  ) {}

  async createQueue(queue: string){
    return this.admin.createQueue(queue)
  }
  async createTopic(topic: string){
    return this.admin.createTopic(topic)
  }
  async queueRuntimeProperties(queue: string){
    return this.admin.getQueueRuntimeProperties(queue)
  }
  async deleteQueue(){
    await this.admin.deleteQueue(queue)
  }
  //...
}
```

for another method the `ServiceBusAdministrationClient` see the [azure sdk](https://www.npmjs.com/package/@azure/service-bus)

## Releasing

Releases run on [changesets](https://github.com/changesets/changesets) and
publish on merge — there is no release PR to approve and no version to bump by
hand.

1. Ship a user-facing change with a changeset: `npm run changeset`, committed in
   `.changeset/` alongside the code.
2. Merging into `development` or `main` runs `.github/workflows/release.yml`,
   which applies the pending changesets, commits `chore: version packages` back
   to the branch, publishes, and then asserts that npm actually serves the new
   version.
3. The branch decides the channel: `main` publishes to `latest`, anything else
   to `beta`. `scripts/pre-mode.mjs` handles that, so nobody runs
   `changeset pre enter` / `pre exit`.
4. `package.json` is the version source of truth.

Publishing uses [npm trusted publishing](https://docs.npmjs.com/trusted-publishers)
over OIDC, so the pipeline holds no npm token and every release carries
provenance.

## Support

- For issues or feature requests with this fork, please open an [issue](https://github.com/icazemier/nestjs-azure-service-bus/issues).
- For the original project, see [engcfraposo/nestjs-azure-service-bus](https://github.com/engcfraposo/nestjs-azure-service-bus).

## License

This package is [MIT licensed](https://github.com/engcfraposo/nestjs-azure-service-bus/blob/main/LICENSE).
