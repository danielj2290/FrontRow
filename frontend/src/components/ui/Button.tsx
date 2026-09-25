import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router";
import { buttonClasses, type ButtonSize, type ButtonVariant } from "./buttonStyles.ts";

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
}

type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ variant, size, fullWidth, className, children, ...rest }: ButtonProps) {
  return (
    <button className={buttonClasses({ variant, size, fullWidth, className })} {...rest}>
      {children}
    </button>
  );
}

/**
 * A link that looks like a button.
 *
 * Deliberately NOT a Button with an onClick that navigates: a real anchor can
 * be middle-clicked, opened in a new tab, and announced correctly by a screen
 * reader. Anything that navigates should be a link.
 */
export function ButtonLink({
  to,
  external = false,
  variant,
  size,
  fullWidth,
  className,
  children,
}: CommonProps & { to: string; external?: boolean }) {
  const classes = buttonClasses({ variant, size, fullWidth, className });

  if (external) {
    return (
      <a href={to} target="_blank" rel="noreferrer noopener" className={classes}>
        {children}
      </a>
    );
  }

  return (
    <Link to={to} className={classes}>
      {children}
    </Link>
  );
}
