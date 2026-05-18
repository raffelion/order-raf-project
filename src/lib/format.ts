export function formatDate(value: string) {
  if (!value) {
    return 'Not set'
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: value.includes('T') ? 'short' : undefined,
  }).format(new Date(value))
}

export function labelizeStatus(status: string) {
  const firstPass = status.replaceAll('_', ' ')
  return firstPass.charAt(0).toUpperCase() + firstPass.slice(1)
}
