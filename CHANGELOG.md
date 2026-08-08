# @icazemier/nestjs-azure-service-bus

## 0.0.23-beta.0

### Patch Changes

- 6fc943f: Raise the minimum accepted versions of `@nestjs/common`, `@nestjs/core`,
  `@nestjs/platform-express`, `@nestjs/config` and `@azure/identity` to releases
  that carry no known advisories.

  A lockfile only protects this repository's own installs; consumers resolve these
  ranges themselves, so the floors are what actually decides whether an
  application built on this package can end up on a vulnerable NestJS or Azure
  Identity release.
