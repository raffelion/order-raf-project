export function FormMessage({
  message,
  tone = 'neutral',
}: {
  message: string
  tone?: 'neutral' | 'success' | 'error'
}) {
  if (!message) {
    return null
  }
  return <p className={`form-message form-message-${tone}`}>{message}</p>
}
