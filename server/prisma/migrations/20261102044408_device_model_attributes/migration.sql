-- AlterTable
ALTER TABLE "device_models" ADD COLUMN     "attributes" JSONB NOT NULL DEFAULT '[]';
