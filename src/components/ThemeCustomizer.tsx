import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Palette, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const ACCENT_PRESETS = [
  { name: "Ocean", primary: "217 91% 60%", accent: "187 92% 49%", secondary: "263 70% 50%" },
  { name: "Violet", primary: "263 70% 55%", accent: "280 65% 60%", secondary: "217 91% 60%" },
  { name: "Emerald", primary: "160 84% 39%", accent: "142 71% 45%", secondary: "187 92% 49%" },
  { name: "Sunset", primary: "25 95% 53%", accent: "45 93% 47%", secondary: "0 84% 60%" },
  { name: "Rose", primary: "340 82% 52%", accent: "325 78% 60%", secondary: "263 70% 50%" },
  { name: "Cyan", primary: "187 92% 49%", accent: "199 89% 48%", secondary: "217 91% 60%" },
];

interface ThemeSettings {
  preset: string;
  blurIntensity: number;
  animationIntensity: string;
}

const getStoredSettings = (): ThemeSettings => {
  try {
    const stored = localStorage.getItem("theme_customizer");
    if (stored) return JSON.parse(stored);
  } catch {}
  return { preset: "Ocean", blurIntensity: 20, animationIntensity: "medium" };
};

const ThemeCustomizer = () => {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<ThemeSettings>(getStoredSettings);

  const applyPreset = (preset: typeof ACCENT_PRESETS[0]) => {
    const root = document.documentElement;
    root.style.setProperty("--primary", preset.primary);
    root.style.setProperty("--accent", preset.accent);
    root.style.setProperty("--secondary", preset.secondary);
    root.style.setProperty("--ring", preset.primary);
    root.style.setProperty("--glow-primary", preset.primary);
    root.style.setProperty("--glow-secondary", preset.secondary);
    root.style.setProperty("--glow-accent", preset.accent);
    root.style.setProperty("--sidebar-primary", preset.primary);
    root.style.setProperty("--sidebar-ring", preset.primary);
  };

  const applyBlur = (value: number) => {
    document.documentElement.style.setProperty("--glass-blur", `${value}px`);
  };

  useEffect(() => {
    const preset = ACCENT_PRESETS.find(p => p.name === settings.preset);
    if (preset) applyPreset(preset);
    applyBlur(settings.blurIntensity);
    document.documentElement.setAttribute("data-animation", settings.animationIntensity);
    localStorage.setItem("theme_customizer", JSON.stringify(settings));
  }, [settings]);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-lg hover:bg-primary/20 shadow-lg"
        style={{ boxShadow: "0 0 20px hsl(var(--primary) / 0.2)" }}
      >
        <Palette className="w-5 h-5 text-primary" />
      </Button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-80 bg-card border-l border-border p-6 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Customize Theme</h3>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Accent Color */}
              <div className="space-y-3 mb-8">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Accent Color</Label>
                <div className="grid grid-cols-3 gap-2">
                  {ACCENT_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => setSettings(s => ({ ...s, preset: preset.name }))}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all",
                        settings.preset === preset.name
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border hover:border-primary/30 hover:bg-muted/30"
                      )}
                    >
                      <div className="flex gap-0.5">
                        <div className="w-4 h-4 rounded-full" style={{ background: `hsl(${preset.primary})` }} />
                        <div className="w-4 h-4 rounded-full" style={{ background: `hsl(${preset.accent})` }} />
                        <div className="w-4 h-4 rounded-full" style={{ background: `hsl(${preset.secondary})` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Blur Intensity */}
              <div className="space-y-3 mb-8">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Card Blur Intensity</Label>
                <Slider
                  value={[settings.blurIntensity]}
                  onValueChange={([v]) => setSettings(s => ({ ...s, blurIntensity: v }))}
                  min={0}
                  max={40}
                  step={5}
                />
                <p className="text-[10px] text-muted-foreground">{settings.blurIntensity}px blur</p>
              </div>

              {/* Animation Intensity */}
              <div className="space-y-3 mb-8">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Animation Intensity</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["low", "medium", "high"] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setSettings(s => ({ ...s, animationIntensity: level }))}
                      className={cn(
                        "py-2 px-3 rounded-lg border text-xs capitalize transition-all",
                        settings.animationIntensity === level
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border text-muted-foreground hover:border-primary/30"
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset */}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  setSettings({ preset: "Ocean", blurIntensity: 20, animationIntensity: "medium" });
                  document.documentElement.style.removeProperty("--primary");
                  document.documentElement.style.removeProperty("--accent");
                  document.documentElement.style.removeProperty("--secondary");
                  document.documentElement.style.removeProperty("--ring");
                  document.documentElement.style.removeProperty("--glow-primary");
                  document.documentElement.style.removeProperty("--glow-secondary");
                  document.documentElement.style.removeProperty("--glow-accent");
                  document.documentElement.style.removeProperty("--sidebar-primary");
                  document.documentElement.style.removeProperty("--sidebar-ring");
                  document.documentElement.style.removeProperty("--glass-blur");
                }}
              >
                Reset to Default
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default ThemeCustomizer;
