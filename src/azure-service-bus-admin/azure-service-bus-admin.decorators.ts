import { Inject } from '@nestjs/common';
import { AZURE_SERVICE_BUS_ADMIN_CLIENT } from '../tokens.js';

/**
 * Injects the `ServiceBusAdministrationClient` registered by
 * `AzureServiceBusAdminModule.forRoot` or `forRootAsync`.
 */
export const Admin = (): ReturnType<typeof Inject> =>
  Inject(AZURE_SERVICE_BUS_ADMIN_CLIENT);
