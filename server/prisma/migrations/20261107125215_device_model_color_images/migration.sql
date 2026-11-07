-- CreateTable
CREATE TABLE "device_model_color_images" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "imageFileName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_model_color_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "device_model_color_images_modelId_idx" ON "device_model_color_images"("modelId");

-- CreateIndex
CREATE UNIQUE INDEX "device_model_color_images_modelId_color_key" ON "device_model_color_images"("modelId", "color");

-- AddForeignKey
ALTER TABLE "device_model_color_images" ADD CONSTRAINT "device_model_color_images_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "device_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;
