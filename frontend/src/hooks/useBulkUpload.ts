import { useState } from 'react';

interface BulkUploadData {
  [key: string]: any;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface UseBulkUploadOptions {
  onUpload: (data: BulkUploadData[]) => Promise<{ success: boolean; errors?: ValidationError[] }>;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const useBulkUpload = (options: UseBulkUploadOptions) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleUpload = async (data: BulkUploadData[]) => {
    setIsUploading(true);
    try {
      const result = await options.onUpload(data);
      if (result.success) {
        options.onSuccess?.();
        closeModal();
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      options.onError?.(errorMessage);
      return { success: false, errors: [] };
    } finally {
      setIsUploading(false);
    }
  };

  return {
    isModalOpen,
    isUploading,
    openModal,
    closeModal,
    handleUpload
  };
};
