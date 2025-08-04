import React from 'react';
import { useAccessibility } from '../../contexts/AccessibilityContext';

interface SkipLink {
  href: string;
  label: string;
}

interface SkipLinksProps {
  links?: SkipLink[];
}

const defaultLinks: SkipLink[] = [
  { href: '#main-content', label: 'Skip to main content' },
  { href: '#navigation', label: 'Skip to navigation' },
  { href: '#footer', label: 'Skip to footer' },
];

export const SkipLinks: React.FC<SkipLinksProps> = ({ links = defaultLinks }) => {
  const { announceToScreenReader } = useAccessibility();

  const handleSkipClick = (event: React.MouseEvent<HTMLAnchorElement>, label: string) => {
    const target = document.querySelector(event.currentTarget.getAttribute('href') || '');
    if (target) {
      // Make target focusable if it isn't already
      const targetElement = target as HTMLElement;
      if (!targetElement.hasAttribute('tabindex')) {
        targetElement.setAttribute('tabindex', '-1');
      }
      
      // Focus the target
      targetElement.focus();
      
      // Scroll to target
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Announce to screen readers
      announceToScreenReader(`Skipped to ${label.toLowerCase()}`);
    }
  };

  return (
    <nav aria-label="Skip links" className="skip-links">
      {links.map((link, index) => (
        <a
          key={index}
          href={link.href}
          className="skip-link"
          onClick={(e) => handleSkipClick(e, link.label)}
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
};