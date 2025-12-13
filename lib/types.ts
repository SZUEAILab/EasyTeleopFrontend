export interface Node {
  id: number
  uuid: string
  status: boolean
  created_at: string
  updated_at: string
}

export interface Device {
  id: number
  node_id: number
  name: string
  description: string
  category: "VR" | "Robot" | "Camera"
  type: string
  config: Record<string, any>
  status: 0 | 1 | 2 // 0=未启动, 1=已连接, 2=重连中
  created_at: string
  updated_at: string
}

export interface DeviceTypeInfo {
  name: string
  description: string
  need_config: Record<
    string,
    {
      type: string
      description: string
      default?: any
    }
  >
}

export interface TeleopGroup {
  id: number
  node_id: number
  name: string
  description: string
  type: string
  config: number[] // Array of device IDs
  status: 0 | 1 // 0=未启动, 1=已启动
  created_at: string
  updated_at: string
}

export interface TeleopGroupTypeInfo {
  name: string
  description: string
  need_config: Array<{
    name: string
    description: string
    category: string
  }>
}

export interface Recording {
  id: string
  teleop_group_id: number
  operator_name: string
  robot_id: string
  start_time: string
  duration: string
  video_path: string
  data_path: string
}

export interface Hdf5Folder {
  name: string
  hdf5_count: number
}

export interface Hdf5File {
  name: string
  size: string
  folder: string
}

export interface Hdf5ProcessResult {
  success: boolean
  camera_images: Record<string, Array<{ index: number; data: string }>>
  total_frames: number
  camera_names: string[]
}

export type DeviceStatus = 0 | 1 | 2
export type TeleopGroupStatus = 0 | 1
export type CollectingStatus = 0 | 1
