
import { DropzoneOptions } from "react-dropzone";

export interface DropzoneProps extends Partial<DropzoneOptions> {
  getRootProps: <T extends HTMLElement = HTMLElement>() => React.HTMLAttributes<T>;
  getInputProps: <T extends HTMLElement = HTMLElement>() => React.InputHTMLAttributes<T>;
}
