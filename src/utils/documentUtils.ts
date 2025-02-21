
export const createAndDownloadWordDoc = (content: string) => {
  // Create a Blob with the content
  const blob = new Blob([content], { type: 'application/msword' });
  
  // Create download link
  const element = document.createElement('a');
  element.href = URL.createObjectURL(blob);
  
  // Set filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  element.download = `transcript-${timestamp}.doc`;
  
  // Append to document, trigger download, and cleanup
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  URL.revokeObjectURL(element.href);
};
