export function OnboardingShell({
  step,
  title,
  subtitle,
  children,
  footer,
}: {
  step: 1 | 2 | 3;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen safe-top safe-bottom safe-x px-6 py-8 max-w-md mx-auto w-full">
      <div className="flex gap-1.5 mb-8">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className={`h-1.5 flex-1 rounded-full ${n <= step ? "bg-accent" : "bg-border"}`}
          />
        ))}
      </div>
      <div className="flex-1 flex flex-col gap-5">
        <div>
          <h1 className="font-display text-3xl leading-tight">{title}</h1>
          {subtitle && <p className="text-muted mt-2">{subtitle}</p>}
        </div>
        {children}
      </div>
      <div className="pt-6">{footer}</div>
    </div>
  );
}
