import DashboardCard from "./DashboardCard";
import { User, GraduationCap, Briefcase, Code2 } from "lucide-react";

const mockProfile = {
  name: "Alex Johnson",
  education: "M.S. Computer Science, Stanford University",
  experience: "4 years",
  skills: ["React", "TypeScript", "Python", "Node.js", "AWS", "Docker", "PostgreSQL", "GraphQL"],
  technologies: ["TensorFlow", "Kubernetes", "Redis", "MongoDB", "CI/CD"],
};

const ProfileCard = () => {
  return (
    <DashboardCard title="Professional Profile" icon={User} delay={0.1} accentColor="accent">
      <div className="space-y-4">
        <div>
          <h4 className="text-xl font-bold text-foreground">{mockProfile.name}</h4>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
            <GraduationCap className="w-3.5 h-3.5" /> {mockProfile.education}
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
            <Briefcase className="w-3.5 h-3.5" /> {mockProfile.experience} experience
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Code2 className="w-3 h-3" /> Skills
          </p>
          <div className="flex flex-wrap gap-1.5">
            {mockProfile.skills.map((s) => (
              <span key={s} className="px-2.5 py-1 text-xs font-medium rounded-md bg-primary/10 text-primary border border-primary/20">
                {s}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Technologies</p>
          <div className="flex flex-wrap gap-1.5">
            {mockProfile.technologies.map((t) => (
              <span key={t} className="px-2.5 py-1 text-xs font-medium rounded-md bg-secondary/10 text-secondary border border-secondary/20">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </DashboardCard>
  );
};

export default ProfileCard;
