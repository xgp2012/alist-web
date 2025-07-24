import {
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  VStack,
  HStack,
  Box,
  Select,
  SelectContent,
  SelectIcon,
  SelectListbox,
  SelectOption,
  SelectOptionIndicator,
  SelectOptionText,
  SelectPlaceholder,
  SelectTrigger,
  SelectValue,
  Tag,
  TagLabel,
  TagCloseButton,
  Checkbox,
} from "@hope-ui/solid"
import { MaybeLoading } from "~/components"
import { useFetch, useRouter, useT } from "~/hooks"
import { handleResp, notify } from "~/utils"
import { createStore } from "solid-js/store"
import { For, Show, onMount } from "solid-js"
import { UserPermissions } from "~/types"
import {
  Permission,
  getPermissionDetail,
  createPermission,
  updatePermission,
} from "~/utils/api"

interface PermissionForm {
  name: string
  description: string
  permission: number
  path_pattern: string
}

const PermissionForm = () => {
  const t = useT()
  const { params, back } = useRouter()
  const { id } = params
  const [permission, setPermission] = createStore<PermissionForm>({
    name: "",
    description: "",
    permission: 0,
    path_pattern: "/**",
  })

  const [permissionLoading, loadPermission] = useFetch(() =>
    getPermissionDetail(parseInt(id)),
  )

  const initData = async () => {
    if (id) {
      const resp = await loadPermission()
      handleResp<Permission>(resp, (data) => {
        setPermission({
          name: data.name,
          description: data.description,
          permission: data.permission,
          path_pattern: data.path_pattern,
        })
      })
    }
  }

  onMount(() => {
    initData()
  })

  const validateForm = () => {
    if (!permission.name.trim()) {
      notify.error(
        t("permissions.config.permissions_name") + t("global.required"),
      )
      return false
    }
    return true
  }

  const [okLoading, ok] = useFetch(async () => {
    if (!validateForm()) {
      return Promise.reject()
    }
    if (id) {
      return updatePermission({
        ...permission,
        id: parseInt(id),
      })
    }
    return createPermission(permission)
  })

  const getSelectedPermissions = () => {
    return UserPermissions.filter(
      (_, i) => ((permission.permission >> i) & 1) === 1,
    )
  }

  const togglePermission = (index: number) => {
    const bit = 1 << index
    setPermission("permission", permission.permission ^ bit)
  }

  return (
    <VStack spacing="$2" alignItems="start" w="$full">
      <Heading>{id ? t("global.edit") : t("global.add")}</Heading>
      <MaybeLoading loading={permissionLoading()}>
        <VStack spacing="$2" alignItems="start" w="$full">
          <FormControl required>
            <FormLabel>{t("permissions.config.permissions_name")}</FormLabel>
            <Input
              value={permission.name}
              onInput={(e) => setPermission("name", e.currentTarget.value)}
            />
          </FormControl>

          <FormControl>
            <FormLabel>
              {t("permissions.config.permissions_description")}
            </FormLabel>
            <Input
              value={permission.description}
              onInput={(e) =>
                setPermission("description", e.currentTarget.value)
              }
            />
          </FormControl>

          <FormControl required>
            <FormLabel>
              {t("permissions.config.permissions_permissions")}
            </FormLabel>
            <Select multiple value={getSelectedPermissions()}>
              <SelectTrigger>
                <Box
                  display="flex"
                  flexWrap="wrap"
                  gap="$2"
                  pr="$6"
                  py="$2"
                  minH="40px"
                  alignItems="center"
                >
                  <Show
                    when={getSelectedPermissions().length > 0}
                    fallback={
                      <SelectPlaceholder>
                        {t("permissions.config.select_permissions")}
                      </SelectPlaceholder>
                    }
                  >
                    <For each={getSelectedPermissions().slice(0, 3)}>
                      {(item, i) => (
                        <Tag
                          size="lg"
                          variant="subtle"
                          bgColor="$neutral2"
                          rounded="$sm"
                          px="$3"
                          py="$1"
                        >
                          <TagLabel>{t(`users.permissions.${item}`)}</TagLabel>
                          <TagCloseButton
                            onClick={(e) => {
                              e.stopPropagation()
                              togglePermission(UserPermissions.indexOf(item))
                            }}
                          />
                        </Tag>
                      )}
                    </For>
                    <Show when={getSelectedPermissions().length > 3}>
                      <Tag
                        size="lg"
                        variant="subtle"
                        bgColor="$neutral2"
                        rounded="$sm"
                        px="$3"
                        py="$1"
                      >
                        <TagLabel>
                          +{getSelectedPermissions().length - 3}
                        </TagLabel>
                      </Tag>
                    </Show>
                  </Show>
                </Box>
              </SelectTrigger>
              <SelectContent>
                <SelectListbox>
                  <For each={UserPermissions}>
                    {(item, i) => (
                      <SelectOption
                        value={item}
                        onClick={() => togglePermission(i())}
                      >
                        <HStack spacing="$2" w="$full" pl="$4" fontSize="$lg">
                          <Checkbox
                            checked={((permission.permission >> i()) & 1) === 1}
                            readOnly
                          />
                          <SelectOptionText>
                            {t(`users.permissions.${item}`)}
                          </SelectOptionText>
                        </HStack>
                      </SelectOption>
                    )}
                  </For>
                </SelectListbox>
              </SelectContent>
            </Select>
          </FormControl>

          <HStack spacing="$2">
            <Button
              loading={okLoading()}
              onClick={async () => {
                const resp = await ok()
                handleResp(resp, () => {
                  notify.success(t("global.save_success"))
                  back()
                })
              }}
            >
              {t("global.save")}
            </Button>
            <Button colorScheme="accent" onClick={() => back()}>
              {t("global.back")}
            </Button>
          </HStack>
        </VStack>
      </MaybeLoading>
    </VStack>
  )
}

export default PermissionForm
