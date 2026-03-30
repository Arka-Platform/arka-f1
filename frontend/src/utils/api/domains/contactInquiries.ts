type Deps = {
  supabase: any
  ApiError: new (message: string, status: number, response?: unknown) => Error
  asErrorMessage: (error: unknown) => string
}

export type SubmitContactInquiryRequest = {
  name: string
  email: string
  subject: string
  message: string
  userId?: string | null
}

export function createContactInquiriesApi({ supabase, ApiError, asErrorMessage }: Deps) {
  return {
    submit: async (data: SubmitContactInquiryRequest): Promise<{ id: string }> => {
      const { data: row, error } = await supabase
        .from('contact_inquiries')
        .insert({
          name: data.name.trim(),
          email: data.email.trim(),
          subject: data.subject.trim(),
          message: data.message.trim(),
          user_id: data.userId ?? null,
        })
        .select('id')
        .single()
      if (error) throw new ApiError(asErrorMessage(error), 500, error)
      return { id: row.id as string }
    },
  }
}
