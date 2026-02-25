import React from 'react'
import RegisterForm from '@/components/auth/RegisterForm'

const RegisterPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-chat-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">iWa</h1>
          <p className="text-gray-400">Create your account</p>
        </div>
        <div className="bg-[#17212b] rounded-2xl p-8 border border-[#2b3a4a] shadow-2xl">
          <RegisterForm />
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
