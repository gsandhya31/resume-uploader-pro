import { useState, useEffect, useRef } from "react";
import { ResumeUpload } from "@/components/ResumeUpload";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSearch, Sparkles, Building2, Loader2, CheckCircle2, AlertTriangle, Lightbulb, Copy, Check, Info } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import FeedbackSection from "@/components/FeedbackSection";

const MIN_JD_LENGTH = 100;

interface TokenUsage {
  input: number;
  output: number;
  total: number;
}

interface RewriteSuggestion {
  original_text: string;
  suggested_rewrite: string;
}

interface AnalysisNote {
  type: "ambiguity" | "warning";
  text: string;
  note: string;
}

interface AnalysisResult {
  matchedSkills: string[];
  missingSkills: string[];
  rewrite_suggestions?: RewriteSuggestion[];
  analysis_notes?: AnalysisNote[];
  usage?: TokenUsage;
}

// GPT-4o-mini pricing: $0.15/1M input, $0.60/1M output
// 1 USD = 85 INR
const calculateCostINR = (usage: TokenUsage): string => {
  const inputCostUSD = (usage.input / 1_000_000) * 0.15;
  const outputCostUSD = (usage.output / 1_000_000) * 0.60;
  const totalCostUSD = inputCostUSD + outputCostUSD;
  const totalCostINR = totalCostUSD * 85;
  return totalCostINR.toFixed(4);
};

const Index = () => {
  const [resumeText, setResumeText] = useState<string>("");
  const [jobDescription, setJobDescription] = useState<string>("");
  const [companyName, setCompanyName] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { toast } = useToast();
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleCopySuggestion = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      toast({
        title: "Copied!",
        description: "Suggestion copied to clipboard",
      });
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  // Auto-scroll to results when analysis is complete
  useEffect(() => {
    if (analysisResult && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [analysisResult]);

  const isResumeUploaded = resumeText.length > 0;
  const isJdValid = jobDescription.length >= MIN_JD_LENGTH;
  const canAnalyze = isResumeUploaded && isJdValid && !isAnalyzing;

  const handleAnalyze = async () => {
    console.log("Request sent: Starting analysis...");
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-resume', {
        body: { resumeText, jobDescription, companyName }
      });

      console.log("Response received:", data);

      if (error) {
        console.error("Analysis error:", error);
        toast({
          title: "Analysis Failed",
          description: error.message || "Failed to analyze resume",
          variant: "destructive",
        });
        return;
      }

      if (data.error) {
        toast({
          title: "Analysis Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      setAnalysisResult(data);
      toast({
        title: "Analysis Complete",
        description: `Found ${data.matchedSkills?.length || 0} matched skills, ${data.missingSkills?.length || 0} missing skills`,
      });
    } catch (err) {
      console.error("Unexpected error:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

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
            onClick={handleAnalyze}
            className="px-8"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze Resume
              </>
            )}
          </Button>
          {!canAnalyze && !isAnalyzing && (
            <p className="mt-3 text-sm text-muted-foreground">
              {!isResumeUploaded && !isJdValid
                ? "Upload a resume and enter a job description to analyze"
                : !isResumeUploaded
                ? "Upload a resume to continue"
                : "Enter at least 100 characters in the job description"}
            </p>
          )}
        </div>

        {/* Results Section */}
        {analysisResult && (
          <div ref={resultsRef} className="mt-16 scroll-mt-4">
            {/* Section Heading */}
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
              Analysis Results
            </h2>

            {/* Analysis Notes Banner */}
            {analysisResult.analysis_notes && analysisResult.analysis_notes.length > 0 ? (
              <div className="mb-6 p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-5 h-5 text-yellow-600" />
                  <h3 className="font-semibold text-yellow-700 dark:text-yellow-500">
                    ⚠️ Analysis Notes: {analysisResult.analysis_notes.length} item{analysisResult.analysis_notes.length > 1 ? 's' : ''} need your attention
                  </h3>
                </div>
                <div className="space-y-3">
                  {analysisResult.analysis_notes.map((note, index) => (
                    <div key={index} className="pl-7 text-sm">
                      <span className="font-bold text-foreground">"{note.text}"</span>
                      <span className="text-muted-foreground"> — {note.note}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-6 p-4 rounded-lg border border-success/30 bg-success/10">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <span className="font-medium text-success">✅ Analysis completed with high confidence.</span>
                </div>
              </div>
            )}

            {/* Side-by-Side Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Matched Skills Card */}
              <Card className="border-success/30 bg-success/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-success">
                    <CheckCircle2 className="w-5 h-5" />
                    Matched Skills
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analysisResult.matchedSkills.length > 0 ? (
                    <ol className="list-decimal list-inside space-y-2 text-foreground">
                      {analysisResult.matchedSkills.map((skill, index) => (
                        <li key={index} className="text-sm">
                          {skill}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      No exact skill matches found between your resume and the job description.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Missing Skills Card */}
              <Card className="border-destructive/30 bg-destructive/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="w-5 h-5" />
                    Missing Skills
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analysisResult.missingSkills && analysisResult.missingSkills.length > 0 ? (
                    <ol className="list-decimal list-inside space-y-2 text-foreground">
                      {analysisResult.missingSkills.map((skill, index) => (
                        <li key={index} className="text-sm">
                          {skill}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle2 className="w-4 h-4" />
                      <p className="font-medium text-sm">Great job! No key skills missing.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Suggested Improvements Section */}
            <div className="mt-8">
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Lightbulb className="w-5 h-5" />
                    Suggested Improvements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analysisResult.rewrite_suggestions && analysisResult.rewrite_suggestions.length > 0 ? (
                    <div className="space-y-4">
                      {analysisResult.rewrite_suggestions.map((suggestion, index) => (
                        <div key={index} className="p-4 rounded-lg bg-background border border-border">
                          <div className="mb-3">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Original</span>
                            <p className="mt-1 text-sm text-muted-foreground italic">
                              "{suggestion.original_text}"
                            </p>
                          </div>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <span className="text-xs font-medium text-primary uppercase tracking-wide">Suggestion</span>
                              <p className="mt-1 text-sm text-foreground font-medium">
                                "{suggestion.suggested_rewrite}"
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopySuggestion(suggestion.suggested_rewrite, index)}
                              className="shrink-0 h-8 w-8 p-0"
                              aria-label="Copy suggestion"
                            >
                              {copiedIndex === index ? (
                                <Check className="w-4 h-4 text-success" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle2 className="w-4 h-4" />
                      <p className="font-medium text-sm">Your resume language already aligns well with this JD.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Safety Disclaimer */}
            <p className="mt-6 text-xs text-muted-foreground text-center">
              Note: AI can make mistakes. Please double-check the results against the actual job description.
            </p>

            {/* Feedback Section */}
            <FeedbackSection />

            {/* Metrics Panel - Footer */}
            {analysisResult.usage && (
              <div className="mt-4 text-center">
                <p className="text-xs text-muted-foreground">
                  Tokens: {analysisResult.usage.input} in / {analysisResult.usage.output} out / {analysisResult.usage.total} total | Est. Cost: ₹{calculateCostINR(analysisResult.usage)}
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;