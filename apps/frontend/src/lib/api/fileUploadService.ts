import { httpClient } from './http-client';

export interface UploadedFile {
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    type: string;
    uploadedAt: string;
}

/**
 * File Upload Service for Ticket Attachments
 */
export const fileUploadService = {
    /**
     * Upload a file (image or document)
     */
    async uploadFile(file: File): Promise<UploadedFile> {
        const formData = new FormData();
        formData.append('file', file);

        if (!file.size || file.size > 10 * 1024 * 1024) throw new Error('Dosya boyutu 1 bayt ile 10 MiB arasında olmalıdır.');
        return httpClient.postWrapped<UploadedFile>('/tickets/attachments/upload', formData, {headers:{'Content-Type':undefined}});
    },

    /**
     * Get file by ID
     */
    async downloadFile(id: string): Promise<Blob> {
        return httpClient.get<Blob>(`/tickets/attachments/${encodeURIComponent(id)}/download`, {responseType:'blob'});
    },

    async getFile(id: string): Promise<UploadedFile> {
        return await httpClient.getWrapped<UploadedFile>(`/tickets/attachments/${id}`);
    },
};
