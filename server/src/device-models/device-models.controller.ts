import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import { DeviceModelsService } from './device-models.service.js';
import { CreateDeviceModelDto } from './dto/create-device-model.dto.js';
import { UpdateDeviceModelDto } from './dto/update-device-model.dto.js';
import { MAX_IMAGE_BYTES } from './lib/image-file.js';

/** What we use of a multer upload; typed locally to avoid an @types/multer dep. */
interface UploadedImage {
  buffer: Buffer;
}

@Controller('device-models')
export class DeviceModelsController {
  constructor(private readonly models: DeviceModelsService) {}

  @Get()
  @RequirePermissions('device.read')
  list() {
    return this.models.list();
  }

  @Get(':id')
  @RequirePermissions('device.read')
  get(@Param('id') id: string) {
    return this.models.get(id);
  }

  @Get(':id/attributes')
  @RequirePermissions('device.read')
  getAttributes(@Param('id') id: string) {
    return this.models.getAttributes(id);
  }

  @Post()
  @RequirePermissions('device.update')
  create(@Body() dto: CreateDeviceModelDto) {
    return this.models.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('device.update')
  update(@Param('id') id: string, @Body() dto: UpdateDeviceModelDto) {
    return this.models.update(id, dto);
  }

  @Post(':id/image')
  @RequirePermissions('device.update')
  @UseInterceptors(
    FileInterceptor('file', {
      // A hard backstop; the 2 MB rule is enforced on the bytes in the service.
      limits: { files: 1, fileSize: MAX_IMAGE_BYTES * 4 },
    }),
  )
  setImage(@Param('id') id: string, @UploadedFile() file?: UploadedImage) {
    return this.models.setImage(id, file?.buffer);
  }

  @Delete(':id/image')
  @RequirePermissions('device.update')
  removeImage(@Param('id') id: string) {
    return this.models.removeImage(id);
  }
}
