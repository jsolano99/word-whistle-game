import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const GATSBY_PASSWORD_KEY = "gatsby_mode_password";

const GatsbySettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  const verifyPassword = () => {
    const storedPassword = localStorage.getItem(GATSBY_PASSWORD_KEY);
    
    if (!storedPassword) {
      setIsVerified(true);
      toast({
        title: "No password set",
        description: "You can now set a new password",
      });
      return;
    }

    if (currentPassword === storedPassword) {
      setIsVerified(true);
      toast({
        title: "Password verified",
        description: "You can now change your password",
      });
    } else {
      toast({
        title: "Incorrect password",
        description: "Please enter the correct current password",
        variant: "destructive",
      });
    }
  };

  const changePassword = () => {
    if (!newPassword.trim()) {
      toast({
        title: "Invalid password",
        description: "Password cannot be empty",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords match",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem(GATSBY_PASSWORD_KEY, newPassword);
    toast({
      title: "Password changed",
      description: "Your password has been updated successfully",
    });

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setIsVerified(false);
    navigate("/?gatsby=true");
  };

  return (
    <div className="min-h-screen bg-gradient-game flex items-center justify-center p-4">
      <Card className="p-8 md:p-12 w-full max-w-md space-y-6 shadow-card">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Settings
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/?gatsby=true")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>

        {!isVerified ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Password</label>
              <Input
                type="password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && verifyPassword()}
              />
            </div>
            <Button onClick={verifyPassword} className="w-full">
              Verify Password
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">New Password</label>
              <Input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirm New Password</label>
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && changePassword()}
              />
            </div>
            <Button onClick={changePassword} className="w-full">
              Change Password
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default GatsbySettings;
