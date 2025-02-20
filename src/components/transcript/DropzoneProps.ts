
import type { DropzoneOptions, DropzoneInputProps } from "react-dropzone";

export interface DropzoneProps {
  getRootProps: () => React.HTMLAttributes<HTMLElement>;
  getInputProps: () => DropzoneInputProps;
  isDragActive: boolean;
}
