"use client";

import { ReactNode } from "react";
import { useNavigateWithTransition } from "../hooks/usePageTransition";

interface NavigationButtonProps {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function NavigationButton({
  href,
  children,
  className,
  onClick,
}: NavigationButtonProps) {
  const { navigate } = useNavigateWithTransition();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClick?.();
    navigate(href);
  };

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  );
}

interface NavigationLinkProps extends NavigationButtonProps {
  block?: boolean;
}

export function NavigationLink({
  href,
  children,
  className,
  onClick,
  block = false,
}: NavigationLinkProps) {
  const { navigate } = useNavigateWithTransition();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClick?.();
    navigate(href);
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={`${className} ${block ? "block" : ""} cursor-pointer transition-all duration-200 hover:opacity-80`}
    >
      {children}
    </a>
  );
}
