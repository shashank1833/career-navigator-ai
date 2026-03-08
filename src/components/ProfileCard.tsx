import DashboardCard from "./DashboardCard";
import { User, GraduationCap, Code2, Layers } from "lucide-react";
import type { AnalysisProfile, TechnologyCategory } from "@/types/analysis";

function isCategorized(techs: string[] | TechnologyCategory[]): techs is TechnologyCategory[] {
  return techs.length > 0 && typeof techs[0] === "object" && "category" in techs[0];
}

const ProfileCard = ({ data }: { data: AnalysisProfile }) => {
  const displayTagline = data.tagline || `${data.education} • ${data.experience} experience`;

  return (
    <DashboardCard title="Professional Profile" icon={User} delay={0.1} accentColor="accent">
      <div className="space-y-5">
        {/* Header */}
        <div className="text-center">
          <h4 className="text-xl font-bold text-foreground">{data.name}</h4>
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5 mt-1">
            <GraduationCap className="w-3.5 h-3.5" /> {data.education}
          </p>
          <p className="text-sm text-primary font-medium mt-1.5">{displayTagline}</p>
        </div>

        {/* Skills — conceptual expertise */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Code2 className="w-3 h-3" /> Core Expertise
          </p>
          <div className="flex flex-wrap gap-1.5">
            {data.skills.slice(0, 10).map((s) => (
              <span
                key={s}
                className="px-2.5 py-1 text-xs font-medium rounded-md bg-primary/10 text-primary border border-primary/20"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Technologies — organized by category */}
        {data.technologies.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Layers className="w-3 h-3" /> Technologies & Tools
            </p>
            {isCategorized(data.technologies) ? (
              <div className="space-y-3">
                {data.technologies.map((cat) => (
                  <div key={cat.category}>
                    <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-widest mb-1.5">
                      {cat.category}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.items.map((t) => (
                        <span
                          key={t}
                          className="px-2.5 py-1 text-xs font-medium rounded-md bg-secondary/10 text-secondary border border-secondary/20"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {(data.technologies as string[]).map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-1 text-xs font-medium rounded-md bg-secondary/10 text-secondary border border-secondary/20"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardCard>
  );
};

export default ProfileCard;
