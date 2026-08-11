# NestJS Azure Service Bus

[![npm version](https://img.shields.io/npm/v/@icazemier/nestjs-azure-service-bus.svg)](https://www.npmjs.com/package/@icazemier/nestjs-azure-service-bus)
[![license](https://img.shields.io/npm/l/@icazemier/nestjs-azure-service-bus.svg)](https://github.com/icazemier/nestjs-azure-service-bus/blob/main/LICENSE)

Inject Azure Service Bus senders, receivers and the administration client
straight into your NestJS providers.

**This is a maintained fork** of
[engcfraposo/nestjs-azure-service-bus](https://github.com/engcfraposo/nestjs-azure-service-bus),
which has had no release since September 2023. All credit for the original
design goes to [engcfraposo](https://github.com/engcfraposo); this fork keeps
the same idea and the same MIT licence, on NestJS 10 and 11 with a clean
dependency tree.

## Requirements

- Node.js 22 or newer
- NestJS 10.3.2 or newer, or 11

## Installation

```bash
npm install @icazemier/nestjs-azure-service-bus @azure/service-bus @azure/identity
```

The NestJS, Azure and `reflect-metadata` packages are peer dependencies, so your
application decides their versions and this package cannot pull a second copy of
NestJS into your tree. A Nest application already provides `@nestjs/common` and
`reflect-metadata`.

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

`forRoot` takes either a connection string or a namespace, never both:

- `connectionString`: the connection string for your Azure Service Bus namespace.
- `fullyQualifiedNamespace`: the namespace, for example `example.servicebus.windows.net`, plus an optional `credential`.

When you pass a namespace without a `credential`, a `DefaultAzureCredential` is
created for you. Pass one explicitly when your application already has a
configured credential, so that chain does not probe the environment, managed
identity and your local Azure CLI login a second time:

```typescript
import { Module } from '@nestjs/common';
import { ManagedIdentityCredential } from '@azure/identity';
import { AzureServiceBusModule } from '@icazemier/nestjs-azure-service-bus';

@Module({
  imports: [
    AzureServiceBusModule.forRoot({
      fullyQualifiedNamespace: 'example.servicebus.windows.net',
      credential: new ManagedIdentityCredential(),
    }),
  ],
})
export class AppModule {}
```

### AzureServiceBusModule - Configuring asynchronously

`forRootAsync` builds the same options from whatever your application injects.
The factory arguments are typed from your own `useFactory`, so anything you list
in `inject` is what you get:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AzureServiceBusModule } from '@icazemier/nestjs-azure-service-bus';

@Module({
  imports: [
    AzureServiceBusModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connectionString: config.getOrThrow('SERVICE_BUS_CONNECTION_STRING'),
      }),
    }),
  ],
})
export class AppModule {}
```

`AzureServiceBusAdminModule.forRootAsync` takes the same shape.

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

## Shutting down

The client is closed for you when the Nest application closes, which also closes
every sender and receiver created from it. Calling `app.close()` is enough; to
have a `SIGTERM` or `SIGINT` reach that path, enable Nest's shutdown hooks as
usual:

```typescript
const app = await NestFactory.create(AppModule);
app.enableShutdownHooks();
```

## Migrating from 0.x

The 1.0.0 release fixes the parts of the original design that could not work as
intended. If you used 0.x:

- **`forFeatureAsync` is gone.** It registered its senders and receivers under
  two array tokens rather than one token per queue, so nothing it created could
  ever be reached by `@Sender(name)` or `@Receiver(name)` — those need a name
  that is already a literal in your source. Use `forFeature` with the queue
  names and `forRootAsync` for the connection, which is the part that genuinely
  needs to be resolved at runtime.
- **Queue names are no longer upper-cased** to derive injection tokens. Azure
  queue names are case sensitive, so `orders` and `Orders` used to collapse onto
  one provider. Nothing changes for you unless you relied on that collision.
- **The client is created when the module is instantiated**, not while the
  module graph is being described. A bad connection string now fails at startup
  instead of at import time.
- **`@nestjs/common`, `@azure/service-bus`, `@azure/identity` and
  `reflect-metadata` became peer dependencies**, and `@nestjs/core`,
  `@nestjs/config`, `@nestjs/platform-express` and `rxjs` are no longer
  dependencies at all. Installing this package no longer pulls Express into your
  application.
- **Only the root module is global.** `forFeature` modules are scoped to
  whatever imports them, instead of publishing one feature's senders
  application-wide.

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

This package is [MIT licensed](https://github.com/icazemier/nestjs-azure-service-bus/blob/main/LICENSE).

The licence file carries two copyright lines, and both stay: the original
notice for [engcfraposo](https://github.com/engcfraposo), who wrote the code
this fork is built on, alongside the one for the fork itself. MIT requires the
original notice to travel with the work, and the credit is owed regardless.
