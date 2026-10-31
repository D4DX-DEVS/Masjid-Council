import React from 'react';
import { Link } from 'react-router-dom';
import { linkKind } from '../../lib/homepage/render';

/**
 * A link whose target the admin typed: site paths go through the router, anchors and web
 * addresses become plain anchors, and anything else renders as an inert span — never as an
 * href, so a bad value cannot become a javascript: link.
 */
const SmartLink = ({ to, className, style, children }) => {
  const kind = linkKind(to);
  if (kind === 'site') {
    return (
      <Link to={to} className={className} style={style}>
        {children}
      </Link>
    );
  }
  if (kind === 'anchor' || kind === 'web') {
    const external = kind === 'web';
    return (
      <a
        href={to}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        className={className}
        style={style}
      >
        {children}
      </a>
    );
  }
  return (
    <span className={className} style={style}>
      {children}
    </span>
  );
};

export default SmartLink;
