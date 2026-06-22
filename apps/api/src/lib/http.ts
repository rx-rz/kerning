import * as v from 'valibot'

export const parseJson = async <
  TSchema extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>,
>(
  request: Request,
  schema: TSchema
) => {
  const body = await request.json()
  return v.parse(schema, body)
}

export const parseValue = <
  TSchema extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>,
>(
  schema: TSchema,
  value: unknown
) => v.parse(schema, value)

export const formatValidationError = (issues: v.BaseIssue<unknown>[]) => ({
  status: 'fail' as const,
  message: 'Invalid request',
  data: issues.reduce<Record<string, string>>((acc, issue) => {
    const path =
      issue.path
        ?.map((item) => item.key)
        .filter((key) => key !== undefined)
        .join('.') || 'root'

    acc[path] ??= issue.message
    return acc
  }, {}),
})
