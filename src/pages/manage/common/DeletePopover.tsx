import {
  Popover,
  PopoverTrigger,
  Button,
  PopoverContent,
  PopoverArrow,
  PopoverHeader,
  PopoverBody,
  HStack,
} from "@hope-ui/solid"
import { useT } from "~/hooks"

export interface DeletePopoverProps {
  name: string
  loading: boolean
  onClick: () => void
  disabled?: boolean
}
export const DeletePopover = (props: DeletePopoverProps) => {
  const t = useT()
  const isDisabled = props.disabled ?? false // 默认值为 false
  return (
    <Popover>
      {({ onClose }) => (
        <>
          <PopoverTrigger
            as={Button}
            colorScheme="danger"
            disabled={isDisabled}
          >
            {t("global.delete")}
          </PopoverTrigger>
          <PopoverContent>
            <PopoverArrow />
            <PopoverHeader>
              {t("global.delete_confirm", {
                name: props.name,
              })}
            </PopoverHeader>
            <PopoverBody>
              <HStack spacing="$2">
                <Button onClick={onClose} colorScheme="neutral">
                  {t("global.cancel")}
                </Button>
                <Button
                  colorScheme="danger"
                  loading={props.loading}
                  onClick={props.onClick}
                >
                  {t("global.confirm")}
                </Button>
              </HStack>
            </PopoverBody>
          </PopoverContent>
        </>
      )}
    </Popover>
  )
}
