
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Youtube, FileAudio, Download, RotateCcw, Play } from "lucide-react";
import { useTranscription } from '@/hooks/useTranscription';

// Simple file dropzone component
const FileDropzone = ({ onDrop }: { onDrop: (files: File[]) => void }) => {
  const [isDragging, setIsDragging] = useState(false);
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) {
      onDrop(Array.from(e.dataTransfer.files));
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      onDrop(Array.from(e.target.files));
    }
  };
  
  return (
    <div
      className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
        isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/20'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById('file-input')?.click()}
    >
      <FileAudio className="mx-auto h-12 w-12 text-muted-foreground" />
      <p className="mt-2 font-medium">Drag and drop an audio file or click to browse</p>
      <p className="text-sm text-muted-foreground mt-1">Supports MP3, WAV, M4A, MP4 (up to 100MB)</p>
      <input 
        id="file-input" 
        type="file" 
        className="hidden" 
        accept="audio/mp3,audio/mpeg,audio/wav,audio/x-m4a,audio/m4a,audio/mp4" 
        onChange={handleFileChange} 
      />
    </div>
  );
};

const TranscriptionComponent: React.FC = () => {
  const {
    uploadedFile,
    audioUrl,
    handleUrlChange,
    isYouTubeUrl,
    currentSource,
    setCurrentSource,
    transcript,
    transcriptionResult,
    isProcessing,
    processingStatus,
    progress,
    options,
    onModelChange,
    onDrop,
    handleTranscribe,
    resetTranscription,
    handleDownload
  } = useTranscription();

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Audio Transcription</h1>
      
      <Tabs 
        defaultValue={currentSource || "file"} 
        onValueChange={(value) => setCurrentSource(value as "file" | "url" | null)}
        className="mb-6"
      >
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="file">Upload Audio File</TabsTrigger>
          <TabsTrigger value="url">Transcribe from URL</TabsTrigger>
        </TabsList>
        
        <TabsContent value="file" className="mt-0">
          {uploadedFile ? (
            <Card>
              <CardHeader>
                <CardTitle>Selected File</CardTitle>
                <CardDescription>
                  {uploadedFile.name} ({Math.round(uploadedFile.size / 1024)} KB)
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button variant="outline" onClick={() => onDrop([])}>
                  Change File
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <FileDropzone onDrop={onDrop} />
          )}
        </TabsContent>
        
        <TabsContent value="url" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Enter Audio URL</CardTitle>
              <CardDescription>
                Enter a direct URL to an audio file or a YouTube video URL
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Input
                  value={audioUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://example.com/audio.mp3 or YouTube URL"
                  className="flex-1"
                />
                {isYouTubeUrl(audioUrl) && (
                  <Youtube className="h-5 w-5 text-red-500 flex-shrink-0" />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="md:col-span-3">
          <Button 
            onClick={handleTranscribe} 
            disabled={isProcessing || (!uploadedFile && !audioUrl)}
            className="w-full"
            size="lg"
          >
            {isProcessing ? processingStatus : "Transcribe Audio"}
            {isProcessing ? null : <Play className="ml-2 h-4 w-4" />}
          </Button>
        </div>
        
        <div>
          <Select value={options.model} onValueChange={onModelChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nova-2">Nova (Best)</SelectItem>
              <SelectItem value="enhanced">Enhanced</SelectItem>
              <SelectItem value="base">Base</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {isProcessing && (
        <Progress value={progress} className="mb-6" />
      )}
      
      {transcript && (
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Transcript</CardTitle>
              <CardDescription>
                {transcriptionResult?.metadata?.audioLength && (
                  <>Duration: {Math.round(transcriptionResult.metadata.audioLength)} seconds</>
                )}
                {transcriptionResult?.metadata?.speakers && transcriptionResult.metadata.speakers > 1 && (
                  <> • {transcriptionResult.metadata.speakers} speakers detected</>
                )}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={resetTranscription}
                title="Clear transcript"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => handleDownload(transcript)}
                title="Download transcript"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto whitespace-pre-wrap">
              {transcript}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TranscriptionComponent;
