import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-sky-100 p-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800">CyberChat</h1>
        <p className="text-slate-500 mt-2">Sign in to continue</p>
      </div>
      <SignIn />
    </div>
  )
}
