"use client"

import type React from "react"

import { useEffect } from "react"
import { Toaster } from "@/components/ui/toaster"
import { mqttClient } from "@/lib/mqtt-client"

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Connect to MQTT on mount
    mqttClient.connect().catch((error) => {
      console.error("Failed to connect to MQTT:", error)
    })

    // Cleanup on unmount
    return () => {
      mqttClient.disconnect()
    }
  }, [])

  return (
    <>
      {children}
      <Toaster />
    </>
  )
}
