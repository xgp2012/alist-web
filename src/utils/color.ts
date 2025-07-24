/**
 * 获取带透明度的颜色值
 * @param color 原始颜色值（支持 hex、rgb、rgba 格式）
 * @param opacity 透明度，默认 0.2
 * @returns 带透明度的颜色值（rgba 格式）
 */
export const getColorWithOpacity = (color: string, opacity: number = 0.2) => {
  // 如果是十六进制颜色，转换为 rgba
  if (color.startsWith("#")) {
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }
  // 如果已经是 rgb 格式，添加透明度
  if (color.startsWith("rgb(")) {
    return color.replace("rgb(", "rgba(").replace(")", `, ${opacity})`)
  }
  // 如果已经是 rgba 格式，修改透明度
  if (color.startsWith("rgba(")) {
    return color.replace(/[\d.]+\)$/, `${opacity})`)
  }
  return color
}
