
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
    // For now, we'll send the entire file since we can't easily slice audio
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer;
          const blob = new Blob([arrayBuffer], { type: file.type });
          resolve(blob);
        } catch (error) {
          reject(new Error("Failed to process audio chunk"));
        }
      };
      
      reader.onerror = () => reject(new Error("Failed to read audio file"));
      reader.readAsArrayBuffer(file);
    });
  } catch (error) {
    console.error("Error extracting audio chunk:", error);
    throw error;
  }
};
