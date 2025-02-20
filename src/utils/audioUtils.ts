
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

export const extractAudioChunk = async (file: File): Promise<Blob> => {
  try {
    console.log('Starting audio chunk extraction for file:', file.name);
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        try {
          console.log('File read successfully, creating blob...');
          const arrayBuffer = reader.result as ArrayBuffer;
          const blob = new Blob([arrayBuffer], { type: file.type });
          console.log('Blob created successfully:', {
            size: blob.size,
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
