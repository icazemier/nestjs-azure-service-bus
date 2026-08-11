# @icazemier/nestjs-azure-service-bus

## 1.0.0-beta.2

### Minor Changes

- fae1dbb: Accept NestJS 10.3.2 and newer alongside 11 in the `@nestjs/common` peer range.

  The module only touches `Module`, `DynamicModule`, `Provider`, `Inject`,
  `Injectable`, `OnModuleDestroy`, `ModuleMetadata` and `FactoryProvider`, none of
  which changed between the two majors, so pinning the peer to 11 excluded
  applications that had no technical reason to be excluded.

  The floor is 10.3.2 rather than 10.0.0 because `@nestjs/common` only widened its
  own `reflect-metadata` peer to `^0.1.12 || ^0.2.0` in that release. Against
  anything older, this package's `reflect-metadata: ^0.2.0` peer and NestJS
  disagree, and the install cannot resolve.

  CI installs the floor of each major, the newest 10.x, and the newest 11.x from
  the lockfile, then type-checks and runs the suite against each, so the range is
  enforced at its declared edges rather than at whatever a caret happens to
  resolve to today.

## 1.0.0-beta.1

### Major Changes

- 657928d: Rebuild the module around a lifecycle, real injection tokens and peer
  dependencies.

  `forRoot` built its client with `useValue` inside the static method, so
  describing a module opened an AMQP connection and a bad connection string threw
  while the module graph was still being assembled. The client now comes from a
  factory, and a new lifecycle provider closes it on shutdown — which the Azure
  SDK documents as closing every sender and receiver created from it, so an
  application that calls `app.close()` actually exits.

  `forFeatureAsync` is removed. It registered two array tokens while `forFeature`
  registered one per queue, so nothing it created was reachable through `@Sender`
  or `@Receiver`, and it never could be: those take a queue name that is already a
  literal in the caller's source. The async need is on the connection, which
  `forRootAsync` covers.

  Queue names keep their case. Tokens were derived by upper-casing, and Azure
  treats queue names as case sensitive, so `orders` and `Orders` collapsed onto one
  provider.

  Eight runtime dependencies become zero. `@nestjs/common`, `@azure/service-bus`,
  `@azure/identity` and `reflect-metadata` are peer dependencies; `@nestjs/core`,
  `@nestjs/config`, `@nestjs/platform-express` and `rxjs` are gone. Installing this
  no longer puts Express in an application's tree, and there is no second copy of
  NestJS to break DI.

  Only the root module is global now, and the build ships ESM and CommonJS behind
  an exports map.

## 0.0.23-beta.0

### Patch Changes

- 6fc943f: Raise the minimum accepted versions of `@nestjs/common`, `@nestjs/core`,
  `@nestjs/platform-express`, `@nestjs/config` and `@azure/identity` to releases
  that carry no known advisories.

  A lockfile only protects this repository's own installs; consumers resolve these
  ranges themselves, so the floors are what actually decides whether an
  application built on this package can end up on a vulnerable NestJS or Azure
  Identity release.
