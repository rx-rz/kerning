import { useLoginWithEmailApi } from '#/api/auth/email'
import { useNavigate } from '@tanstack/react-router'
import { useForm, type SubmitHandler } from '@formisch/react'
import { useState } from 'react'
import * as v from 'valibot'

export const LoginSchema = v.object({
  email: v.pipe(v.string(), v.email(), v.maxLength(255)),
  password: v.pipe(v.string(), v.minLength(1, 'Password is required.')),
})

export function useLoginForm() {
  const navigate = useNavigate()
  const login = useLoginWithEmailApi()
  const [error, setError] = useState<string | null>(null)

  const loginForm = useForm({
    schema: LoginSchema,
    initialInput: {
      email: '',
      password: '',
    },
  })

  const handleSubmit: SubmitHandler<typeof LoginSchema> = async (input) => {
    setError(null)

    try {
      await login.mutateAsync(input)
      await navigate({ to: '/dashboard' })
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Sign in failed.')
    }
  }

  return {
    loginForm,
    handleSubmit,
    error,
    isPending: login.isPending,
  }
}
