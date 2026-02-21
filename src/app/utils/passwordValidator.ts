export function validatePassword(password: string): { valid: boolean; errors?: string[] } {
  const errors: string[] = []
  
  if (password.length < 6) {
    errors.push('Mínimo 6 caracteres')
  }
  
  if (!/[A-Za-z]/.test(password)) {
    errors.push('Al menos una letra')
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Al menos un número')
  }
  
  if (errors.length > 0) {
    return { valid: false, errors }
  }
  
  return { valid: true }
}

export const passwordRequirements = [
  'Mínimo 6 caracteres',
  'Al menos una letra',
  'Al menos un número'
]