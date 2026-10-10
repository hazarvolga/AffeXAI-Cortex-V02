import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  StreamableFile,
  ParseUUIDPipe,
  Header,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiConsumes } from "@nestjs/swagger";
import {
  TicketAttachmentService,
  AttachmentActor,
} from "../services/ticket-attachment.service";
import { JwtAuthGuard } from "../../../core/auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../../core/auth/decorators/current-user.decorator";
import { MAX_ATTACHMENT_BYTES } from "../services/ticket-attachment-validation";

@ApiTags("Ticket Attachments")
@Controller("tickets/attachments")
@UseGuards(JwtAuthGuard)
export class TicketAttachmentsController {
  constructor(private readonly attachmentService: TicketAttachmentService) {}
  @Post("upload")
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: MAX_ATTACHMENT_BYTES, files: 1, fields: 0 },
    }),
  )
  uploadAttachment(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() actor: AttachmentActor,
  ) {
    return this.attachmentService.uploadAttachment(file, actor);
  }
  @Get(":id")
  getAttachment(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() actor: AttachmentActor,
  ) {
    return this.attachmentService.getAttachment(id, actor);
  }
  @Get(":id/download")
  @Header("X-Content-Type-Options", "nosniff")
  @Header("Cache-Control", "private, no-store")
  @Header("Content-Security-Policy", "default-src 'none'; sandbox")
  async download(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() actor: AttachmentActor,
  ) {
    const { stream, metadata } = await this.attachmentService.openDownload(
      id,
      actor,
    );
    const result = new StreamableFile(stream, {
      type: "application/octet-stream",
      length: metadata.size,
      disposition: `attachment; filename="attachment"; filename*=UTF-8''${encodeURIComponent(metadata.originalName).replace(/['()]/g, (char) => `%${char.charCodeAt(0).toString(16)}`)}`,
    });
    return result;
  }
}
