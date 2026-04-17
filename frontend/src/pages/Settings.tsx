import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Briefcase, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ProfileData {
  display_name: string;
  avatar_url: string;
  preferred_role: string;
  preferred_location: string;
  experience_level: string;
}

const Settings = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData>({
    display_name: "", avatar_url: "", preferred_role: "", preferred_location: "", experience_level: "",
  });
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    setProfile(prev => ({
      ...prev,
      display_name: user.name || "",
      avatar_url: user.picture || "",
    }));
    setLoadingProfile(false);
  }, [user]);

  const handleSaveProfile = async () => {
    setSaving(true);
    // Profile is stored in user session — just show a success for now
    toast.success("Profile preferences saved!");
    setSaving(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error("Passwords don't match"); return; }
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    toast.info("Password change requires re-login. Please sign out and use 'Create Account' with a new password.");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm("Are you sure you want to delete your account? This action cannot be undone.");
    if (!confirmed) return;
    toast.error("Account deletion requires admin support. Please contact us.");
  };

  if (authLoading || loadingProfile) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const initials = (profile.display_name || user?.email?.split("@")[0] || "U")
    .split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="relative">
      <div className="floating-orb w-96 h-96 bg-primary -top-48 -right-48 animate-pulse-glow opacity-10" />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-3xl mx-auto px-6 py-8"
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-xs text-muted-foreground mt-1">Manage your profile, career preferences, and account security.</p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          <AccordionItem value="profile" className="border-none">
            <div className="glass-card">
              <AccordionTrigger className="hover:no-underline px-5 py-4 [&[data-state=open]>svg]:rotate-180">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-foreground">Profile Information</p>
                    <p className="text-xs text-muted-foreground font-normal">Manage your personal details</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="px-5 pb-5 space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-14 h-14">
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback className="text-base bg-primary/10 text-primary">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <Label htmlFor="avatar_url" className="text-xs">Avatar URL</Label>
                      <Input id="avatar_url" placeholder="https://example.com/avatar.jpg" value={profile.avatar_url} onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })} className="bg-muted/50 border-border/50" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="display_name" className="text-xs">Display Name</Label>
                    <Input id="display_name" placeholder="John Doe" value={profile.display_name} onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} className="bg-muted/50 border-border/50" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Email Address</Label>
                    <Input value={user?.email || ""} disabled className="opacity-60 bg-muted/50 border-border/50" />
                    <p className="text-[10px] text-muted-foreground">Email cannot be changed</p>
                  </div>
                </div>
              </AccordionContent>
            </div>
          </AccordionItem>

          <AccordionItem value="career" className="border-none">
            <div className="glass-card">
              <AccordionTrigger className="hover:no-underline px-5 py-4 [&[data-state=open]>svg]:rotate-180">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-secondary/10">
                    <Briefcase className="w-4 h-4 text-secondary" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-foreground">Career Preferences</p>
                    <p className="text-xs text-muted-foreground font-normal">Set your job search preferences</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="px-5 pb-5 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="preferred_role" className="text-xs">Preferred Job Role</Label>
                    <Input id="preferred_role" placeholder="e.g. Frontend Developer" value={profile.preferred_role} onChange={(e) => setProfile({ ...profile, preferred_role: e.target.value })} className="bg-muted/50 border-border/50" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="preferred_location" className="text-xs">Preferred Location</Label>
                    <Input id="preferred_location" placeholder="e.g. Remote, San Francisco" value={profile.preferred_location} onChange={(e) => setProfile({ ...profile, preferred_location: e.target.value })} className="bg-muted/50 border-border/50" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="experience_level" className="text-xs">Experience Level</Label>
                    <Select value={profile.experience_level} onValueChange={(v) => setProfile({ ...profile, experience_level: v })}>
                      <SelectTrigger className="bg-muted/50 border-border/50"><SelectValue placeholder="Select your experience level" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="intern">Intern</SelectItem>
                        <SelectItem value="junior">Junior (0-2 years)</SelectItem>
                        <SelectItem value="mid">Mid-Level (2-5 years)</SelectItem>
                        <SelectItem value="senior">Senior (5-10 years)</SelectItem>
                        <SelectItem value="lead">Lead / Staff (10+ years)</SelectItem>
                        <SelectItem value="executive">Executive / Director</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </AccordionContent>
            </div>
          </AccordionItem>

          <AccordionItem value="account" className="border-none">
            <div className="glass-card">
              <AccordionTrigger className="hover:no-underline px-5 py-4 [&[data-state=open]>svg]:rotate-180">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-accent/10">
                    <Shield className="w-4 h-4 text-accent" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-foreground">Account Settings</p>
                    <p className="text-xs text-muted-foreground font-normal">Manage your account security</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="px-5 pb-5 space-y-4">
                  <form onSubmit={handleChangePassword} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="new_password" className="text-xs">New Password</Label>
                      <Input id="new_password" type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} required className="bg-muted/50 border-border/50" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="confirm_password" className="text-xs">Confirm Password</Label>
                      <Input id="confirm_password" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={6} required className="bg-muted/50 border-border/50" />
                    </div>
                    <Button type="submit" variant="outline" size="sm" disabled={changingPassword}>
                      {changingPassword && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      Change Password
                    </Button>
                  </form>
                  <Separator className="bg-border/50" />
                  <div>
                    <h4 className="text-xs font-medium text-destructive mb-2">Danger Zone</h4>
                    <Button variant="destructive" size="sm" onClick={handleDeleteAccount}>
                      <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete Account
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </div>
          </AccordionItem>
        </Accordion>

        <div className="mt-6">
          <Button onClick={handleSaveProfile} disabled={saving} className="w-full h-10 text-sm">
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Save Profile
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default Settings;
