import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Briefcase, Shield, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
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
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

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
    if (error) { toast.error("Failed to save profile"); }
    else { toast.success("Profile saved!"); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error("Passwords don't match"); return; }
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) { toast.error(error.message); }
    else { toast.success("Password updated!"); setNewPassword(""); setConfirmPassword(""); }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm("Are you sure you want to delete your account? This action cannot be undone.");
    if (!confirmed) return;
    toast.error("Account deletion requires admin support. Please contact us.");
  };

  if (authLoading || loadingProfile) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const initials = (profile.display_name || user?.email?.split("@")[0] || "U")
    .split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-foreground tracking-tight">Settings</h1>
        <p className="text-[11px] text-muted-foreground mt-1 uppercase tracking-wider">Manage your profile, preferences, and security</p>
      </div>

      <Accordion type="single" collapsible className="space-y-4">
        <AccordionItem value="profile" className="border-none">
          <div className="ed-card">
            <AccordionTrigger className="hover:no-underline p-0 [&[data-state=open]>svg]:rotate-180">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-muted">
                  <User className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <div className="text-left">
                  <p className="text-[13px] font-medium text-foreground">Profile Information</p>
                  <p className="text-[11px] text-muted-foreground font-normal">Manage your personal details</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pt-4 space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-14 h-14">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className="text-[13px] bg-teal-light text-primary font-mono">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="avatar_url" className="ed-label">Avatar URL</Label>
                    <Input id="avatar_url" placeholder="https://example.com/avatar.jpg" value={profile.avatar_url} onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })} className="border-border text-[13px]" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="display_name" className="ed-label">Display Name</Label>
                  <Input id="display_name" placeholder="John Doe" value={profile.display_name} onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} className="border-border text-[13px]" />
                </div>
                <div className="space-y-1.5">
                  <Label className="ed-label">Email Address</Label>
                  <Input value={user?.email || ""} disabled className="opacity-60 border-border text-[13px]" />
                  <p className="text-[10px] text-muted-foreground">Email cannot be changed</p>
                </div>
              </div>
            </AccordionContent>
          </div>
        </AccordionItem>

        <AccordionItem value="career" className="border-none">
          <div className="ed-card">
            <AccordionTrigger className="hover:no-underline p-0 [&[data-state=open]>svg]:rotate-180">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-muted">
                  <Briefcase className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <div className="text-left">
                  <p className="text-[13px] font-medium text-foreground">Career Preferences</p>
                  <p className="text-[11px] text-muted-foreground font-normal">Set your job search preferences</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pt-4 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="preferred_role" className="ed-label">Preferred Job Role</Label>
                  <Input id="preferred_role" placeholder="e.g. Frontend Developer" value={profile.preferred_role} onChange={(e) => setProfile({ ...profile, preferred_role: e.target.value })} className="border-border text-[13px]" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="preferred_location" className="ed-label">Preferred Location</Label>
                  <Input id="preferred_location" placeholder="e.g. Remote, San Francisco" value={profile.preferred_location} onChange={(e) => setProfile({ ...profile, preferred_location: e.target.value })} className="border-border text-[13px]" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="experience_level" className="ed-label">Experience Level</Label>
                  <Select value={profile.experience_level} onValueChange={(v) => setProfile({ ...profile, experience_level: v })}>
                    <SelectTrigger className="border-border text-[13px]"><SelectValue placeholder="Select your experience level" /></SelectTrigger>
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
          <div className="ed-card">
            <AccordionTrigger className="hover:no-underline p-0 [&[data-state=open]>svg]:rotate-180">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-muted">
                  <Shield className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <div className="text-left">
                  <p className="text-[13px] font-medium text-foreground">Account Settings</p>
                  <p className="text-[11px] text-muted-foreground font-normal">Manage your account security</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pt-4 space-y-4">
                <form onSubmit={handleChangePassword} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="new_password" className="ed-label">New Password</Label>
                    <Input id="new_password" type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} required className="border-border text-[13px]" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm_password" className="ed-label">Confirm Password</Label>
                    <Input id="confirm_password" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={6} required className="border-border text-[13px]" />
                  </div>
                  <button type="submit" className="ed-btn text-[11px]" disabled={changingPassword}>
                    {changingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Change Password
                  </button>
                </form>
                <Separator className="bg-border" />
                <div>
                  <p className="ed-label text-destructive mb-2">Danger Zone</p>
                  <Button variant="destructive" size="sm" onClick={handleDeleteAccount} className="text-[11px]">
                    <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete Account
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </div>
        </AccordionItem>
      </Accordion>

      <div className="mt-6">
        <Button onClick={handleSaveProfile} disabled={saving} className="w-full h-10 text-[13px] bg-primary hover:bg-primary/90 text-primary-foreground transition-colors duration-150">
          {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          Save Profile
        </Button>
      </div>
    </div>
  );
};

export default Settings;
