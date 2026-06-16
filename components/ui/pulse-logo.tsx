type PulseLogoProps = {
  compact?: boolean;
};

type PulseMarkProps = {
  size?: "sm" | "md" | "lg";
};

export function PulseMark({ size = "md" }: PulseMarkProps) {
  const sizeClass = {
    sm: "h-7 w-7",
    md: "h-11 w-11",
    lg: "h-14 w-14",
  }[size];

  return (
    <div
      className={[
        "flex shrink-0 items-center justify-center rounded-full",
        "bg-emerald-100 ring-1 ring-emerald-200",
        sizeClass,
      ].join(" ")}
    >
      <svg
        viewBox="0 0 48 48"
        className="h-[62%] w-[62%]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M24 7.5C25.25 16.2 30.1 21.05 38.5 22.2C30.1 23.35 25.25 28.2 24 40.5C22.75 28.2 17.9 23.35 9.5 22.2C17.9 21.05 22.75 16.2 24 7.5Z"
          stroke="#047857"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M36.5 8.5V17.5"
          stroke="#047857"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M32 13H41"
          stroke="#047857"
          strokeWidth="3"
          strokeLinecap="round"
        />

        <circle
          cx="13.5"
          cy="35"
          r="4.2"
          stroke="#047857"
          strokeWidth="3"
        />
      </svg>
    </div>
  );
}

export function PulseLogo({ compact = false }: PulseLogoProps) {
  return (
    <div className="flex items-center gap-3">
      <PulseMark size="md" />

      {!compact && (
        <span className="text-2xl font-semibold tracking-tight text-slate-950">
          pulse
        </span>
      )}
    </div>
  );
}