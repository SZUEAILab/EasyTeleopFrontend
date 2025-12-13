import { config } from "./config"
import type {
  Device,
  TeleopGroup,
  Node,
  DeviceTypeInfo,
  TeleopGroupTypeInfo,
  Hdf5Folder,
  Hdf5File,
  Hdf5ProcessResult,
} from "./types"

export interface RpcMethodInfo {
  name: string
  description: string
  params: Record<string, string> // param_name -> type (e.g., "string", "object", "number")
}

interface RpcMethodsResponse {
  methods: RpcMethodInfo[]
}

interface RpcCallResponse<T = unknown> {
  result: T
}

interface RpcCallRequest {
  method: string
  params?: Record<string, unknown>
}

class ApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = config.apiUrl
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Unknown error" }))
      throw new Error(error.detail || `HTTP ${response.status}`)
    }

    if (response.status === 204) {
      return null as T
    }

    return response.json()
  }

  // Node APIs
  async getNodes(uuid?: string): Promise<Node[]> {
    const params = uuid ? `?uuid=${uuid}` : ""
    return this.request<Node[]>(`/api/nodes${params}`)
  }

  async registerNode(uuid: string): Promise<{ id: number }> {
    return this.request<{ id: number }>("/api/node", {
      method: "POST",
      body: JSON.stringify({ uuid }),
    })
  }

  async getNodeRpcMethods(nodeId: number): Promise<RpcMethodInfo[]> {
    const response = await this.request<RpcMethodsResponse>(`/api/nodes/${nodeId}/rpc`)
    return response.methods
  }

  async callNodeRpc<T = unknown>(nodeId: number, method: string, params?: Record<string, unknown>): Promise<T> {
    const body: RpcCallRequest = { method }
    if (params) {
      body.params = params
    }
    const response = await this.request<RpcCallResponse<T>>(`/api/nodes/${nodeId}/rpc`, {
      method: "POST",
      body: JSON.stringify(body),
    })
    return response.result
  }

  // Device APIs
  async getDeviceCategories(nodeId: number): Promise<string[]> {
    return this.request<string[]>(`/api/device/categories?node_id=${nodeId}`)
  }

  async getDeviceTypes(nodeId: number): Promise<Record<string, Record<string, DeviceTypeInfo>>> {
    return this.request(`/api/device/types?node_id=${nodeId}`)
  }

  async getDevices(nodeId?: number): Promise<Device[]> {
    const params = nodeId ? `?node_id=${nodeId}` : ""
    return this.request<Device[]>(`/api/devices${params}`)
  }

  async getDevice(id: number): Promise<Device> {
    return this.request<Device>(`/api/devices/${id}`)
  }

  async createDevice(
    device: Omit<Device, "id" | "status" | "created_at" | "updated_at">,
  ): Promise<{ message: string; id: number }> {
    return this.request<{ message: string; id: number }>("/api/devices", {
      method: "POST",
      body: JSON.stringify(device),
    })
  }

  async updateDevice(
    id: number,
    device: Partial<Omit<Device, "id" | "node_id" | "created_at" | "updated_at">>,
  ): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/devices/${id}`, {
      method: "PUT",
      body: JSON.stringify(device),
    })
  }

  async deleteDevice(id: number): Promise<void> {
    return this.request<void>(`/api/devices/${id}`, {
      method: "DELETE",
    })
  }

  async testDevice(device: Omit<Device, "id" | "status" | "created_at" | "updated_at">): Promise<{ message: string }> {
    return this.request<{ message: string }>("/api/devices/test", {
      method: "POST",
      body: JSON.stringify(device),
    })
  }

  // TeleopGroup APIs
  async getTeleopGroupTypes(nodeId: number): Promise<Record<string, TeleopGroupTypeInfo>> {
    return this.request(`/api/teleop-groups/types?node_id=${nodeId}`)
  }

  async getTeleopGroups(params?: { name?: string; device_id?: number; node_id?: number }): Promise<TeleopGroup[]> {
    const searchParams = new URLSearchParams()
    if (params?.name) searchParams.append("name", params.name)
    if (params?.device_id) searchParams.append("device_id", params.device_id.toString())
    if (params?.node_id) searchParams.append("node_id", params.node_id.toString())

    const query = searchParams.toString()
    return this.request<TeleopGroup[]>(`/api/teleop-groups${query ? `?${query}` : ""}`)
  }

  async getTeleopGroup(id: number): Promise<TeleopGroup> {
    return this.request<TeleopGroup>(`/api/teleop-groups/${id}`)
  }

  async createTeleopGroup(
    group: Omit<TeleopGroup, "id" | "status" | "created_at" | "updated_at">,
  ): Promise<{ message: string; id: number }> {
    return this.request<{ message: string; id: number }>("/api/teleop-groups", {
      method: "POST",
      body: JSON.stringify(group),
    })
  }

  async updateTeleopGroup(
    id: number,
    group: Partial<Omit<TeleopGroup, "id" | "node_id" | "created_at" | "updated_at">>,
  ): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/teleop-groups/${id}`, {
      method: "PUT",
      body: JSON.stringify(group),
    })
  }

  async deleteTeleopGroup(id: number): Promise<void> {
    return this.request<void>(`/api/teleop-groups/${id}`, {
      method: "DELETE",
    })
  }

  async startTeleopGroup(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/teleop-groups/${id}/start`, {
      method: "POST",
    })
  }

  async stopTeleopGroup(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/teleop-groups/${id}/stop`, {
      method: "POST",
    })
  }

  // HDF5 APIs
  async getHdf5Folders(): Promise<Hdf5Folder[]> {
    return this.request<Hdf5Folder[]>(`/api/hdf5/folders`)
  }

  async getHdf5Files(folder: string): Promise<Hdf5File[]> {
    return this.request<Hdf5File[]>(`/api/hdf5/files/${encodeURIComponent(folder)}`)
  }

  async processHdf5(folder: string, filename: string): Promise<Hdf5ProcessResult> {
    return this.request<Hdf5ProcessResult>(`/api/hdf5/process`, {
      method: "POST",
      body: JSON.stringify({ folder, filename }),
    })
  }
}

export const apiClient = new ApiClient()
