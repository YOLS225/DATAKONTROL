import { Trash2 } from 'lucide-react';
import type {
  FieldArrayWithId,
  FieldErrors,
  UseFieldArrayRemove,
  UseFormRegister,
} from 'react-hook-form';
import { schemaColumnTypes } from '@/features/schemas/constants/schema-column-types';
import type { SchemaVersionFormData } from '@/features/schemas/schemas/schema-version-schema';

export function SchemaColumnsFields({
  fields,
  register,
  remove,
  errors,
  readonly = false,
}: {
  fields: Array<FieldArrayWithId<SchemaVersionFormData, 'columns', 'id'>>;
  register: UseFormRegister<SchemaVersionFormData>;
  remove: UseFieldArrayRemove;
  errors: FieldErrors<SchemaVersionFormData>;
  readonly?: boolean;
}) {
  return (
    <>
      <div className="mt-5 overflow-hidden rounded-lg border">
        <div className="hidden grid-cols-[minmax(140px,1fr)_minmax(140px,1fr)_150px_110px_44px] gap-3 border-b bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground lg:grid">
          <span>Identifiant</span>
          <span>Nom colonne</span>
          <span>Type</span>
          <span>Requise</span>
          <span />
        </div>

        {fields.map((field, index) => (
          <div
            className="border-b bg-background p-3 last:border-b-0"
            key={field.id}
          >
            <div className="grid gap-3 lg:grid-cols-[minmax(140px,1fr)_minmax(140px,1fr)_150px_110px_44px] lg:items-start">
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground lg:sr-only">Identifiant</span>
                <input className="dk-input mt-1 lg:mt-0" placeholder="customer-email" {...register(`columns.${index}.id`)} />
                {errors.columns?.[index]?.id && <FieldError message={errors.columns[index]?.id?.message} />}
              </label>
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground lg:sr-only">Nom colonne</span>
                <input className="dk-input mt-1 lg:mt-0" placeholder="email" {...register(`columns.${index}.name`)} />
                {errors.columns?.[index]?.name && <FieldError message={errors.columns[index]?.name?.message} />}
              </label>
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground lg:sr-only">Type</span>
                <select className="dk-input mt-1 lg:mt-0" {...register(`columns.${index}.type`)}>
                  {schemaColumnTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex h-10 items-center gap-2 text-sm lg:justify-center">
                <input className="size-4" type="checkbox" {...register(`columns.${index}.required`)} />
                <span className="lg:sr-only">Colonne requise</span>
              </label>
              {!readonly && fields.length > 1 ? (
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border text-sm hover:bg-muted"
                  onClick={() => remove(index)}
                  title="Retirer la colonne"
                  type="button"
                >
                  <Trash2 className="size-4" />
                  <span className="lg:sr-only">Retirer</span>
                </button>
              ) : (
                <span className="hidden lg:block" />
              )}
            </div>
          </div>
        ))}
      </div>

      {errors.columns?.root?.message && <FieldError message={errors.columns.root.message} />}
    </>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}
