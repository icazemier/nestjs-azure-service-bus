import type { ModuleMetadata, FactoryProvider } from '@nestjs/common';
import type { TokenCredential } from '@azure/identity';

/**
 * How to reach the namespace.
 *
 * Either half is complete on its own, so there is no combination of fields
 * that describes a connection the client cannot open.
 */
export type AzureServiceBusConnectionOptions =
  | { connectionString: string }
  | {
      fullyQualifiedNamespace: string;
      /**
       * Defaults to `DefaultAzureCredential`. Passing one explicitly avoids
       * that chain entirely, which matters when an application already has a
       * configured credential and does not want a second one probing the
       * environment, managed identity and the developer's Azure CLI login.
       */
      credential?: TokenCredential;
    };

/**
 * The async form of the connection options.
 *
 * `TInjected` is inferred from the caller's own `useFactory`, so the factory
 * arguments are typed as whatever that application injects instead of being
 * pinned to `ConfigService` — which was never a requirement, only the common
 * case.
 */
export interface AzureServiceBusAsyncOptions<
  TInjected extends readonly unknown[] = readonly unknown[],
> {
  imports?: ModuleMetadata['imports'];
  inject?: FactoryProvider['inject'];
  useFactory: (
    ...args: TInjected
  ) =>
    | AzureServiceBusConnectionOptions
    | Promise<AzureServiceBusConnectionOptions>;
}

/**
 * Which queues this feature module opens senders and receivers for.
 *
 * The names are required at module-definition time because `@Sender(name)` and
 * `@Receiver(name)` take a literal: a queue whose name is only known once an
 * async factory has run can never be reached by either decorator. That is why
 * there is no async counterpart to `forFeature` — see the changelog for 1.0.0.
 */
export interface AzureServiceBusFeatureOptions {
  senders?: readonly string[];
  receivers?: readonly string[];
}
