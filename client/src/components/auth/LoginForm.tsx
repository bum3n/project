import React, { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

const LoginForm: React.FC = () => {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Welcome back!')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        required
      />
      <Input
        label="Password"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        required
      />
      <Button type="submit" loading={loading} className="w-full mt-2">
        Sign In
      </Button>
      <p className="text-center text-sm text-gray-400">
        Don't have an account?{' '}
        <Link to="/register" className="text-accent hover:underline">
          Register
        </Link>
      </p>
    </form>
  )
}

export default LoginForm
