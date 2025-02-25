
import { describe, it, expect } from 'vitest';
import { enforceOptions } from '../options';

describe('Options enforcement', () => {
  it('should enforce required options', () => {
    const userOptions = { model: 'nova-2', diarize: false };
    const result = enforceOptions(userOptions);
    
    expect(result).toEqual({
      model: 'nova-2',
      diarize: true,
      punctuate: true,
      smart_format: true,
      paragraphs: true,
      filler_words: true,
      utterances: true
    });
  });

  it('should preserve additional user options', () => {
    const userOptions = {
      model: 'nova-2',
      keywords: ['test'],
      utteranceThreshold: 0.5
    };
    const result = enforceOptions(userOptions);
    
    expect(result).toEqual({
      model: 'nova-2',
      keywords: ['test'],
      utteranceThreshold: 0.5,
      diarize: true,
      punctuate: true,
      smart_format: true,
      paragraphs: true,
      filler_words: true,
      utterances: true
    });
  });
});
