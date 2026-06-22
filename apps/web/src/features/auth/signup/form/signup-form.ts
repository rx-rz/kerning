import { useSignupWithEmailApi } from '#/api/auth/email'
import { useSendOTPApi } from '#/api/auth/otp'
import { useNavigate } from '@tanstack/react-router'
import { useForm, type SubmitHandler } from '@formisch/react'
import { useState } from 'react'
import * as v from 'valibot'

export const SignupSchema = v.pipe(
  v.object({
    name: v.pipe(
      v.string(),
      v.minLength(2, 'Name must be at least 2 characters.'),
      v.maxLength(120)
    ),
    email: v.pipe(v.string(), v.email(), v.maxLength(255)),
    password: v.pipe(v.string(), v.minLength(8, 'Password must be at least 8 characters.')),
    confirmPassword: v.pipe(
      v.string(),
      v.minLength(1, 'Confirm your password.')
    ),
  }),
  v.forward(
    v.check(
      ({ password, confirmPassword }) => password === confirmPassword,
      'Passwords must match.'
    ),
    ['confirmPassword']
  )
)

export function useSignupForm() {
  const navigate = useNavigate()
  const signup = useSignupWithEmailApi()
  const sendOtp = useSendOTPApi()
  const [error, setError] = useState<string | null>(null)

  const signupForm = useForm({
    schema: SignupSchema,
    initialInput: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const handleSubmit: SubmitHandler<typeof SignupSchema> = async ({
    name,
    email,
    password,
  }) => {
    setError(null)

    try {
      await signup.mutateAsync({ name, email, password })
      await sendOtp.mutateAsync({ email })
      await navigate({
        to: '/auth/verify-email',
        search: { email },
      })
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Account creation failed.')
    }
  }

  return {
    signupForm,
    handleSubmit,
    error,
    isPending: signup.isPending || sendOtp.isPending,
  }
}
