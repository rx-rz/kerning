import { OTPInput, OTPInputContext, type OTPInputProps } from 'input-otp'
import * as React from 'react'

import { cn } from '#/lib/utils'

function InputOTP({
  className,
  containerClassName,
  ...props
}: OTPInputProps & { className?: string }) {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn(
        'flex items-center gap-2 has-[:disabled]:opacity-50',
        containerClassName
      )}
      className={cn('disabled:cursor-not-allowed', className)}
      {...props}
    />
  )
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn('flex w-full items-center justify-center', className)}
      {...props}
    />
  )
}

function InputOTPSlot({
  index,
  className,
  ...props
}: React.ComponentProps<'div'> & {
  index: number
}) {
  const inputOTPContext = React.useContext(OTPInputContext)
  const slot = inputOTPContext.slots[index]

  if (!slot) {
    return null
  }

  const { char, hasFakeCaret, isActive } = slot

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        [
          'relative flex h-11 w-10 items-center justify-center border-y border-r border-hairline',
          'bg-component-inset text-sm font-medium text-foreground shadow-small transition-all',
          'first:rounded-l-md first:border-l last:rounded-r-md',
          'data-[active=true]:z-10 data-[active=true]:border-primary data-[active=true]:ring-[3px] data-[active=true]:ring-primary/20',
        ],
        className
      )}
      {...props}
    >
      {char}
      {hasFakeCaret ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-pulse bg-foreground" />
        </div>
      ) : null}
    </div>
  )
}

export { InputOTP, InputOTPGroup, InputOTPSlot }
