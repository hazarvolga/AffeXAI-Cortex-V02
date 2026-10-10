import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { ChatSessionService } from '../services/chat-session.service';
import { ChatMessageService } from '../services/chat-message.service';
import { authorizeChatSession, ChatActor } from '../services/chat-session-access';
import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  UseGuards,
  ParseUUIDPipe
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { DocumentProcessorService } from '../services/document-processor.service';
import { UploadDocumentDto, DocumentUploadResponse, DocumentProcessingStatusDto } from '../dto/upload-document.dto';
import { ChatGateway } from '../gateways/chat.gateway';

@ApiTags('Chat Documents')
@ApiBearerAuth()
@Controller('chat/documents')
@UseGuards(JwtAuthGuard)
export class DocumentUploadController {
  constructor(
    private readonly documentProcessor: DocumentProcessorService,
    private readonly chatGateway: ChatGateway,
    private readonly sessions: ChatSessionService,
    private readonly messages: ChatMessageService,
  ) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload document for chat session' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ 
    status: 201, 
    description: 'Document uploaded successfully',
    type: DocumentUploadResponse 
  })
  @ApiResponse({ status: 400, description: 'Invalid file or request' })
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, callback) => {
      // Basic MIME type check - detailed validation happens in the service
      const allowedMimes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/markdown',
        'application/octet-stream' // Allow generic binary for better validation in service
      ];
      
      if (allowedMimes.includes(file.mimetype)) {
        callback(null, true);
      } else {
        callback(new BadRequestException(`Unsupported MIME type: ${file.mimetype}`), false);
      }
    }
  }))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadDocumentDto,
    @CurrentUser() user: ChatActor,
  ): Promise<DocumentUploadResponse> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    await authorizeChatSession(this.sessions, this.messages, user, uploadDto.sessionId, uploadDto.messageId);
    const processedDocument = await this.documentProcessor.processDocument(
      file.buffer,
      file.originalname,
      uploadDto.sessionId,
      uploadDto.messageId,
      file.mimetype
    );

    // Emit file processing status via WebSocket
    this.chatGateway.emitFileProcessingStatus(uploadDto.sessionId, {
      documentId: processedDocument.id,
      filename: processedDocument.filename,
      status: processedDocument.processingStatus,
      fileSize: processedDocument.fileSize
    });

    return {
      id: processedDocument.id,
      filename: processedDocument.filename,
      fileType: processedDocument.fileType,
      fileSize: processedDocument.fileSize,
      processingStatus: processedDocument.processingStatus,
      createdAt: new Date()
    };
  }

  @Get(':documentId/status')
  @ApiOperation({ summary: 'Get document processing status' })
  @ApiResponse({ 
    status: 200, 
    description: 'Document processing status',
    type: DocumentProcessingStatusDto 
  })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async getProcessingStatus(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @CurrentUser() user: ChatActor,
  ): Promise<DocumentProcessingStatusDto> {
    const document = await this.documentProcessor.getProcessingStatus(documentId);
    await authorizeChatSession(this.sessions, this.messages, user, document.sessionId);

    return {
      id: document.id,
      processingStatus: document.processingStatus,
      extractedContent: document.extractedContent,
      metadata: document.metadata,
      processedAt: document.processedAt
    };
  }

  @Get('session/:sessionId')
  @ApiOperation({ summary: 'Get all documents for a chat session' })
  @ApiResponse({ 
    status: 200, 
    description: 'Session documents',
    type: [DocumentProcessingStatusDto] 
  })
  async getSessionDocuments(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @CurrentUser() user: ChatActor,
  ): Promise<DocumentProcessingStatusDto[]> {
    await authorizeChatSession(this.sessions, this.messages, user, sessionId);
    const documents = await this.documentProcessor.getSessionDocuments(sessionId);

    return documents.map(doc => ({
      id: doc.id,
      processingStatus: doc.processingStatus,
      extractedContent: doc.extractedContent,
      metadata: doc.metadata,
      processedAt: doc.processedAt
    }));
  }
}
