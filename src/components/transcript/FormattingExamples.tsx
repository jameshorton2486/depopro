
import React from 'react';
import { PUNCTUATION_EXAMPLES } from '@/services/transcriptProcessing';
import { Card } from "@/components/ui/card";

const FormattingExamples = () => {
  return (
    <div className="space-y-6">
      {Object.entries(PUNCTUATION_EXAMPLES).map(([type, data]) => (
        <Card key={type} className="p-4">
          <h3 className="font-semibold text-lg mb-2 capitalize">{type}</h3>
          <p className="text-muted-foreground mb-4">{data.rule}</p>
          <div className="space-y-4">
            {data.examples.map((example, index) => (
              <div key={index} className="space-y-2">
                {example.correct && (
                  <div className="p-2 bg-green-50 dark:bg-green-900/10 rounded">
                    <span className="font-medium text-green-600 dark:text-green-400">Correct: </span>
                    {example.correct}
                  </div>
                )}
                {example.incorrect && (
                  <div className="p-2 bg-red-50 dark:bg-red-900/10 rounded">
                    <span className="font-medium text-red-600 dark:text-red-400">Incorrect: </span>
                    {example.incorrect}
                  </div>
                )}
                {example.note && (
                  <p className="text-sm text-muted-foreground italic">
                    Note: {example.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
};

export default FormattingExamples;
