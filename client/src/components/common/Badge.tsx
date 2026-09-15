interface BadgeProps {
  label: string;
  className?: string;
}

export default function Badge({ label, className = 'bg-navy-100 text-navy-700' }: BadgeProps) {
  return <span className={`badge ${className}`}>{label}</span>;
}
