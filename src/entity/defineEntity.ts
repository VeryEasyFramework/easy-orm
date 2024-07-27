import { type ORMField } from "./field/ormField.ts";
import type {
  EntityDef,
  EntityHooks,
  ExtractEntityFields,
  Orm,
} from "./defineEntityTypes.ts";

export function defineEntity<
  Id extends string,
  P extends PropertyKey,
  F extends ORMField<P>[],
  H extends Partial<EntityHooks>,
  AP extends PropertyKey,
  A extends Record<
    AP,
    (
      ...args: any[]
    ) => Promise<void>
  >,
>(entityId: Id, options: {
  label: string;
  fields: F;
  hooks?: H & ThisType<EntityHooks & ExtractEntityFields<F> & A & { orm: Orm }>;
  actions?:
    & A
    & ThisType<A & EntityHooks & ExtractEntityFields<F> & { orm: Orm }>;
}): EntityDef<Id, P, F, AP, A> {
  const output = {
    entityId,
    ...options,
    hooks: {
      beforeSave: options.hooks?.beforeSave || (() => {}),
      afterSave: options.hooks?.afterSave || (() => {}),
      beforeInsert: options.hooks?.beforeInsert || (() => {}),
      afterInsert: options.hooks?.afterInsert || (() => {}),
    } as EntityHooks,
    actions: options.actions || {} as A,
  };
  return output;
}
