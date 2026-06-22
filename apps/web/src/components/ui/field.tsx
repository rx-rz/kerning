import type * as React from 'react'

import { cn } from '#/lib/utils'

function Field({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="field"
      className={cn('space-y-1.5 data-[invalid=true]:text-destructive', className)}
      {...props}
    />
  )
}

function FieldLabel({ className, ...props }: React.ComponentProps<'label'>) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: Consumers pass htmlFor when binding this shared field label.
    <label
      data-slot="field-label"
      className={cn('block text-xs font-medium text-foreground', className)}
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
    <p data-slot="field-error" className={cn('text-xs text-destructive', className)} {...props}>
      {message}
    </p>
  )
}

export { Field, FieldError, FieldLabel }
