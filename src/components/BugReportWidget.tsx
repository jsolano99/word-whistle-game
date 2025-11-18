import { useState, useRef } from "react";
import { Bug, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const BugReportWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [bugDescription, setBugDescription] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setScreenshot(file);
    }
  };

  const handleSubmit = async () => {
    if (!bugDescription.trim()) {
      toast.error("Please describe the bug");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('description', bugDescription);
      formData.append('url', window.location.href);
      formData.append('userAgent', navigator.userAgent);
      
      if (userEmail.trim()) {
        formData.append('userEmail', userEmail);
      }
      
      if (screenshot) {
        formData.append('screenshot', screenshot);
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-bug-report`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to submit bug report');
      }

      toast.success("Bug report submitted successfully!");
      setBugDescription("");
      setUserEmail("");
      setScreenshot(null);
      setIsOpen(false);
    } catch (error) {
      toast.error("Failed to submit bug report");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-destructive text-destructive-foreground shadow-lg hover:bg-destructive/90 transition-all hover:scale-110 flex items-center justify-center z-50"
        aria-label="Report bug"
      >
        <Bug className="w-5 h-5" />
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report a Bug</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Describe the bug
              </label>
              <Textarea
                placeholder="Please describe what went wrong..."
                value={bugDescription}
                onChange={(e) => setBugDescription(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Your email (optional)
              </label>
              <input
                type="email"
                placeholder="your@email.com"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-xs text-muted-foreground mt-1">
                We'll send you a thank you note for helping us improve
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Screenshot (optional)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {screenshot ? (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <span className="text-sm flex-1 truncate">{screenshot.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setScreenshot(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Screenshot
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Your bug report will be sent to the development team for review.
            </p>
            <Button 
              onClick={handleSubmit} 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Bug Report"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
