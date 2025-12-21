import { useState } from "react";
import { ResumeUpload } from "@/components/ResumeUpload";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileSearch, Sparkles, Building2 } from "lucide-react";

const MIN_JD_LENGTH = 100;

const Index = () => {
  const [resumeText, setResumeText] = useState<string>("");
  const [jobDescription, setJobDescription] = useState<string>("");
  const [companyName, setCompanyName] = useState<string>("");

  const isResumeUploaded = resumeText.length > 0;
  const isJdValid = jobDescription.length >= MIN_JD_LENGTH;
  const canAnalyze = isResumeUploaded && isJdValid;

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
        {/* Resume Upload Section */}
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

        {/* Job Description Section */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              Job Description
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Paste the job description you want to match your resume against.
            </p>
          </div>

          <div className="space-y-3">
            <Textarea
              placeholder="Paste job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="min-h-[200px] resize-y text-sm"
            />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {jobDescription.length} characters
              </span>
              {jobDescription.length > 0 && !isJdValid && (
                <span className="text-destructive">
                  Please enter at least {MIN_JD_LENGTH} characters
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Company Name Section */}
        <div className="mt-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <label className="text-sm font-medium text-foreground">
                Target Company Name (Optional)
              </label>
            </div>
            <Input
              placeholder="e.g., Google, Meta, Stripe..."
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="max-w-md"
            />
            <p className="text-xs text-muted-foreground">
              Enter company name to get LinkedIn networking suggestions.
            </p>
          </div>
        </div>

        {/* Analyze Button */}
        <div className="mt-12 text-center">
          <Button
            size="lg"
            disabled={!canAnalyze}
            className="px-8"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Analyze Match
          </Button>
          {!canAnalyze && (
            <p className="mt-3 text-sm text-muted-foreground">
              {!isResumeUploaded && !isJdValid
                ? "Upload a resume and enter a job description to analyze"
                : !isResumeUploaded
                ? "Upload a resume to continue"
                : "Enter at least 100 characters in the job description"}
            </p>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;