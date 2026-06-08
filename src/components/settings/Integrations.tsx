"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/Button"
import { toast } from "@/components/ui/Toast"
import { X, Calendar, Sparkles, AlertCircle } from "lucide-react"

interface Service {
  name: string
  connected: boolean
  email?: string
  isSandbox?: boolean
}

const DEFAULT: Service[] = [
  { name: "Zoho CRM", connected: true },
  { name: "Gmail", connected: true },
  { name: "Slack", connected: false },
  { name: "Google Calendar", connected: false, email: "", isSandbox: false },
]

export default function Integrations() {
  const [services, setServices] = useState<Service[]>(DEFAULT)
  const [showGoogleModal, setShowGoogleModal] = useState(false)
  const [clientId, setClientId] = useState("")
  const [sandboxEmail, setSandboxEmail] = useState("demo@humppl.com")
  const [authMethod, setAuthMethod] = useState<"sandbox" | "oauth">("sandbox")

  useEffect(() => {
    try {
      const stored = localStorage.getItem('integrations_status')
      const gConnected = localStorage.getItem('google_calendar_connected') === 'true'
      const gEmail = localStorage.getItem('google_calendar_email') || ''
      const gSandbox = localStorage.getItem('google_calendar_is_sandbox') === 'true'
      const gClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || localStorage.getItem('google_client_id') || ''

      let initialServices = DEFAULT
      if (stored) {
        const parsed = JSON.parse(stored)
        const hasGoogle = parsed.some((s: any) => s.name === "Google Calendar")
        if (hasGoogle) {
          initialServices = parsed
        } else {
          initialServices = [...parsed, { name: "Google Calendar", connected: gConnected, email: gEmail, isSandbox: gSandbox }]
        }
      }

      const updatedServices = initialServices.map((s: any) => {
        if (s.name === "Google Calendar") {
          return { ...s, connected: gConnected, email: gEmail, isSandbox: gSandbox }
        }
        return s
      })

      setServices(updatedServices)
      if (gClientId) setClientId(gClientId)
    } catch (e) { console.error(e) }
  }, [])

  // Listen for OAuth messages from the popup window
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'GOOGLE_OAUTH_SUCCESS') {
        const token = event.data.token;
        
        // Fetch user email to display in settings
        fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
          const email = data.email || 'user@gmail.com';
          connectGoogleCalendar(email, false, token);
        })
        .catch(err => {
          console.error("Failed to fetch user email:", err);
          connectGoogleCalendar('google-user@humppl.com', false, token);
        });
      } else if (event.data?.type === 'GOOGLE_OAUTH_ERROR') {
        toast.error(`Authentication failed: ${event.data.error}`);
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [services, clientId]);

  const connectGoogleCalendar = (email: string, isSandbox: boolean, token?: string) => {
    const next = services.map(s => {
      if (s.name === "Google Calendar") {
        return { ...s, connected: true, email, isSandbox }
      }
      return s
    })
    setServices(next)
    localStorage.setItem('integrations_status', JSON.stringify(next))
    localStorage.setItem('google_calendar_connected', 'true')
    localStorage.setItem('google_calendar_email', email)
    localStorage.setItem('google_calendar_is_sandbox', isSandbox ? 'true' : 'false')
    if (token) {
      localStorage.setItem('google_calendar_token', token)
    } else {
      localStorage.removeItem('google_calendar_token')
    }
    if (clientId) {
      localStorage.setItem('google_client_id', clientId)
    }
    setShowGoogleModal(false)
    toast.success(`Google Calendar connected as ${email}!`)
  }

  const toggle = (index: number) => {
    const next = [...services]
    const service = next[index]
    
    if (service.name === "Google Calendar") {
      if (service.connected) {
        next[index].connected = false
        next[index].email = ""
        next[index].isSandbox = false
        setServices(next)
        localStorage.setItem('integrations_status', JSON.stringify(next))
        localStorage.removeItem('google_calendar_token')
        localStorage.removeItem('google_calendar_connected')
        localStorage.removeItem('google_calendar_email')
        localStorage.removeItem('google_calendar_is_sandbox')
        toast.success('Google Calendar disconnected')
      } else {
        setShowGoogleModal(true)
      }
    } else {
      next[index].connected = !next[index].connected
      setServices(next)
      localStorage.setItem('integrations_status', JSON.stringify(next))
      toast.success(`${service.name} status updated`)
    }
  }

  const handleRealConnect = () => {
    const activeClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || clientId;
    if (!activeClientId.trim()) {
      toast.error("Please enter a valid Google Client ID.");
      return;
    }
    if (clientId) {
      localStorage.setItem('google_client_id', clientId)
    }
    
    const redirectUri = encodeURIComponent(`${window.location.origin}/google-callback.html`)
    const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email')
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${activeClientId}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}&prompt=consent`

    const width = 500
    const height = 650
    const left = window.screen.width / 2 - width / 2
    const top = window.screen.height / 2 - height / 2
    
    window.open(
      authUrl,
      "Connect Google Calendar",
      `width=${width},height=${height},top=${top},left=${left},status=no,resizable=yes`
    )
  }

  const handleSandboxConnect = () => {
    if (!sandboxEmail.trim()) {
      toast.error("Please enter a sandbox email.")
      return
    }
    connectGoogleCalendar(sandboxEmail, true)
  }

  return (
    <div className="space-y-4 text-sm text-gray-700">
      <p className="text-gray-600">Manage third-party integrations and authentication for your workspace.</p>
      <div className="grid gap-3">
        {services.map((service, idx) => (
          <div key={service.name} className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <span className="font-semibold text-gray-900 block">{service.name}</span>
                {service.name === "Google Calendar" && service.connected && (
                  <span className="text-xs text-blue-600 font-medium">
                    Active connection: {service.email} {service.isSandbox ? "(Sandbox)" : "(Real)"}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => toggle(idx)} 
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    service.connected 
                      ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                      : (service.name === "Google Calendar" && showGoogleModal)
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                  }`}
                >
                  {service.connected ? 'Disconnect' : (service.name === "Google Calendar" && showGoogleModal) ? 'Cancel' : 'Connect'}
                </button>
              </div>
            </div>

            {/* Inline Google Calendar Configuration Panel */}
            {service.name === "Google Calendar" && !service.connected && showGoogleModal && (
              <div className="border-t border-gray-100 bg-slate-50/50 p-4 space-y-4 animate-in slide-in-from-top duration-200">
                {/* Method tabs */}
                <div className="flex bg-gray-200/60 p-1 rounded-xl max-w-xs">
                  <button 
                    onClick={() => setAuthMethod("sandbox")}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${authMethod === "sandbox" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                  >
                    Developer Sandbox
                  </button>
                  <button 
                    onClick={() => setAuthMethod("oauth")}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${authMethod === "oauth" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                  >
                    OAuth 2.0 (Real)
                  </button>
                </div>

                {authMethod === "sandbox" ? (
                  <div className="space-y-3 max-w-md">
                    <div className="bg-blue-50/60 text-blue-800 p-3 rounded-xl border border-blue-100/50 flex items-start gap-2">
                      <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
                      <p className="text-xs leading-relaxed">
                        Sandbox mode allows you to simulate meeting synchronization instantly without setting up Google developer credentials.
                      </p>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Sandbox Gmail Address</label>
                      <input 
                        type="email"
                        value={sandboxEmail}
                        onChange={(e) => setSandboxEmail(e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-200 bg-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <Button size="sm" onClick={handleSandboxConnect}>
                      Connect Sandbox Account
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 max-w-md">
                    <div className="bg-amber-50/60 text-amber-800 p-3 rounded-xl border border-amber-100/50 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                    <p className="text-xs leading-relaxed">
                      Real connection requires registering a Google Cloud Project and adding <strong>{window.location.origin}/google-callback.html</strong> as an Authorized Redirect URI.
                    </p>
                  </div>
                    {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
                      <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-100/50 flex items-center gap-2 text-xs font-semibold">
                        <span>✓ Google Client ID successfully loaded from .env.local</span>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Google Client ID</label>
                        <input 
                          type="text"
                          placeholder="e.g. 12345-abcde.apps.googleusercontent.com"
                          value={clientId}
                          onChange={(e) => setClientId(e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-200 bg-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    )}
                    <Button size="sm" onClick={handleRealConnect}>
                      Sign in with Google
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
