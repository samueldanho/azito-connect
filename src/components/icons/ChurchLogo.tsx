import { cn } from "@/lib/utils";

interface ChurchLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const ChurchLogo = ({ className, size = "md" }: ChurchLogoProps) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Church building base */}
        <path
          d="M20 90V50L50 25L80 50V90H20Z"
          className="fill-primary"
        />
        {/* Cross */}
        <rect x="46" y="10" width="8" height="30" className="fill-primary" />
        <rect x="38" y="18" width="24" height="8" className="fill-primary" />
        {/* Door */}
        <path
          d="M42 90V68C42 64 46 60 50 60C54 60 58 64 58 68V90H42Z"
          className="fill-background"
        />
        {/* Windows */}
        <circle cx="35" cy="60" r="5" className="fill-background opacity-80" />
        <circle cx="65" cy="60" r="5" className="fill-background opacity-80" />
        {/* Roof accent */}
        <path
          d="M50 25L20 50H80L50 25Z"
          className="fill-accent opacity-30"
        />
      </svg>
    </div>
  );
};
