import { HTMLAttributes } from "react";

interface Props extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
}

export default function Card({ padded = true, className = "", children, ...props }: Props) {
  return (
    <div
      className={`bg-white rounded-2xl border border-brand-gray-200 shadow-sm ${padded ? "p-6" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
