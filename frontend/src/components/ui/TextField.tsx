import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

import styles from "./TextField.module.css";

type FieldProps = {
  label: string;
  error?: string;
  hint?: string;
};

type FieldWrapperProps = FieldProps & {
  id: string;
  children: ReactNode;
};

/** Etiqueta + control + mensaje (de error o de ayuda). */
function FieldWrapper({ id, label, error, hint, children }: FieldWrapperProps) {
  return (
    <div className={styles.wrapper}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {children}
      {(error || hint) && (
        <p id={`${id}-message`} className={error ? styles.error : styles.hint}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

function controlProps(id: string, { error, hint }: FieldProps) {
  return {
    id,
    className: [styles.field, error && styles.hasError].filter(Boolean).join(" "),
    "aria-describedby": error || hint ? `${id}-message` : undefined,
    "aria-invalid": error ? true : undefined,
  };
}

export function TextField({ label, error, hint, ...inputProps }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <FieldWrapper id={id} label={label} error={error} hint={hint}>
      <input {...inputProps} {...controlProps(id, { label, error, hint })} />
    </FieldWrapper>
  );
}

export function TextArea({
  label,
  error,
  hint,
  rows = 3,
  ...textareaProps
}: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <FieldWrapper id={id} label={label} error={error} hint={hint}>
      <textarea rows={rows} {...textareaProps} {...controlProps(id, { label, error, hint })} />
    </FieldWrapper>
  );
}

export function SelectField({
  label,
  error,
  hint,
  children,
  ...selectProps
}: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return (
    <FieldWrapper id={id} label={label} error={error} hint={hint}>
      <select {...selectProps} {...controlProps(id, { label, error, hint })}>
        {children}
      </select>
    </FieldWrapper>
  );
}
