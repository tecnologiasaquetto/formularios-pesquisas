interface AnimatedStepProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'left' | 'right' | 'up' | 'down';
}

export default function AnimatedStep({ children, className = "", direction = 'right' }: AnimatedStepProps) {
  return (
    <div 
      className={`step-transition ${className}`}
      style={{
        animation: `slideInFrom${direction.charAt(0).toUpperCase() + direction.slice(1)} 0.4s ease-out`
      }}
    >
      {children}
    </div>
  );
}
