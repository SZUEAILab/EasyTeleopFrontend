export const config = {
  // Backend API configuration
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",

  // MQTT configuration
  mqttUrl: process.env.NEXT_PUBLIC_MQTT_URL || "ws://localhost:8083/mqtt",
  mqttUsername: process.env.NEXT_PUBLIC_MQTT_USERNAME || "",
  mqttPassword: process.env.NEXT_PUBLIC_MQTT_PASSWORD || "",
} as const

export type Config = typeof config
