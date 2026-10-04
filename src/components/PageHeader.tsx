import React, { memo } from 'react';

interface PageHeaderProps {
  breadcrumb: string;
  title: string;
  description?: string;
  themeBrand: string;
}

export const PageHeader = memo(function PageHeader({
  breadcrumb,
  title,
  description,
  themeBrand
}: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 select-none border-b border-border/50 mb-7 gap-4">
      <div className="space-y-1.5">
        {/* Clean Breadcrumb Kicker */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-semibold text-muted-foreground/80 tracking-wide text-[11px]">
            Workspace
          </span>
          <span className="text-muted-foreground/40 font-mono">/</span>
          <span className="font-bold text-foreground tracking-tight text-[11px]">
            {breadcrumb}
          </span>
        </div>

        <h2 className="text-2xl md:text-3xl font-extrabold font-display tracking-tight text-foreground">
          {title}
        </h2>
        {description && (
          <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Refined studio status badge */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground glass-panel px-3.5 py-1.5 rounded-full self-start md:self-center shadow-xs">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="text-foreground/90 font-medium tracking-tight text-[11px]">{themeBrand}</span>
      </div>
    </div>
  );
});

export default PageHeader;
