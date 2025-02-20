
export const getAudioDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const objectUrl = URL.createObjectURL(file);
    
    audio.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(objectUrl);
      resolve(audio.duration);
    });
    
    audio.addEventListener('error', (error) => {
      URL.revokeObjectURL(objectUrl);
      reject(error);
    });
    
    audio.src = objectUrl;
  });
};

export const extractAudioChunk = async (file: File, start: number, end: number): Promise<Blob> => {
  try {
    const reader = new FileReader();
    const chunk = file.slice(0, file.size); // For now, send the entire file as we can't easily slice audio
    
    return new Promise((resolve, reject) => {
      reader.onload = () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer;
          const blob = new Blob([arrayBuffer], { type: file.type });
          resolve(blob);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(chunk);
    });
  } catch (error) {
    console.error("Error extracting audio chunk:", error);
    throw error;
  }
};
