import type * as React from 'react'

import { cn } from '#/lib/utils'

function Field({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="field"
      className={cn('space-y-2 data-[invalid=true]:text-destructive', className)}
      {...props}
    />
  )
}

function FieldLabel({ className, ...props }: React.ComponentProps<'label'>) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: Consumers pass htmlFor when binding this shared field label.
    <label
      data-slot="field-label"
      className={cn('mono-label block text-muted-foreground', className)}
      {...props}
    />
  )
}

function FieldError({
  className,
  errors,
  ...props
}: React.ComponentProps<'p'> & {
  errors?: Array<{ message?: string }>
}) {
  const message = errors?.find((error) => error.message)?.message

  if (!message) {
    return null
  }

  return (
    <p data-slot="field-error" className={cn('font-sans text-[11px] font-semibold tracking-[.04em] text-destructive', className)} {...props}>
      {message}
    </p>
  )
}

export { Field, FieldError, FieldLabel }
