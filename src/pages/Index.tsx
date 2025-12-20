import { useState } from "react";
import { ResumeUpload } from "@/components/ResumeUpload";
import { FileSearch } from "lucide-react";

const Index = () => {
  const [resumeText, setResumeText] = useState<string>("");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground">
              <FileSearch className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">
                Resume-JD Matcher
              </h1>
              <p className="text-xs text-muted-foreground">
                Optimize your resume for any job
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Upload Your Resume
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Start by uploading your resume in PDF format. We'll extract the text
            to analyze it against job descriptions.
          </p>
        </div>

        <ResumeUpload onTextExtracted={setResumeText} />

        {/* Status indicator */}
        {resumeText && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 text-success text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse-gentle" />
              Resume text extracted and ready
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;