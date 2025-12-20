import { useState, useCallback, useRef } from "react";
import { Upload, FileText, X, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import * as pdfjsLib from "pdfjs-dist";

// Set up the worker for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface ResumeUploadProps {
  onTextExtracted?: (text: string) => void;
}

export function ResumeUpload({ onTextExtracted }: ResumeUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = (file: File): string | null => {
    if (file.type !== "application/pdf") {
      return "Please upload a PDF file only.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size must be less than 5MB.";
    }
    return null;
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      fullText += pageText + "\n";
    }

    return fullText.trim();
  };

  const handleFile = useCallback(
    async (selectedFile: File) => {
      const error = validateFile(selectedFile);
      if (error) {
        toast({
          variant: "destructive",
          title: "Invalid File",
          description: error,
        });
        return;
      }

      setFile(selectedFile);
      setIsProcessing(true);

      try {
        const text = await extractTextFromPDF(selectedFile);
        setResumeText(text);
        onTextExtracted?.(text);
        toast({
          title: "Resume Uploaded",
          description: "Your resume has been successfully processed.",
        });
      } catch (err) {
        console.error("PDF extraction error:", err);
        toast({
          variant: "destructive",
          title: "Processing Error",
          description: "Failed to extract text from the PDF. Please try another file.",
        });
        setFile(null);
      } finally {
        setIsProcessing(false);
      }
    },
    [toast, onTextExtracted]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFile(droppedFile);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        handleFile(selectedFile);
      }
    },
    [handleFile]
  );

  const handleRemove = useCallback(() => {
    setFile(null);
    setResumeText("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="w-full max-w-xl mx-auto">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleInputChange}
        className="hidden"
      />

      {!file ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            relative flex flex-col items-center justify-center
            w-full min-h-[280px] p-8
            rounded-xl border-2 border-dashed
            transition-all duration-200 cursor-pointer
            ${
              isDragOver
                ? "border-primary bg-upload-zone-hover shadow-upload-hover scale-[1.01]"
                : "border-border bg-upload-zone hover:border-upload-border hover:bg-upload-zone-hover hover:shadow-upload"
            }
          `}
          onClick={handleButtonClick}
        >
          <div
            className={`
              flex items-center justify-center w-16 h-16 mb-4
              rounded-full bg-primary/10 text-primary
              transition-transform duration-200
              ${isDragOver ? "scale-110" : ""}
            `}
          >
            <Upload className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-semibold text-foreground mb-2">
            Upload Your Resume
          </h3>
          <p className="text-sm text-muted-foreground text-center mb-4">
            Drag and drop your PDF here, or click to browse
          </p>

          <Button
            type="button"
            variant="default"
            className="gap-2"
            onClick={(e) => {
              e.stopPropagation();
              handleButtonClick();
            }}
          >
            <FileText className="w-4 h-4" />
            Select PDF
          </Button>

          <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>PDF only, max 5MB</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 p-6 rounded-xl bg-card border border-border shadow-upload">
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-10 h-10 text-primary animate-spin-slow mb-4" />
              <p className="text-sm font-medium text-foreground">Processing...</p>
              <p className="text-xs text-muted-foreground mt-1">
                Extracting text from your resume
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRemove}
                  className="flex-shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {resumeText && (
                <div className="mt-2 p-4 rounded-lg bg-muted/50 border border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                    Extracted Text Preview
                  </p>
                  <p className="text-sm text-foreground line-clamp-4 whitespace-pre-wrap">
                    {resumeText.slice(0, 500)}
                    {resumeText.length > 500 && "..."}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {resumeText.length.toLocaleString()} characters extracted
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}