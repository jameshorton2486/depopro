
import { TranscriptFormatter } from "./types";
import { DefaultFormatter } from "./formatters/DefaultFormatter";
import { LegalFormatter } from "./formatters/LegalFormatter";
import { ScreenplayFormatter } from "./formatters/ScreenplayFormatter";

export type FormatterType = "default" | "legal" | "screenplay";

export class FormatterFactory {
  private static formatters: Record<FormatterType, TranscriptFormatter> = {
    default: new DefaultFormatter(),
    legal: new LegalFormatter(),
    screenplay: new ScreenplayFormatter()
  };

  static getFormatter(type: FormatterType): TranscriptFormatter {
    return this.formatters[type] || this.formatters.default;
  }
}
