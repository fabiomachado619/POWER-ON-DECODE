import { ReactNode } from "react";

interface HorizontalScrollRowProps {
  children: ReactNode;
}

export function HorizontalScrollRow({ children }: HorizontalScrollRowProps) {
  return <div className="horizontal-scroll">{children}</div>;
}
