---
'@icazemier/nestjs-azure-service-bus': minor
---

Accept NestJS 10 alongside 11 in the `@nestjs/common` peer range.

The module only touches `Module`, `DynamicModule`, `Provider`, `Inject`,
`Injectable`, `OnModuleDestroy`, `ModuleMetadata` and `FactoryProvider`, none of
which changed between the two majors, so pinning the peer to 11 excluded
applications that had no technical reason to be excluded. CI now type-checks and
tests against the bottom of the range as well as the top, so the claim is
enforced rather than asserted.
