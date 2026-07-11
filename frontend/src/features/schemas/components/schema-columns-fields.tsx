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
      <div className="mt-5 rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Formats attendus</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <FormatBadge className="bg-sky-500/10 text-sky-700 dark:text-sky-300" label="Texte" value="toute valeur" />
          <FormatBadge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" label="Nombre entier" value="2024" />
          <FormatBadge className="bg-lime-500/10 text-lime-700 dark:text-lime-300" label="Nombre decimal" value="1250.75" />
          <FormatBadge className="bg-violet-500/10 text-violet-700 dark:text-violet-300" label="Booleen" value="true/false, 1/0, yes/no" />
          <FormatBadge className="bg-amber-500/10 text-amber-700 dark:text-amber-300" label="Date" value="YYYY-MM-DD" />
          <FormatBadge className="bg-rose-500/10 text-rose-700 dark:text-rose-300" label="Date et heure" value="YYYY-MM-DDTHH:mm:ss.sssZ" />
        </div>
      </div>

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

function FormatBadge({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${className}`}>
      <span className="font-medium">{label}</span>
      <span className="opacity-80">{value}</span>
    </span>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}
