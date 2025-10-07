"use client"

import mqtt, { type MqttClient } from "mqtt"
import { config } from "./config"

export type MqttMessage = {
  topic: string
  payload: string | number
}

export type StatusCallback = (status: number) => void

class MQTTClientManager {
  private client: MqttClient | null = null
  private callbacks: Map<string, Set<StatusCallback>> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.client?.connected) {
        resolve()
        return
      }

      try {
        this.client = mqtt.connect(config.mqttUrl, {
          username: config.mqttUsername,
          password: config.mqttPassword,
          reconnectPeriod: 5000,
          connectTimeout: 30000,
        })

        this.client.on("connect", () => {
          console.log("[MQTT] Connected to broker")
          this.reconnectAttempts = 0
          resolve()
        })

        this.client.on("error", (error) => {
          console.error("[MQTT] Connection error:", error)
          if (this.reconnectAttempts === 0) {
            reject(error)
          }
        })

        this.client.on("reconnect", () => {
          this.reconnectAttempts++
          console.log(`[MQTT] Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.client?.end()
          }
        })

        this.client.on("message", (topic, message) => {
          const payload = message.toString()
          console.log(`[MQTT] Message received: ${topic} = ${payload}`)

          const callbacks = this.callbacks.get(topic)
          if (callbacks) {
            const status = Number.parseInt(payload, 10)
            callbacks.forEach((callback) => callback(status))
          }
        })

        this.client.on("close", () => {
          console.log("[MQTT] Connection closed")
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  subscribe(topic: string, callback: StatusCallback): () => void {
    if (!this.callbacks.has(topic)) {
      this.callbacks.set(topic, new Set())
      this.client?.subscribe(topic, (err) => {
        if (err) {
          console.error(`[MQTT] Subscribe error for ${topic}:`, err)
        } else {
          console.log(`[MQTT] Subscribed to ${topic}`)
        }
      })
    }

    this.callbacks.get(topic)!.add(callback)

    // Return unsubscribe function
    return () => {
      const callbacks = this.callbacks.get(topic)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          this.callbacks.delete(topic)
          this.client?.unsubscribe(topic)
          console.log(`[MQTT] Unsubscribed from ${topic}`)
        }
      }
    }
  }

  subscribeNodeStatus(nodeId: number, callback: StatusCallback) {
    return this.subscribe(`node/${nodeId}/status`, callback)
  }

  subscribeDeviceStatus(nodeId: number, deviceId: number, callback: StatusCallback) {
    return this.subscribe(`node/${nodeId}/device/${deviceId}/status`, callback)
  }

  subscribeTeleopGroupStatus(nodeId: number, groupId: number, callback: StatusCallback) {
    return this.subscribe(`node/${nodeId}/teleop-group/${groupId}/status`, callback)
  }

  subscribeTeleopGroupCollecting(nodeId: number, groupId: number, callback: StatusCallback) {
    return this.subscribe(`node/${nodeId}/teleop-group/${groupId}/collecting`, callback)
  }

  disconnect() {
    if (this.client) {
      this.client.end()
      this.client = null
      this.callbacks.clear()
      console.log("[MQTT] Disconnected")
    }
  }

  isConnected(): boolean {
    return this.client?.connected ?? false
  }
}

export const mqttClient = new MQTTClientManager()
