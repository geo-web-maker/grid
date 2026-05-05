// src/pages/LoginPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { login } from '../hooks/useAuth'

export default function LoginPage() {
  const navigate = useNavigate()
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setError('')
    setLoading(true)
    try {
      await login(data.email, data.password)
      navigate('/', { replace: true })
    } catch (err) {
      setError('Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-navy-900">
      {/* Header */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="1.5">
            <path d="M2 6V3a1 1 0 011-1h3M14 2h3a1 1 0 011 1v3M18 14v3a1 1 0 01-1 1h-3M6 18H3a1 1 0 01-1-1v-3M6 10h8"/>
          </svg>
        </div>
        <div className="text-center">
          <h1 className="text-white text-2xl font-semibold">QR Logbook</h1>
          <p className="text-white/55 text-sm mt-1">Uganda Electricity Generation Company</p>
        </div>
      </div>

      {/* Login form */}
      <div className="bg-white rounded-t-3xl px-6 pt-8 pb-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Sign in</h2>
        <p className="text-sm text-gray-500 mb-6">Use your UEGCL employee credentials</p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="field">
            <label>Email address</label>
            <input
              type="email"
              placeholder="you@uegcl.co.ug"
              {...register('email', { required: 'Email is required' })}
            />
            {errors.email && <p className="text-red-500 text-xs mt-0.5">{errors.email.message}</p>}
          </div>

          <div className="field">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              {...register('password', { required: 'Password is required' })}
            />
            {errors.password && <p className="text-red-500 text-xs mt-0.5">{errors.password.message}</p>}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary mt-2 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Contact your site administrator to reset your password
        </p>
      </div>
    </div>
  )
}
