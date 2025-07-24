import { useT } from "~/hooks"
import {
  HStack,
  Button,
  VStack,
  Box,
  Table,
  Thead,
  Tr,
  Th,
  Td,
  Tbody,
  Badge,
} from "@hope-ui/solid"
import { For, createResource, createSignal } from "solid-js"
import { getLabelList, getLabelDetail } from "~/utils"
import { Resp, PEmptyResp } from "~/types"
import { DeletePopover } from "~/pages/manage/common/DeletePopover"
import { handleResp, notify, r, formatDate } from "~/utils"
import { useListFetch } from "~/hooks"
import AddLabelDialog from "~/components/AddLabelDialog"
import { getColorWithOpacity } from "~/utils/color"

interface Label {
  id: number
  name: string
  description: string
  create_time: string
  bg_color: string
}

interface ListResp<T> {
  content: T[]
  total: number
}

const TagSettings = () => {
  const t = useT()
  const [labels, { refetch }] =
    createResource<Resp<ListResp<Label>>>(getLabelList)
  const [refreshing, setRefreshing] = createSignal(false)
  const [isAddLabelOpen, setIsAddLabelOpen] = createSignal(false)
  const [editingLabel, setEditingLabel] = createSignal<Label | null>(null)

  const [deleting, deleteLabel] = useListFetch(
    (id: number): PEmptyResp => r.post(`/admin/label/delete?id=${id}`),
  )

  const refresh = async () => {
    try {
      setRefreshing(true)
      await refetch()
      notify.success(t("global.refresh_success"))
    } catch (err) {
      notify.error(t("global.refresh_failed"))
    } finally {
      setRefreshing(false)
    }
  }

  const handleAddLabel = (
    name: string,
    description: string,
    bg_color: string,
  ) => {
    refresh()
  }

  const handleEdit = async (id: number) => {
    const resp = await getLabelDetail(id)
    handleResp(resp, (data) => {
      setEditingLabel(data)
      setIsAddLabelOpen(true)
    })
  }

  return (
    <VStack spacing="$2" alignItems="start" w="$full">
      <HStack spacing="$2">
        <Button colorScheme="accent" loading={refreshing()} onClick={refresh}>
          {t("global.refresh")}
        </Button>
        <Button
          onClick={() => {
            setEditingLabel(null)
            setIsAddLabelOpen(true)
          }}
        >
          {t("global.add")}
        </Button>
      </HStack>
      <Box w="$full" overflowX="auto">
        <Table highlightOnHover dense>
          <Thead>
            <Tr>
              <For each={["name", "description", "create_time"]}>
                {(title) => <Th>{t(`home.tag.${title}`)}</Th>}
              </For>
              <Th>{t("global.operations")}</Th>
            </Tr>
          </Thead>
          <Tbody>
            <For each={labels()?.data?.content}>
              {(item: Label) => (
                <Tr>
                  <Td>
                    <Badge
                      bgColor={getColorWithOpacity(item.bg_color)}
                      color={item.bg_color}
                      textTransform="none"
                      px="$3"
                      py="$2"
                      rounded="$md"
                      fontSize="$sm"
                    >
                      {item.name}
                    </Badge>
                  </Td>
                  <Td>{item.description}</Td>
                  <Td>{formatDate(item.create_time)}</Td>
                  <Td>
                    <HStack spacing="$2">
                      <Button
                        colorScheme="accent"
                        onClick={() => handleEdit(item.id)}
                      >
                        {t("global.edit")}
                      </Button>
                      <DeletePopover
                        name={item.name}
                        loading={deleting() === item.id}
                        onClick={async () => {
                          const resp = await deleteLabel(item.id)
                          handleResp(resp, () => {
                            notify.success(t("global.delete_success"))
                            refresh()
                          })
                        }}
                      />
                    </HStack>
                  </Td>
                </Tr>
              )}
            </For>
          </Tbody>
        </Table>
      </Box>
      <AddLabelDialog
        isOpen={isAddLabelOpen()}
        onClose={() => {
          setIsAddLabelOpen(false)
          setEditingLabel(null)
        }}
        onSubmit={handleAddLabel}
        editingLabel={editingLabel()}
      />
    </VStack>
  )
}

export default TagSettings
