
import { DeepgramResponse, TranscriptionResult } from "@/types/deepgram";
import { BaseFormatter } from "./BaseFormatter";
import { LEGAL_ABBREVIATIONS } from "@/services/legal/legalAbbreviations";

export class LegalFormatter extends BaseFormatter {
  format(data: DeepgramResponse): TranscriptionResult {
    const paragraphs = data.results.channels[0].alternatives[0].paragraphs?.paragraphs || [];
    let transcript = data.results.channels[0].alternatives[0].transcript;

    // Replace legal abbreviations
    Object.entries(LEGAL_ABBREVIATIONS).forEach(([category, abbreviations]) => {
      Object.entries(abbreviations).forEach(([abbr, full]) => {
        const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
        transcript = transcript.replace(regex, full);
      });
    });

    return {
      transcript,
      paragraphs: paragraphs,
      metadata: {
        processingTime: data.metadata.processing_time,
        audioLength: this.getAudioDuration(data),
        speakers: this.getSpeakerCount(data),
        fillerWords: this.countFillerWords(data)
      }
    };
  }
}
