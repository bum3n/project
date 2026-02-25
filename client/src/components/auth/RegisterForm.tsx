import React, { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

const RegisterForm: React.FC = () => {
  const { register } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !email || !password) {
      toast.error('Please fill in all fields')
      return
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      await register(username, email, password)
      toast.success('Account created!')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Username"
        type="text"
        placeholder="johndoe"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        autoComplete="username"
        required
      />
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
        autoComplete="new-password"
        required
      />
      <Button type="submit" loading={loading} className="w-full mt-2">
        Create Account
      </Button>
      <p className="text-center text-sm text-gray-400">
        Already have an account?{' '}
        <Link to="/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  )
}

export default RegisterForm
