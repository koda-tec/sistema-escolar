'use client'
import React, { useState } from 'react'
import { validatePassword, passwordRequirements } from '@/app/utils/passwordValidator'

interface PasswordInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  showRequirements?: boolean
  error?: string
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Ingrese contraseña',
  showRequirements = false,
  error
}) => {
  const [touched, setTouched] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const validation = validatePassword(value)
  const showErrors = touched && value.length > 0 && !validation.valid
  
  return (
    <div className="password-input-container">
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder={placeholder}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            showErrors || error 
              ? 'border-red-500 focus:ring-red-200' 
              : 'border-slate-300 focus:ring-blue-200'
          }`}
        />
        
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
        >
          {showPassword ? '👁️' : '👁️‍🗨️'}
        </button>
      </div>
      
      {showErrors && validation.errors && (
        <div className="mt-1 text-sm text-red-600">
          {validation.errors.map((err: string, idx: number) => (
            <p key={idx}>• {err}</p>
          ))}
        </div>
      )}
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {showRequirements && value.length > 0 && validation.valid && (
        <p className="mt-1 text-sm text-green-600">✓ Contraseña válida</p>
      )}
    </div>
  )
}