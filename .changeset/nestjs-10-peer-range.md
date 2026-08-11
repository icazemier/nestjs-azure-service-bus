---
'@icazemier/nestjs-azure-service-bus': minor
---

Accept NestJS 10.3.2 and newer alongside 11 in the `@nestjs/common` peer range.

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
