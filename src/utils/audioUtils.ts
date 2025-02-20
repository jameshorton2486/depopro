
export const SUPPORTED_AUDIO_TYPES = {
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
  'audio/x-m4a': ['.m4a'],
  'audio/aac': ['.aac'],
  'video/mp4': ['.mp4'],
  'video/quicktime': ['.mov'],
  'video/x-msvideo': ['.avi'],
  'video/webm': ['.webm']
} as const;

export const getAudioDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const reader = new FileReader();

    reader.onload = (e) => {
      if (!e.target?.result) {
        reject(new Error("Failed to read file"));
        return;
      }

      audio.src = e.target.result as string;
      
      audio.addEventListener('loadedmetadata', () => {
        resolve(audio.duration);
      });
      
      audio.addEventListener('error', () => {
        reject(new Error("Invalid or corrupt audio file"));
      });
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};

export const validateAudioFile = async (file: File): Promise<void> => {
  // Check if file type is supported
  if (!Object.keys(SUPPORTED_AUDIO_TYPES).includes(file.type)) {
    throw new Error(
      `Unsupported file type. Supported formats are: ${Object.values(SUPPORTED_AUDIO_TYPES).flat().join(', ')}`
    );
  }

  // Check if file is readable and not corrupt
  try {
    await getAudioDuration(file);
  } catch (error) {
    throw new Error(`Failed to validate audio file: ${error.message}`);
  }
};

export const extractAudioChunk = async (file: File): Promise<Blob> => {
  try {
    console.log('Starting audio chunk extraction for file:', {
      name: file.name,
      type: file.type,
      size: `${(file.size / (1024 * 1024)).toFixed(2)}MB`
    });
    
    // Validate the file first
    await validateAudioFile(file);
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        try {
          console.log('File read successfully, creating blob...');
          const arrayBuffer = reader.result as ArrayBuffer;
          const blob = new Blob([arrayBuffer], { type: file.type });
          console.log('Blob created successfully:', {
            size: `${(blob.size / (1024 * 1024)).toFixed(2)}MB`,
            type: blob.type
          });
          resolve(blob);
        } catch (error) {
          console.error('Error creating blob:', error);
          reject(new Error("Failed to process audio chunk"));
        }
      };
      
      reader.onerror = () => {
        console.error('Error reading file:', reader.error);
        reject(new Error("Failed to read audio file"));
      };

      console.log('Starting to read file as ArrayBuffer...');
      reader.readAsArrayBuffer(file);
    });
  } catch (error) {
    console.error("Error extracting audio chunk:", error);
    throw error;
  }
};
