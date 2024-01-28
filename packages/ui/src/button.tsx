"use client";

import type { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  className?: string;
  appName: string;
}

export const Button = ({ children, className, appName }: ButtonProps) => (
  <button
    className={className}
    // eslint-disable-next-line no-alert
    onClick={() => alert(`Hello from your ${appName} app!`)}
    type="button"
  >
    {children}
  </button>
);
