import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { RESUME_TEMPLATES, type TemplateStyle, type ResumeTemplate } from "@/lib/resume-templates";

interface TemplateSelectorProps {
  selected: TemplateStyle;
  onSelect: (template: TemplateStyle) => void;
}

const TemplatePreviewCard = ({ 
  template, 
  isSelected, 
  onClick 
}: { 
  template: ResumeTemplate; 
  isSelected: boolean; 
  onClick: () => void;
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative cursor-pointer rounded-lg border-2 transition-all duration-200 overflow-hidden",
        isSelected 
          ? "border-primary shadow-lg shadow-primary/20" 
          : "border-border hover:border-primary/50"
      )}
    >
      {/* Template Preview */}
      <div className="aspect-[8.5/11] bg-white p-3 relative">
        <TemplatePreviewMini template={template} />
        
        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
      
      {/* Template info */}
      <div className="p-3 bg-card border-t border-border">
        <h4 className="font-semibold text-sm text-foreground">{template.name}</h4>
        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
          {template.description}
        </p>
      </div>
    </motion.div>
  );
};

// Mini preview of the template structure
const TemplatePreviewMini = ({ template }: { template: ResumeTemplate }) => {
  const { colors, layout } = template;
  
  if (layout.columns === 2) {
    // Two-column layout (Creative)
    return (
      <div className="h-full flex gap-2 text-[4px]">
        {/* Sidebar */}
        <div 
          className="w-1/3 p-2 rounded-sm"
          style={{ backgroundColor: colors.primary + "15" }}
        >
          {/* Name */}
          <div 
            className="h-2 w-full rounded-sm mb-2"
            style={{ backgroundColor: colors.primary }}
          />
          {/* Contact lines */}
          <div className="space-y-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-1 w-full rounded-sm bg-gray-300" />
            ))}
          </div>
          {/* Skills section */}
          <div 
            className="h-1.5 w-3/4 rounded-sm mt-3 mb-1"
            style={{ backgroundColor: colors.primary }}
          />
          <div className="flex flex-wrap gap-0.5">
            {[...Array(6)].map((_, i) => (
              <div 
                key={i} 
                className="h-1 rounded-sm"
                style={{ 
                  width: `${20 + Math.random() * 30}%`,
                  backgroundColor: colors.accent + "40"
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1 p-1">
          {/* Experience */}
          <div 
            className="h-1.5 w-1/2 rounded-sm mb-1"
            style={{ backgroundColor: colors.primary }}
          />
          {[...Array(2)].map((_, i) => (
            <div key={i} className="mb-2">
              <div className="h-1 w-3/4 bg-gray-400 rounded-sm mb-0.5" />
              <div className="h-0.5 w-1/2 bg-gray-300 rounded-sm mb-0.5" />
              {[...Array(2)].map((_, j) => (
                <div key={j} className="h-0.5 w-full bg-gray-200 rounded-sm mb-0.5" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // Single column layouts
  return (
    <div className="h-full p-1 text-[4px]">
      {/* Header */}
      <div 
        className={cn(
          "mb-2 pb-1",
          layout.headerStyle === "centered" && "text-center",
          layout.sectionStyle === "underline" && "border-b-2"
        )}
        style={{ 
          borderColor: layout.sectionStyle === "underline" ? colors.primary : "transparent"
        }}
      >
        <div 
          className={cn(
            "h-2 rounded-sm mb-1",
            layout.headerStyle === "centered" ? "w-1/2 mx-auto" : "w-2/3"
          )}
          style={{ backgroundColor: colors.primary }}
        />
        <div className="flex gap-1 justify-center">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-0.5 w-8 bg-gray-300 rounded-sm" />
          ))}
        </div>
      </div>
      
      {/* Summary */}
      <div className="mb-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-0.5 w-full bg-gray-200 rounded-sm mb-0.5" />
        ))}
      </div>
      
      {/* Sections */}
      {["Experience", "Education"].map((section, idx) => (
        <div key={section} className="mb-2">
          <div 
            className={cn(
              "h-1.5 w-1/3 rounded-sm mb-1",
              layout.sectionStyle === "boxed" && "px-1 py-0.5"
            )}
            style={{ 
              backgroundColor: layout.sectionStyle === "boxed" 
                ? colors.primary + "20" 
                : colors.primary 
            }}
          />
          <div 
            className={cn(
              layout.sectionStyle === "underline" && "border-b",
              "pb-1"
            )}
            style={{ borderColor: colors.border }}
          >
            <div className="h-1 w-3/4 bg-gray-400 rounded-sm mb-0.5" />
            <div className="h-0.5 w-1/2 bg-gray-300 rounded-sm mb-0.5" />
            {idx === 0 && [...Array(2)].map((_, j) => (
              <div key={j} className="h-0.5 w-full bg-gray-200 rounded-sm mb-0.5" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const TemplateSelector = ({ selected, onSelect }: TemplateSelectorProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {RESUME_TEMPLATES.map((template) => (
        <TemplatePreviewCard
          key={template.id}
          template={template}
          isSelected={selected === template.id}
          onClick={() => onSelect(template.id)}
        />
      ))}
    </div>
  );
};

export default TemplateSelector;
