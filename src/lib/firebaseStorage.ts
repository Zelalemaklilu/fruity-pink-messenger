import { 
  ref, 
  uploadBytes, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject,
  listAll
} from 'firebase/storage';
import { storage } from './firebase';

export interface UploadResult {
  url: string;
  path: string;
  name: string;
  size: number;
  type: string;
}

export interface UploadProgress {
  progress: number;
  bytesTransferred: number;
  totalBytes: number;
}

// Upload profile picture
export const uploadProfilePicture = async (
  userId: string, 
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
  const fileExtension = file.name.split('.').pop();
  const path = `profile-pictures/${userId}/avatar.${fileExtension}`;
  const storageRef = ref(storage, path);
  
  return uploadFileWithProgress(storageRef, file, onProgress);
};

// Upload chat image
export const uploadChatImage = async (
  chatId: string,
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
  const timestamp = Date.now();
  const fileExtension = file.name.split('.').pop();
  const path = `chat-media/${chatId}/images/${timestamp}.${fileExtension}`;
  const storageRef = ref(storage, path);
  
  return uploadFileWithProgress(storageRef, file, onProgress);
};

// Upload chat file (documents, etc.)
export const uploadChatFile = async (
  chatId: string,
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `chat-media/${chatId}/files/${timestamp}_${sanitizedName}`;
  const storageRef = ref(storage, path);
  
  return uploadFileWithProgress(storageRef, file, onProgress);
};

// Upload voice message
export const uploadVoiceMessage = async (
  chatId: string,
  audioBlob: Blob,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
  const timestamp = Date.now();
  const path = `chat-media/${chatId}/voice/${timestamp}.webm`;
  const storageRef = ref(storage, path);
  
  const file = new File([audioBlob], `voice_${timestamp}.webm`, { type: 'audio/webm' });
  return uploadFileWithProgress(storageRef, file, onProgress);
};

// Generic upload function with progress tracking
const uploadFileWithProgress = async (
  storageRef: ReturnType<typeof ref>,
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) {
          onProgress({
            progress,
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes
          });
        }
      },
      (error) => {
        console.error('Upload error:', error);
        reject(error);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve({
          url: downloadURL,
          path: storageRef.fullPath,
          name: file.name,
          size: file.size,
          type: file.type
        });
      }
    );
  });
};

// Delete a file from storage
export const deleteFile = async (path: string): Promise<void> => {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
};

// Get download URL for a path
export const getFileUrl = async (path: string): Promise<string> => {
  const storageRef = ref(storage, path);
  return getDownloadURL(storageRef);
};

// List all files in a directory
export const listFiles = async (path: string): Promise<string[]> => {
  const storageRef = ref(storage, path);
  const result = await listAll(storageRef);
  return Promise.all(result.items.map(item => getDownloadURL(item)));
};

// Validate file before upload
export const validateFile = (
  file: File, 
  options: { maxSize?: number; allowedTypes?: string[] } = {}
): { valid: boolean; error?: string } => {
  const { maxSize = 10 * 1024 * 1024, allowedTypes } = options; // Default 10MB
  
  if (file.size > maxSize) {
    return { valid: false, error: `File size exceeds ${maxSize / 1024 / 1024}MB limit` };
  }
  
  if (allowedTypes && !allowedTypes.includes(file.type)) {
    return { valid: false, error: `File type ${file.type} is not allowed` };
  }
  
  return { valid: true };
};

// Helper to compress image before upload
export const compressImage = async (
  file: File, 
  maxWidth: number = 1920, 
  quality: number = 0.8
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};
