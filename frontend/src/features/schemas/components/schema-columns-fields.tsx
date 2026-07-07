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
      <div className="mt-5 space-y-3">
        {fields.map((field, index) => (
          <div className="rounded-lg border bg-background p-3" key={field.id}>
            <div className="grid gap-3">
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Identifiant</span>
                <input className="dk-input mt-1" placeholder="customer-email" {...register(`columns.${index}.id`)} />
                {errors.columns?.[index]?.id && <FieldError message={errors.columns[index]?.id?.message} />}
              </label>
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Nom colonne</span>
                <input className="dk-input mt-1" placeholder="email" {...register(`columns.${index}.name`)} />
                {errors.columns?.[index]?.name && <FieldError message={errors.columns[index]?.name?.message} />}
              </label>
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Type</span>
                <select className="dk-input mt-1" {...register(`columns.${index}.type`)}>
                  {schemaColumnTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex h-10 items-center gap-2 text-sm">
                <input className="size-4" type="checkbox" {...register(`columns.${index}.required`)} />
                Colonne requise
              </label>
              {!readonly && fields.length > 1 && (
                <button
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md border text-sm hover:bg-muted"
                  onClick={() => remove(index)}
                  type="button"
                >
                  <Trash2 className="size-4" />
                  Retirer
                </button>
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
