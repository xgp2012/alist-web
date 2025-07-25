import { HStack, Icon, Text, Badge, IconButton, Tooltip } from "@hope-ui/solid"
import { Motion } from "@motionone/solid"
import { useContextMenu } from "solid-contextmenu"
import {
  batch,
  Show,
  For,
  createResource,
  createSignal,
  onMount,
  onCleanup,
  createMemo,
} from "solid-js"
import { LinkWithPush } from "~/components"
import { usePath, useRouter, useUtil, useT } from "~/hooks"
import {
  checkboxOpen,
  getMainColor,
  local,
  OrderBy,
  selectIndex,
  selectedObjs,
} from "~/store"
import { ObjType, StoreObj, Obj } from "~/types"
import { bus, formatDate, getFileSize, hoverColor } from "~/utils"
import { getIconByObj } from "~/utils/icon"
import { ItemCheckbox, useSelectWithMouse } from "./helper"
import { BsPlus } from "solid-icons/bs"
import { UserMethods } from "~/types"
import { me } from "~/store"
import { useLabels } from "~/store/label"
import AddLabelDialog from "~/components/AddLabelDialog"
import EditLabelDialog from "~/components/EditLabelDialog"
import { getColorWithOpacity } from "~/utils/color"
import { pathJoin } from "~/utils/path"
import { createLabelFileBinding } from "~/utils/api"

interface Label {
  id: number
  name: string
  type: number
  description: string
  bg_color: string
}

export interface Col {
  name: OrderBy | "tag"
  textAlign: "left" | "right"
  w: any
}

export const cols: Col[] = [
  { name: "name", textAlign: "left", w: { "@initial": "30%", "@md": "30%" } },
  { name: "tag", textAlign: "right", w: { "@initial": "46%", "@md": "25%" } },
  { name: "size", textAlign: "right", w: { "@initial": "24%", "@md": "15%" } },
  { name: "modified", textAlign: "right", w: { "@initial": 0, "@md": "30%" } },
]

// 添加选中统计组件
const SelectionStats = () => {
  const selected = selectedObjs
  const totalSize = createMemo(() => {
    return selected().reduce<number>((acc, obj) => acc + (obj.size || 0), 0)
  })
  const t = useT()
  return (
    <Show when={selected().length > 0}>
      <HStack
        spacing="$2"
        position="fixed"
        top="$4"
        right="$4"
        transform="none"
        bgColor={getMainColor()}
        color="white"
        p="$2"
        rounded="$lg"
        zIndex="$banner"
        shadow="$md"
      >
        <Text>
          {t("home.selected")} {selected().length} {t("home.selected_count")}
        </Text>
        <Text>
          {t("home.total_size")} {getFileSize(totalSize())}
        </Text>
      </HStack>
    </Show>
  )
}

export const ListItem = (props: { obj: StoreObj & Obj; index: number }) => {
  const { isHide } = useUtil()
  const { refresh } = usePath()
  if (isHide(props.obj)) {
    return null
  }
  const { setPathAs } = usePath()
  const { show } = useContextMenu({ id: 1 })
  const { pushHref, to, pathname } = useRouter()
  const { openWithDoubleClick, toggleWithClick, restoreSelectionCache } =
    useSelectWithMouse()
  const filenameStyle = () => local["list_item_filename_overflow"]

  // 构建完整路径
  const getFullPath = () => {
    // 如果obj.path存在且是完整路径（以权限路径开头），直接使用
    const userPermissions = me().permissions || []

    // if (
    //   props.obj.path &&
    //   userPermissions.some((perm) => props.obj.path?.startsWith(perm.path))
    // ) {
    //   return props.obj.path
    // }
    // 否则使用当前路径

    return pathJoin(pathname(), props.obj.name)
  }

  // 使用全局标签列表
  const { labels, refetch } = useLabels()
  const [isAddLabelOpen, setIsAddLabelOpen] = createSignal(false)
  const [isEditLabelOpen, setIsEditLabelOpen] = createSignal(false)

  onMount(() => {
    const refreshHandler = () => {
      refetch()
    }
    bus.on("refresh_labels", refreshHandler)
    onCleanup(() => {
      bus.off("refresh_labels", refreshHandler)
    })
  })

  const handleAddLabel = async (
    name: string,
    description: string,
    bg_color: string,
  ) => {
    try {
      // 获取最新的标签列表
      const labelData = await refetch()
      if (labelData?.data?.content) {
        // 找到刚刚创建的标签
        const newLabel = labelData.data.content.find(
          (label: Label) =>
            label.name === name &&
            label.description === description &&
            label.bg_color === bg_color,
        )
        if (newLabel) {
          // 创建标签文件绑定
          await createLabelFileBinding(newLabel.id.toString(), props.obj)
          // 强制刷新当前目录
          await refresh(false, true)
        }
      }
    } catch (err) {
      console.error("Failed to bind label to file:", err)
    }
  }

  const handleEditLabel = (selectedLabels: string[]) => {
    // 触发父组件刷新
    bus.emit("refresh")
  }

  return (
    <>
      <Motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        style={{
          width: "100%",
        }}
      >
        <HStack
          classList={{ selected: !!props.obj.selected }}
          class="list-item viselect-item"
          data-index={props.index}
          w="$full"
          p="$2"
          rounded="$lg"
          transition="all 0.3s"
          _hover={{
            transform: "scale(1.01)",
            backgroundColor: hoverColor(),
          }}
          bgColor={props.obj.selected ? hoverColor() : undefined}
        >
          <HStack
            class="name-box"
            spacing="$1"
            w={cols[0].w}
            as={LinkWithPush}
            href={props.obj.name}
            cursor={
              openWithDoubleClick() || toggleWithClick() ? "default" : "pointer"
            }
            on:dblclick={() => {
              if (!openWithDoubleClick()) return
              selectIndex(props.index, true, true)
              to(getFullPath())
            }}
            on:click={(e: MouseEvent) => {
              e.preventDefault()
              if (openWithDoubleClick()) return
              if (e.ctrlKey || e.metaKey || e.shiftKey) return
              if (!restoreSelectionCache()) return
              if (toggleWithClick())
                return selectIndex(props.index, !props.obj.selected)
              to(getFullPath())
            }}
            onMouseEnter={() => {
              setPathAs(props.obj.name, props.obj.is_dir, true)
            }}
            onContextMenu={(e: MouseEvent) => {
              batch(() => {
                selectIndex(props.index, true, true)
              })
              show(e, { props: props.obj })
            }}
          >
            <Show when={checkboxOpen()}>
              <ItemCheckbox
                on:mousedown={(e: MouseEvent) => {
                  e.stopPropagation()
                }}
                on:click={(e: MouseEvent) => {
                  e.stopPropagation()
                }}
                checked={props.obj.selected}
                onChange={(e: any) => {
                  selectIndex(props.index, e.target.checked)
                }}
              />
            </Show>
            <Icon
              class="icon"
              boxSize="$6"
              color={getMainColor()}
              as={getIconByObj(props.obj)}
              mr="$1"
              cursor={props.obj.type !== ObjType.IMAGE ? "inherit" : "pointer"}
              on:click={(e: MouseEvent) => {
                if (props.obj.type !== ObjType.IMAGE) return
                if (e.ctrlKey || e.metaKey || e.shiftKey) return
                if (!restoreSelectionCache()) return
                bus.emit("gallery", props.obj.name)
                e.preventDefault()
                e.stopPropagation()
              }}
            />
            <Text
              class="name"
              css={{
                wordBreak: "break-all",
                whiteSpace:
                  filenameStyle() === "multi_line" ? "unset" : "nowrap",
                "overflow-x":
                  filenameStyle() === "scrollable" ? "auto" : "hidden",
                textOverflow:
                  filenameStyle() === "ellipsis" ? "ellipsis" : "unset",
                "scrollbar-width": "none",
                "&::-webkit-scrollbar": {
                  display: "none",
                },
              }}
              title={props.obj.name}
            >
              {props.obj.name}
            </Text>
          </HStack>
          <HStack
            spacing="$1"
            w={cols[1].w}
            textAlign={cols[1].textAlign as any}
            onClick={(e: MouseEvent) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            justifyContent="space-between"
          >
            <HStack spacing="$1" flex={1} overflow="hidden">
              <Show when={props.obj.label_list?.length}>
                <For each={props.obj.label_list || []}>
                  {(label: Label) => (
                    <Tooltip label={label.name} placement="top">
                      <Badge
                        colorScheme="primary"
                        bgColor={getColorWithOpacity(label.bg_color)}
                        color={label.bg_color}
                        variant="solid"
                        mr="$1"
                        textTransform="none"
                        maxW="100px"
                        overflow="hidden"
                        css={{
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {label.name}
                      </Badge>
                    </Tooltip>
                  )}
                </For>
              </Show>
            </HStack>
            <Show when={UserMethods.is_admin(me()) && !props.obj.is_dir}>
              <IconButton
                size="xs"
                variant="ghost"
                color={getMainColor()}
                icon={<BsPlus size={20} />}
                aria-label="添加标签"
                onClick={(e: MouseEvent) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const labelData = labels()
                  if (labelData?.data?.content?.length) {
                    setIsEditLabelOpen(true)
                  } else {
                    setIsAddLabelOpen(true)
                  }
                }}
                flexShrink={0}
              />
            </Show>
            <AddLabelDialog
              isOpen={isAddLabelOpen()}
              onClose={() => setIsAddLabelOpen(false)}
              onSubmit={handleAddLabel}
            />
            <EditLabelDialog
              isOpen={isEditLabelOpen()}
              onClose={() => setIsEditLabelOpen(false)}
              onSubmit={handleEditLabel}
              labels={labels()?.data?.content || []}
              obj={props.obj}
            />
          </HStack>
          <Text class="size" w={cols[2].w} textAlign={cols[2].textAlign as any}>
            {getFileSize(props.obj.size)}
          </Text>
          <Text
            class="modified"
            display={{ "@initial": "none", "@md": "inline" }}
            w={cols[3].w}
            textAlign={cols[3].textAlign as any}
          >
            {formatDate(props.obj.modified)}
          </Text>
        </HStack>
      </Motion.div>
      <SelectionStats />
    </>
  )
}
