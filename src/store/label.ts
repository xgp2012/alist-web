import { createSignal } from "solid-js"
import { getLabelList } from "~/utils"
import { createResource } from "solid-js"

interface Label {
  id: number
  name: string
  type: number
  description: string
  bg_color: string
}

// 全局标签列表状态
const [labels, { refetch }] = createResource(getLabelList)

// 导出标签列表和刷新方法
export const useLabels = () => {
  return {
    labels,
    refetch,
  }
}

// 获取标签列表数据
export const getLabels = (): Label[] => {
  const data = labels()
  return data?.data?.content || []
}

// 刷新标签列表
export const refreshLabels = () => refetch()
