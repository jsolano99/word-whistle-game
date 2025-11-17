import { useState } from "react";
import { Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const BugReportWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [bugDescription, setBugDescription] = useState("");

  const handleSubmit = () => {
    if (!bugDescription.trim()) {
      toast.error("Please describe the bug");
      return;
    }

    // Create mailto link with bug description
    const subject = encodeURIComponent("Bug Report - Chameleon Game");
    const body = encodeURIComponent(`Bug Description:\n\n${bugDescription}\n\n---\nReported from: ${window.location.href}\nUser Agent: ${navigator.userAgent}\nTimestamp: ${new Date().toISOString()}`);
    const mailtoLink = `mailto:jacob.solano99@gmail.com?subject=${subject}&body=${body}`;
    
    // Open email client
    window.location.href = mailtoLink;
    
    toast.success("Opening email client...");
    setBugDescription("");
    setIsOpen(false);
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
            <p className="text-xs text-muted-foreground">
              This will open your email client to send the bug report. You can attach screenshots manually in the email.
            </p>
            <Button onClick={handleSubmit} className="w-full">
              Send Bug Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
