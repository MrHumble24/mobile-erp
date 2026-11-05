export type {
  DeviceModelView,
  CreateDeviceModelDto,
  UpdateDeviceModelDto,
  AttributeDef,
  AttributeType,
  ProductKind,
} from "./model/device-model.types"
export { PRODUCT_KINDS, productKindLabelKey } from "./lib/product-kind"
export {
  deviceModelRepository,
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
} from "./api/device-model.repository"
export { deviceModelKeys } from "./api/device-model.keys"
export {
  useDeviceModels,
  useDeviceModelAttributes,
  useCreateDeviceModel,
  useUpdateDeviceModel,
  useUploadDeviceModelImage,
  useRemoveDeviceModelImage,
} from "./model/use-device-models"
export { DynamicSpecFields, type SpecFieldProblem } from "./ui/DynamicSpecFields"
export { UsedUnitFields } from "./ui/UsedUnitFields"
export {
  emptyUsedUnit,
  usedUnitToPayload,
  usedUnitReady,
  type UsedUnitValues,
  type UsedUnitPayload,
} from "./lib/used-unit"
export { storageOptionsFromModels } from "./lib/storage-options"
