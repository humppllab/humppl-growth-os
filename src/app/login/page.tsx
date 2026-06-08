'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { Loader2, KeyRound, Mail, Sparkles, ArrowRight, ArrowLeft } from "lucide-react"
import { sendOtpAction, verifyOtpAction, demoLoginAction } from "@/actions"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [demoOtp, setDemoOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError("")
    setSuccessMessage("")

    try {
      const res = await sendOtpAction(email)
      if (res && 'error' in res && res.error) {
        setError(res.error)
      } else if (res.success) {
        setOtpSent(true)
        setSuccessMessage(`OTP sent successfully to ${email}.`)
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to send OTP. Please check your connection.")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !otp) return
    setLoading(true)
    setError("")

    try {
      const res = await verifyOtpAction(email, otp)
      if (res && 'error' in res && res.error) {
        setError(res.error)
      } else if (res.success) {
        router.push("/")
        router.refresh()
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to verify OTP. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setLoading(true)
    setError("")
    setSuccessMessage("")
    try {
      const res = await demoLoginAction()
      if (res && 'error' in res && res.error) {
        setError(res.error)
      } else if (res.success) {
        router.push("/")
        router.refresh()
      }
    } catch (err: any) {
      console.error(err)
      setError("Demo login bypass failed. Please try credentials manually.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-900 overflow-hidden select-none z-[9999]">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md px-4 relative z-10">
        {/* Logo/Brand Header */}
        <div className="text-center mb-8 space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400 mb-2">
            <Sparkles className="h-3.5 w-3.5" /> Humppl Growth OS V1
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Humppl <span className="text-blue-500">Growth OS</span>
          </h1>
          <p className="text-sm text-slate-400 font-medium">OTP-Based CRM & Workflows Login</p>
        </div>

        {/* Card Form */}
        <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
          <CardContent className="p-8">
            {error && (
              <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 font-medium text-center mb-4">
                {error}
              </div>
            )}
            
            {successMessage && (
              <div className="p-3 text-xs bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 font-medium text-center mb-4">
                {successMessage}
              </div>
            )}

            {/* Dynamic Demo OTP Notification Banner */}
            {otpSent && demoOtp && (
              <div className="p-3 text-xs bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 font-semibold text-center mb-5 animate-bounce">
                🚀 [Demo Mode] Check console or use OTP: <span className="text-white underline font-mono text-sm tracking-widest">{demoOtp}</span>
              </div>
            )}

            {!otpSent ? (
              // Step 1: Request OTP Form
              <form onSubmit={handleRequestOtp} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gmail Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Mail className="h-4.5 w-4.5" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. aditi@humppl.com"
                      className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 font-semibold text-sm transition-all flex items-center justify-center gap-2" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4" /> Sending OTP...
                      </>
                    ) : (
                      <>
                        <span>Get Verification Code</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              // Step 2: Verify OTP Form
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">6-Digit Code</label>
                    <button 
                      type="button" 
                      onClick={() => {
                        setOtpSent(false)
                        setOtp("")
                        setDemoOtp("")
                        setSuccessMessage("")
                      }} 
                      className="text-xs text-blue-500 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <ArrowLeft className="h-3 w-3" /> Change Email
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <KeyRound className="h-4.5 w-4.5" />
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      pattern="\d{6}"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 6-digit OTP"
                      className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-650 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 tracking-[0.2em] font-mono text-center font-bold"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 font-semibold text-sm transition-all" disabled={loading || otp.length !== 6}>
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin mr-2 h-4 w-4" /> Verifying Code...
                      </>
                    ) : "Verify & Sign In"}
                  </Button>
                </div>
              </form>
            )}

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900/0 px-2 text-slate-500 font-semibold">Or fast bypass</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full border-slate-800 hover:bg-slate-800/50 text-slate-300 rounded-xl py-2.5 font-semibold text-sm transition-all"
            >
              Access via Demo Mode (Instant Bypass)
            </Button>
          </CardContent>
        </Card>

        {/* Footer info */}
        <div className="text-center mt-6">
          <p className="text-xs text-slate-650 font-medium">Internal platform authorization required.</p>
        </div>
      </div>
    </div>
  )
}
