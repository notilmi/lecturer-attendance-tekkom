'use client'

import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showButton, setShowButton] = useState(false)

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowButton(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstallClick = () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    deferredPrompt.userChoice.then(() => {
      setDeferredPrompt(null)
      setShowButton(false)
    })
  }

  if (!showButton) return null

  return (
    <Button
      onClick={handleInstallClick}
      className="fixed bottom-4 right-4 z-50 rounded-full p-2 shadow-lg"
      variant="default"
      size="icon"
    >
      <Download className="w-5 h-5" />
    </Button>
  )
}
