import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface FeedbackSectionProps {
  onSubmitSuccess?: () => void;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const FeedbackSection = ({ onSubmitSuccess }: FeedbackSectionProps) => {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a star rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/analysis_feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({
          rating,
          comment: comment.trim() || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      toast({
        title: "Thank you!",
        description: "Your feedback has been submitted successfully.",
      });

      setIsSubmitted(true);
      onSubmitSuccess?.();
    } catch (error: any) {
      console.error("Feedback submission error:", error);
      toast({
        title: "Submission failed",
        description: "Could not submit feedback. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="mt-6 p-4 border border-border rounded-lg bg-muted/30 text-center">
        <p className="text-sm text-muted-foreground">
          ✓ Thank you for your feedback!
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 p-4 border border-border rounded-lg bg-card">
      <h3 className="text-sm font-medium text-foreground mb-3 text-center">
        Rate this Analysis
      </h3>

      {/* Star Rating */}
      <div className="flex justify-center gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
            aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                star <= (hoveredRating || rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground"
              }`}
            />
          </button>
        ))}
      </div>

      {/* Rating Labels */}
      <div className="flex justify-between text-xs text-muted-foreground mb-4 px-2">
        <span>1 = Low quality</span>
        <span>5 = High quality</span>
      </div>

      {/* Comment Textarea */}
      <Textarea
        placeholder="Any comments or bugs?"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="mb-3 text-sm resize-none"
        rows={2}
      />

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || rating === 0}
        className="w-full"
        size="sm"
      >
        {isSubmitting ? "Submitting..." : "Submit Feedback"}
      </Button>
    </div>
  );
};

export default FeedbackSection;
