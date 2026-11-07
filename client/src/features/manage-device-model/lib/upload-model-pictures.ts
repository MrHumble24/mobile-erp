import { deviceModelRepository } from "@/entities/device-model"

export async function uploadStagedModelPictures(
  modelId: string,
  mainImage: File | null,
  colorImages: Record<string, File>
): Promise<void> {
  const promises: Promise<unknown>[] = []
  if (mainImage) {
    promises.push(deviceModelRepository.uploadImage(modelId, mainImage))
  }
  for (const [color, file] of Object.entries(colorImages)) {
    promises.push(deviceModelRepository.uploadColorImage(modelId, color, file))
  }
  if (promises.length > 0) {
    await Promise.all(promises)
  }
}

