import { Trash2 } from 'lucide-react';
import type {
  Control,
  FieldArrayWithId,
  FieldErrors,
  UseFieldArrayRemove,
  UseFormRegister,
} from 'react-hook-form';
import type { ReactNode } from 'react';
import { useWatch } from 'react-hook-form';
import { schemaColumnTypes } from '@/features/schemas/constants/schema-column-types';
import type { SchemaVersionFormData } from '@/features/schemas/schemas/schema-version-schema';
import type { SchemaColumnType } from '@/features/schemas/types/schema-version';

const columnTypeStyles: Record<
  SchemaColumnType,
  {
    accent: string;
    constraints: string;
    title: string;
    badge: string;
  }
> = {
  string: {
    accent: 'bg-sky-500',
    constraints: 'border-sky-500/20 bg-sky-500/5',
    title: 'text-sky-700 dark:text-sky-300',
    badge: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  },
  integer: {
    accent: 'bg-emerald-500',
    constraints: 'border-emerald-500/20 bg-emerald-500/5',
    title: 'text-emerald-700 dark:text-emerald-300',
    badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  },
  decimal: {
    accent: 'bg-lime-500',
    constraints: 'border-lime-500/20 bg-lime-500/5',
    title: 'text-lime-700 dark:text-lime-300',
    badge: 'bg-lime-500/10 text-lime-700 dark:text-lime-300',
  },
  boolean: {
    accent: 'bg-violet-500',
    constraints: 'border-violet-500/20 bg-violet-500/5',
    title: 'text-violet-700 dark:text-violet-300',
    badge: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  },
  date: {
    accent: 'bg-amber-500',
    constraints: 'border-amber-500/20 bg-amber-500/5',
    title: 'text-amber-700 dark:text-amber-300',
    badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  },
  datetime: {
    accent: 'bg-rose-500',
    constraints: 'border-rose-500/20 bg-rose-500/5',
    title: 'text-rose-700 dark:text-rose-300',
    badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
  },
};

export function SchemaColumnsFields({
  fields,
  register,
  control,
  remove,
  errors,
  readonly = false,
}: {
  fields: Array<FieldArrayWithId<SchemaVersionFormData, 'columns', 'id'>>;
  register: UseFormRegister<SchemaVersionFormData>;
  control: Control<SchemaVersionFormData>;
  remove: UseFieldArrayRemove;
  errors: FieldErrors<SchemaVersionFormData>;
  readonly?: boolean;
}) {
  const watchedColumns = useWatch({ control, name: 'columns' });

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

        {fields.map((field, index) => {
          const columnType = watchedColumns?.[index]?.type ?? field.type;

          return (
            <div className="border-b bg-background p-3 last:border-b-0" key={field.id}>
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
              <ColumnConstraintsFields
                columnType={columnType}
                errors={errors}
                index={index}
                register={register}
              />
            </div>
          );
        })}
      </div>

      {errors.columns?.root?.message && <FieldError message={errors.columns.root.message} />}
    </>
  );
}

function ColumnConstraintsFields({
  columnType,
  index,
  register,
  errors,
}: {
  columnType: SchemaColumnType;
  index: number;
  register: UseFormRegister<SchemaVersionFormData>;
  errors: FieldErrors<SchemaVersionFormData>;
}) {
  const constraintsErrors = errors.columns?.[index]?.constraints;
  const style = columnTypeStyles[columnType];
  const columnTypeLabel = schemaColumnTypes.find((type) => type.value === columnType)?.label ?? columnType;

  return (
    <div className={`mt-4 rounded-md border p-3 ${style.constraints}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`size-2.5 rounded-full ${style.accent}`} />
        <p className={`text-xs font-semibold ${style.title}`}>Contraintes</p>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${style.badge}`}>{columnTypeLabel}</span>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {columnType === 'string' && (
          <>
            <ConstraintField label="Longueur min" error={constraintsErrors?.minLength?.message}>
              <input
                className="dk-input mt-1"
                min={0}
                placeholder="Ex: 2"
                type="number"
                {...register(`columns.${index}.constraints.minLength`)}
              />
            </ConstraintField>
            <ConstraintField label="Longueur max" error={constraintsErrors?.maxLength?.message}>
              <input
                className="dk-input mt-1"
                min={0}
                placeholder="Ex: 255"
                type="number"
                {...register(`columns.${index}.constraints.maxLength`)}
              />
            </ConstraintField>
            <ConstraintField label="Format" error={constraintsErrors?.format?.message}>
              <select className="dk-input mt-1" {...register(`columns.${index}.constraints.format`)}>
                <option value="">Aucun</option>
                <option value="email">Email</option>
                <option value="phone">Telephone</option>
                <option value="url">URL</option>
              </select>
            </ConstraintField>
            <AllowedValuesField error={constraintsErrors?.allowedValues?.message} index={index} register={register} />
          </>
        )}

        {(columnType === 'integer' || columnType === 'decimal') && (
          <>
            <ConstraintField label="Valeur min" error={constraintsErrors?.min?.message}>
              <input
                className="dk-input mt-1"
                placeholder="Ex: 0"
                step={columnType === 'integer' ? 1 : 'any'}
                type="number"
                {...register(`columns.${index}.constraints.min`)}
              />
            </ConstraintField>
            <ConstraintField label="Valeur max" error={constraintsErrors?.max?.message}>
              <input
                className="dk-input mt-1"
                placeholder="Ex: 120"
                step={columnType === 'integer' ? 1 : 'any'}
                type="number"
                {...register(`columns.${index}.constraints.max`)}
              />
            </ConstraintField>
            <AllowedValuesField error={constraintsErrors?.allowedValues?.message} index={index} register={register} />
          </>
        )}

        {(columnType === 'date' || columnType === 'datetime') && (
          <>
            <ConstraintField label="Date min" error={constraintsErrors?.minDate?.message}>
              <input
                className="dk-input mt-1"
                type={columnType === 'datetime' ? 'datetime-local' : 'date'}
                {...register(`columns.${index}.constraints.minDate`)}
              />
            </ConstraintField>
            <ConstraintField label="Date max" error={constraintsErrors?.maxDate?.message}>
              <input
                className="dk-input mt-1"
                type={columnType === 'datetime' ? 'datetime-local' : 'date'}
                {...register(`columns.${index}.constraints.maxDate`)}
              />
            </ConstraintField>
            <AllowedValuesField error={constraintsErrors?.allowedValues?.message} index={index} register={register} />
          </>
        )}

        {columnType === 'boolean' && (
          <AllowedValuesField error={constraintsErrors?.allowedValues?.message} index={index} register={register} />
        )}
      </div>
    </div>
  );
}

function ConstraintField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
      {error && <FieldError message={error} />}
    </label>
  );
}

function AllowedValuesField({
  index,
  register,
  error,
}: {
  index: number;
  register: UseFormRegister<SchemaVersionFormData>;
  error?: string;
}) {
  return (
    <ConstraintField label="Valeurs autorisees" error={error}>
      <input
        className="dk-input mt-1"
        placeholder="Ex: actif, inactif"
        {...register(`columns.${index}.constraints.allowedValues`)}
      />
    </ConstraintField>
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
