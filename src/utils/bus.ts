import mitt from "mitt"

type Events = {
  gallery: string
  refresh: void
  refresh_labels: void
  tool: string
  pathname: string
  to: string
}

export const bus = mitt<Events>()
