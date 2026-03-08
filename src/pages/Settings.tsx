import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain, ArrowLeft, User, Briefcase, Shield, Loader2, Camera, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ThemeToggle from "@/components/ThemeToggle";

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
    display_name: "",
    avatar_url: "",
    preferred_role: "",
    preferred_location: "",
    experience_level: "",
  });
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, preferred_role, preferred_location, experience_level")
        .eq("id", user.id)
        .single();
      if (data) {
        setProfile({
          display_name: data.display_name || "",
          avatar_url: data.avatar_url || "",
          preferred_role: (data as any).preferred_role || "",
          preferred_location: (data as any).preferred_location || "",
          experience_level: (data as any).experience_level || "",
        });
      }
      setLoadingProfile(false);
    };
    fetchProfile();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: profile.display_name || null,
        avatar_url: profile.avatar_url || null,
        preferred_role: profile.preferred_role || null,
        preferred_location: profile.preferred_location || null,
        experience_level: profile.experience_level || null,
      } as any)
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to save profile");
    } else {
      toast.success("Profile saved!");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated!");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );
    if (!confirmed) return;
    toast.error("Account deletion requires admin support. Please contact us.");
  };

  if (authLoading || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const initials = (profile.display_name || user?.email?.split("@")[0] || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="floating-orb w-96 h-96 bg-primary -top-48 -right-48 animate-pulse-glow" />
      <div className="floating-orb w-80 h-80 bg-secondary top-1/3 -left-40 animate-pulse-glow" style={{ animationDelay: "1s" }} />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Brain className="w-7 h-7 glow-text-primary" />
            <h1 className="text-2xl font-extrabold gradient-text">Settings</h1>
          </div>
          <ThemeToggle />
        </motion.header>

        <div className="space-y-6">
          {/* Profile Information */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-card/80 backdrop-blur border-border">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">Profile Information</CardTitle>
                </div>
                <CardDescription>Manage your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className="text-lg bg-primary/10 text-primary">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="avatar_url">Avatar URL</Label>
                    <Input
                      id="avatar_url"
                      placeholder="https://example.com/avatar.jpg"
                      value={profile.avatar_url}
                      onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    placeholder="John Doe"
                    value={profile.display_name}
                    onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input value={user?.email || ""} disabled className="opacity-60" />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Career Preferences */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-card/80 backdrop-blur border-border">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-secondary" />
                  <CardTitle className="text-lg">Career Preferences</CardTitle>
                </div>
                <CardDescription>Set your job search preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="preferred_role">Preferred Job Role</Label>
                  <Input
                    id="preferred_role"
                    placeholder="e.g. Frontend Developer, Data Scientist"
                    value={profile.preferred_role}
                    onChange={(e) => setProfile({ ...profile, preferred_role: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferred_location">Preferred Location</Label>
                  <Input
                    id="preferred_location"
                    placeholder="e.g. Remote, San Francisco, London"
                    value={profile.preferred_location}
                    onChange={(e) => setProfile({ ...profile, preferred_location: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience_level">Experience Level</Label>
                  <Select
                    value={profile.experience_level}
                    onValueChange={(v) => setProfile({ ...profile, experience_level: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your experience level" />
                    </SelectTrigger>
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
              </CardContent>
            </Card>
          </motion.div>

          {/* Save Profile Button */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Button onClick={handleSaveProfile} disabled={saving} className="w-full h-11">
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Save Profile
            </Button>
          </motion.div>

          <Separator />

          {/* Account Settings */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-card/80 backdrop-blur border-border">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-accent" />
                  <CardTitle className="text-lg">Account Settings</CardTitle>
                </div>
                <CardDescription>Manage your account security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleChangePassword} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="new_password">New Password</Label>
                    <Input
                      id="new_password"
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      minLength={6}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">Confirm Password</Label>
                    <Input
                      id="confirm_password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength={6}
                      required
                    />
                  </div>
                  <Button type="submit" variant="outline" disabled={changingPassword}>
                    {changingPassword && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Change Password
                  </Button>
                </form>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium text-destructive mb-2">Danger Zone</h4>
                  <Button variant="destructive" size="sm" onClick={handleDeleteAccount}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
