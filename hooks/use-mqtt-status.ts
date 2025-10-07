"use client"

import { useEffect, useState } from "react"
import { mqttClient } from "@/lib/mqtt-client"

export function useMqttDeviceStatus(nodeId: number, deviceId: number) {
  const [status, setStatus] = useState<0 | 1 | 2>(0)

  useEffect(() => {
    const unsubscribe = mqttClient.subscribeDeviceStatus(nodeId, deviceId, (newStatus) => {
      setStatus(newStatus as 0 | 1 | 2)
    })

    return unsubscribe
  }, [nodeId, deviceId])

  return status
}

export function useMqttTeleopStatus(nodeId: number, groupId: number) {
  const [status, setStatus] = useState<0 | 1>(0)

  useEffect(() => {
    const unsubscribe = mqttClient.subscribeTeleopGroupStatus(nodeId, groupId, (newStatus) => {
      setStatus(newStatus as 0 | 1)
    })

    return unsubscribe
  }, [nodeId, groupId])

  return status
}

export function useMqttCollectingStatus(nodeId: number, groupId: number) {
  const [status, setStatus] = useState<0 | 1>(0)

  useEffect(() => {
    const unsubscribe = mqttClient.subscribeTeleopGroupCollecting(nodeId, groupId, (newStatus) => {
      setStatus(newStatus as 0 | 1)
    })

    return unsubscribe
  }, [nodeId, groupId])

  return status
}

export function useMqttNodeStatus(nodeId: number) {
  const [status, setStatus] = useState<0 | 1>(0)

  useEffect(() => {
    const unsubscribe = mqttClient.subscribeNodeStatus(nodeId, (newStatus) => {
      setStatus(newStatus as 0 | 1)
    })

    return unsubscribe
  }, [nodeId])

  return status
}
