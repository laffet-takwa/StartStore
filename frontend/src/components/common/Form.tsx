import { forwardRef, useId } from 'react'
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { AlertCircle, Check, ChevronDown, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/lib/cn'

/* -------------------------------------------------------------------------- */
/* Field wrapper                                                                */
/* -------------------------------------------------------------------------- */

export interface FieldProps {
  label?: string
  hint?: string
  error?: string
  required?: boolean
  htmlFor?: string
  className?: string
  children: ReactNode
  /** Rendered at the right of the label row, e.g. an "Optional" tag. */
  trailing?: ReactNode
}

export function Field({ label, hint, error, required, htmlFor, className, children, trailing }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <div className="flex items-baseline justify-between gap-2">
          <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
            {label}
            {required && <span className="ml-0.5 text-rose-500">*</span>}
          </label>
          {trailing}
        </div>
      )}
      {children}
      {error ? (
        <p className="flex items-start gap-1.5 text-xs font-medium text-rose-600">
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p className="text-xs text-ink-muted">{hint}</p>
      ) : null}
    </div>
  )
}

const CONTROL_BASE =
  'w-full rounded-xl border bg-white text-sm text-ink placeholder:text-ink-faint transition-all duration-150 ' +
  'focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-ink-faint ' +
  'aria-[invalid=true]:border-rose-400 aria-[invalid=true]:focus:ring-rose-500/30'

const CONTROL_OK = 'border-zinc-300 hover:border-zinc-400 focus:border-brand-500 focus:ring-brand-500/20'
const CONTROL_ERR = 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/30'

function controlClass(invalid?: boolean): string {
  return cn(CONTROL_BASE, invalid ? CONTROL_ERR : CONTROL_OK)
}

/* -------------------------------------------------------------------------- */
/* Input                                                                        */
/* -------------------------------------------------------------------------- */

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  hint?: string
  error?: string
  leadingIcon?: ReactNode
  trailingSlot?: ReactNode
  containerClassName?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, leadingIcon, trailingSlot, className, containerClassName, id, required, ...rest },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  const control = (
    <div className="relative">
      {leadingIcon && (
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint">
          {leadingIcon}
        </span>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={Boolean(error) || undefined}
        className={cn(
          controlClass(Boolean(error)),
          'h-11 px-3.5',
          leadingIcon && 'pl-10',
          trailingSlot && 'pr-11',
          className,
        )}
        {...rest}
      />
      {trailingSlot && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2">{trailingSlot}</span>
      )}
    </div>
  )

  if (!label && !hint && !error) return control

  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      htmlFor={inputId}
      className={containerClassName}
    >
      {control}
    </Field>
  )
})

/* -------------------------------------------------------------------------- */
/* Password                                                                     */
/* -------------------------------------------------------------------------- */

export interface PasswordInputProps extends Omit<InputProps, 'type' | 'trailingSlot'> {
  /** Not shown by default; password managers still work either way. */
  revealByDefault?: boolean
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ revealByDefault = false, ...props }, ref) {
    const [visible, setVisible] = useState(revealByDefault)
    return (
      <Input
        ref={ref}
        type={visible ? 'text' : 'password'}
        autoComplete={props.autoComplete ?? 'current-password'}
        trailingSlot={
          <button
            type="button"
            onClick={() => setVisible((state) => !state)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-zinc-100 hover:text-ink"
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
        {...props}
      />
    )
  },
)

/* -------------------------------------------------------------------------- */
/* Textarea                                                                     */
/* -------------------------------------------------------------------------- */

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
  containerClassName?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, containerClassName, id, required, rows = 4, ...rest },
  ref,
) {
  const generatedId = useId()
  const textareaId = id ?? generatedId

  const control = (
    <textarea
      ref={ref}
      id={textareaId}
      rows={rows}
      aria-invalid={Boolean(error) || undefined}
      className={cn(controlClass(Boolean(error)), 'resize-y px-3.5 py-2.5 leading-relaxed', className)}
      {...rest}
    />
  )

  if (!label && !hint && !error) return control

  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      htmlFor={textareaId}
      className={containerClassName}
    >
      {control}
    </Field>
  )
})

/* -------------------------------------------------------------------------- */
/* Select                                                                       */
/* -------------------------------------------------------------------------- */

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
  error?: string
  options: { value: string; label: string; disabled?: boolean }[]
  placeholder?: string
  containerClassName?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, options, placeholder, className, containerClassName, id, required, ...rest },
  ref,
) {
  const generatedId = useId()
  const selectId = id ?? generatedId

  const control = (
    <div className="relative">
      <select
        ref={ref}
        id={selectId}
        aria-invalid={Boolean(error) || undefined}
        className={cn(
          controlClass(Boolean(error)),
          'h-11 cursor-pointer appearance-none pl-3.5 pr-10',
          className,
        )}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
        aria-hidden
      />
    </div>
  )

  if (!label && !hint && !error) return control

  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      htmlFor={selectId}
      className={containerClassName}
    >
      {control}
    </Field>
  )
})

/* -------------------------------------------------------------------------- */
/* Checkbox                                                                     */
/* -------------------------------------------------------------------------- */

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label: ReactNode
  description?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, description, className, id, checked, ...rest },
  ref,
) {
  const generatedId = useId()
  const checkboxId = id ?? generatedId

  return (
    <label
      htmlFor={checkboxId}
      className={cn(
        'group flex cursor-pointer items-start gap-3 select-none',
        className,
      )}
    >
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          ref={ref}
          id={checkboxId}
          type="checkbox"
          checked={checked}
          className="peer h-[1.125rem] w-[1.125rem] cursor-pointer appearance-none rounded-[6px] border border-zinc-300 bg-white transition-all duration-150 checked:border-brand-600 checked:bg-brand-600 hover:border-zinc-400 checked:hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 focus-visible:ring-offset-2"
          {...rest}
        />
        <Check
          className="pointer-events-none absolute left-0.5 top-0.5 h-3.5 w-3.5 text-white opacity-0 transition-opacity peer-checked:opacity-100"
          strokeWidth={3}
          aria-hidden
        />
      </span>
      <span className="min-w-0">
        <span className="block text-sm text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-ink-muted">{description}</span>}
      </span>
    </label>
  )
})

/* -------------------------------------------------------------------------- */
/* Radio group                                                                  */
/* -------------------------------------------------------------------------- */

export interface RadioOption<T extends string = string> {
  value: T
  label: string
  description?: string
}

export function RadioGroup<T extends string = string>({
  options,
  value,
  onChange,
  className,
}: {
  options: RadioOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}) {
  return (
    <div className={cn('space-y-2', className)} role="radiogroup">
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-150',
              selected
                ? 'border-brand-500 bg-brand-50/60 ring-1 ring-brand-500'
                : 'border-zinc-300 bg-white hover:border-zinc-400 hover:bg-zinc-50',
            )}
          >
            <span
              className={cn(
                'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                selected ? 'border-brand-600' : 'border-zinc-300',
              )}
            >
              {selected && <span className="h-2 w-2 rounded-full bg-brand-600" />}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-ink">{option.label}</span>
              {option.description && (
                <span className="mt-0.5 block text-xs text-ink-muted">{option.description}</span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
