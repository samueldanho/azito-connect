import { ChurchLogo } from "@/components/icons/ChurchLogo";
import { cn } from "@/lib/utils";

interface PreloaderProps {
  /** Full-screen overlay (default) vs inline within a container */
  fullScreen?: boolean;
  /** Optional message displayed below the logo */
  message?: string;
  className?: string;
}

const Preloader = ({ fullScreen = true, message = "Chargement...", className }: PreloaderProps) => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={message}
      className={cn(
        fullScreen
          ? "fixed inset-0 z-[100] flex items-center justify-center gradient-hero"
          : "flex items-center justify-center w-full py-16",
        className
      )}
    >
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <div className="relative">
          {/* Pulsing halo */}
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse" />
          {/* Spinning ring */}
          <div className="absolute -inset-3 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <div className="relative">
            <ChurchLogo size="lg" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm font-medium text-foreground">{message}</p>
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preloader;
