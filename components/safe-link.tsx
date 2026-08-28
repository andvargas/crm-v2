import type { AnchorHTMLAttributes, ReactNode } from "react";

type SafeLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: ReactNode;
};

/**
 * Uses native document navigation to avoid vinext's currently unstable RSC
 * prefetch/client-transition path on Cloudflare Pages.
 */
export function SafeLink({ href, children, ...props }: SafeLinkProps) {
  return <a href={href} {...props}>{children}</a>;
}
