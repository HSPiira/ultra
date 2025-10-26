import React, { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X, Download, Eye } from 'lucide-react';
import { COLORS } from '../../constants/colors';

interface BulkUploadData {
  [key: string]: any;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (data: BulkUploadData[]) => Promise<{ success: boolean; errors?: ValidationError[] }>;
  title: string;
  description?: string;
  sampleFileName: string;
  sampleFileUrl?: string;
  acceptedFileTypes?: string[];
  maxFileSize?: number; // in MB
  requiredFields?: string[];
  fieldMappings?: { [key: string]: string }; // Maps CSV headers to API fields
  previewColumns?: string[];
  onPreview?: (data: BulkUploadData[]) => void;
}

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  title,
  description,
  sampleFileName,
  sampleFileUrl,
  acceptedFileTypes = ['.csv'],
  maxFileSize = 10,
  requiredFields = [],
  fieldMappings = {},
  previewColumns = [],
  onPreview
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadedData, setUploadedData] = useState<BulkUploadData[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [dragActive, setDragActive] = useState(false);

  const resetState = () => {
    setFile(null);
    setUploadedData([]);
    setValidationErrors([]);
    setIsUploading(false);
    setUploadStatus('idle');
    setDragActive(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const parseCSV = (csvText: string): BulkUploadData[] => {
    // Parse CSV with proper handling of quoted values
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            // Escaped quote
            current += '"';
            i++; // Skip next quote
          } else {
            // Toggle quote state
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          // Field separator
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      // Add last field
      result.push(current.trim());
      return result;
    };
    
    const lines = csvText.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0]);
    const data: BulkUploadData[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const row: BulkUploadData = {};
      
      headers.forEach((header, index) => {
        const mappedField = fieldMappings[header] || header;
        row[mappedField] = values[index] || '';
      });
      
      data.push(row);
    }

    return data;
  };

  const validateData = (data: BulkUploadData[]): ValidationError[] => {
    const errors: ValidationError[] = [];

    data.forEach((row, index) => {
      // Check required fields
      requiredFields.forEach(field => {
        if (!row[field] || row[field].toString().trim() === '') {
          errors.push({
            row: index + 2, // +2 because CSV has header and is 1-indexed
            field,
            message: `${field} is required`
          });
        }
      });

      // Add custom validation logic here if needed
      // Example: email validation, phone validation, etc.
    });

    return errors;
  };

  const handleFileUpload = useCallback((uploadedFile: File) => {
    if (!acceptedFileTypes.some(type => uploadedFile.name.toLowerCase().endsWith(type))) {
      alert(`Please upload a file with one of these extensions: ${acceptedFileTypes.join(', ')}`);
      return;
    }

    if (uploadedFile.size > maxFileSize * 1024 * 1024) {
      alert(`File size must be less than ${maxFileSize}MB`);
      return;
    }

    setFile(uploadedFile);
    setUploadStatus('idle');

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const data = parseCSV(text);
      setUploadedData(data);
      
      const errors = validateData(data);
      setValidationErrors(errors);
    };
    reader.readAsText(uploadedFile);
  }, [acceptedFileTypes, maxFileSize, fieldMappings, requiredFields]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!uploadedData.length) return;

    setIsUploading(true);
    try {
      const result = await onUpload(uploadedData);
      if (result.success) {
        setUploadStatus('success');
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        setUploadStatus('error');
        if (result.errors) {
          setValidationErrors(result.errors);
        }
      }
    } catch (error) {
      setUploadStatus('error');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePreview = () => {
    if (onPreview && uploadedData.length > 0) {
      onPreview(uploadedData);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
    >
      <div 
        className="rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border"
        style={{ 
          backgroundColor: COLORS.background.tertiary,
          borderColor: COLORS.border.secondary
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: COLORS.border.secondary }}
        >
          <div>
            <h2 className="text-xl font-semibold" style={{ color: COLORS.text.primary }}>{title}</h2>
            {description && (
              <p className="text-sm mt-1" style={{ color: COLORS.text.tertiary }}>{description}</p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: COLORS.text.tertiary }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.background.hover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Sample File Section */}
          <div 
            className="mb-6 p-4 rounded-lg"
            style={{ backgroundColor: COLORS.background.secondary }}
          >
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4" style={{ color: COLORS.action.primary }} />
              <span className="text-sm font-medium" style={{ color: COLORS.text.primary }}>Sample File</span>
            </div>
            <p className="text-sm mb-3" style={{ color: COLORS.text.secondary }}>
              Download the sample file to see the required format and structure.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (sampleFileUrl) {
                    window.open(sampleFileUrl, '_blank');
                  } else {
                    // Generate sample CSV content
                    const sampleHeaders = requiredFields.join(',');
                    const sampleRow = requiredFields.map(field => `Sample ${field}`).join(',');
                    const csvContent = `${sampleHeaders}\n${sampleRow}`;
                    const blob = new Blob([csvContent], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = sampleFileName;
                    a.click();
                    URL.revokeObjectURL(url);
                  }
                }}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                Download {sampleFileName}
              </button>
            </div>
          </div>

          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-400 bg-blue-900/20'
                : 'border-gray-600 hover:border-gray-500'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Upload Your File</h3>
            <p className="text-gray-400 mb-4">
              Drag and drop your file here, or click to browse
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Accepted formats: {acceptedFileTypes.join(', ')} (Max {maxFileSize}MB)
            </p>
            <input
              type="file"
              accept={acceptedFileTypes.join(',')}
              onChange={handleFileInputChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-block px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors cursor-pointer"
            >
              Choose File
            </label>
          </div>

          {/* File Info */}
          {file && (
            <div className="mt-4 p-4 bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span className="text-white">{file.name}</span>
                  <span className="text-gray-400 text-sm">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    setUploadedData([]);
                    setValidationErrors([]);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-red-400 font-medium">Validation Errors</span>
              </div>
              <div className="max-h-32 overflow-y-auto">
                {validationErrors.slice(0, 10).map((error, index) => (
                  <div key={index} className="text-sm text-red-300">
                    Row {error.row}: {error.field} - {error.message}
                  </div>
                ))}
                {validationErrors.length > 10 && (
                  <div className="text-sm text-red-300">
                    ... and {validationErrors.length - 10} more errors
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Data Preview */}
          {uploadedData.length > 0 && validationErrors.length === 0 && (
            <div className="mt-4 p-4 bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 font-medium">
                    {uploadedData.length} records ready for upload
                  </span>
                </div>
                {onPreview && (
                  <button
                    onClick={handlePreview}
                    className="flex items-center gap-2 px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </button>
                )}
              </div>
              
              {/* Quick preview table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-600">
                      {previewColumns.slice(0, 5).map((col, index) => (
                        <th key={index} className="text-left py-2 text-gray-300">
                          {col}
                        </th>
                      ))}
                      {previewColumns.length > 5 && (
                        <th className="text-left py-2 text-gray-300">...</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {uploadedData.slice(0, 3).map((row, index) => (
                      <tr key={index} className="border-b border-gray-600">
                        {previewColumns.slice(0, 5).map((col, colIndex) => (
                          <td key={colIndex} className="py-2 text-gray-300">
                            {row[col] || '-'}
                          </td>
                        ))}
                        {previewColumns.length > 5 && (
                          <td className="py-2 text-gray-300">...</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {uploadedData.length > 3 && (
                  <div className="text-center py-2 text-gray-400 text-sm">
                    ... and {uploadedData.length - 3} more rows
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Upload Status */}
          {uploadStatus === 'success' && (
            <div className="mt-4 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-green-400 font-medium">
                  Upload successful! Closing in 2 seconds...
                </span>
              </div>
            </div>
          )}

          {uploadStatus === 'error' && (
            <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-red-400 font-medium">
                  Upload failed. Please check the errors above and try again.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploadedData.length === 0 || validationErrors.length > 0 || isUploading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload {uploadedData.length > 0 ? `(${uploadedData.length} records)` : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
