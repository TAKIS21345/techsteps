import React from 'react';

// Main content wrapper with proper semantic structure
interface MainContentProps {
  children: React.ReactNode;
  className?: string;
  'aria-label'?: string;
}

export const MainContent: React.FC<MainContentProps> = ({ 
  children, 
  className = '',
  'aria-label': ariaLabel 
}) => (
  <main 
    id="main-content"
    className={className}
    aria-label={ariaLabel || 'Main content'}
    role="main"
  >
    {children}
  </main>
);

// Navigation wrapper with proper ARIA
interface NavigationProps {
  children: React.ReactNode;
  className?: string;
  'aria-label'?: string;
  type?: 'primary' | 'secondary' | 'breadcrumb' | 'pagination';
}

export const Navigation: React.FC<NavigationProps> = ({ 
  children, 
  className = '',
  'aria-label': ariaLabel,
  type = 'primary'
}) => {
  const getDefaultLabel = () => {
    switch (type) {
      case 'breadcrumb': return 'Breadcrumb navigation';
      case 'pagination': return 'Pagination navigation';
      case 'secondary': return 'Secondary navigation';
      default: return 'Primary navigation';
    }
  };

  return (
    <nav 
      id="navigation"
      className={className}
      aria-label={ariaLabel || getDefaultLabel()}
      role="navigation"
    >
      {children}
    </nav>
  );
};

// Section wrapper with proper heading structure
interface SectionProps {
  children: React.ReactNode;
  className?: string;
  'aria-labelledby'?: string;
  'aria-label'?: string;
  heading?: string;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
}

export const Section: React.FC<SectionProps> = ({ 
  children, 
  className = '',
  'aria-labelledby': ariaLabelledBy,
  'aria-label': ariaLabel,
  heading,
  headingLevel = 2
}) => {
  const HeadingTag = `h${headingLevel}` as keyof JSX.IntrinsicElements;
  const headingId = heading ? `heading-${heading.toLowerCase().replace(/\s+/g, '-')}` : undefined;

  return (
    <section 
      className={className}
      aria-labelledby={ariaLabelledBy || headingId}
      aria-label={!ariaLabelledBy && !heading ? ariaLabel : undefined}
    >
      {heading && (
        <HeadingTag id={headingId} className="sr-only">
          {heading}
        </HeadingTag>
      )}
      {children}
    </section>
  );
};

// Article wrapper for content
interface ArticleProps {
  children: React.ReactNode;
  className?: string;
  'aria-labelledby'?: string;
  'aria-label'?: string;
}

export const Article: React.FC<ArticleProps> = ({ 
  children, 
  className = '',
  'aria-labelledby': ariaLabelledBy,
  'aria-label': ariaLabel
}) => (
  <article 
    className={className}
    aria-labelledby={ariaLabelledBy}
    aria-label={ariaLabel}
  >
    {children}
  </article>
);

// Aside wrapper for complementary content
interface AsideProps {
  children: React.ReactNode;
  className?: string;
  'aria-label'?: string;
}

export const Aside: React.FC<AsideProps> = ({ 
  children, 
  className = '',
  'aria-label': ariaLabel
}) => (
  <aside 
    className={className}
    aria-label={ariaLabel || 'Complementary content'}
    role="complementary"
  >
    {children}
  </aside>
);

// Footer wrapper
interface FooterProps {
  children: React.ReactNode;
  className?: string;
  'aria-label'?: string;
}

export const Footer: React.FC<FooterProps> = ({ 
  children, 
  className = '',
  'aria-label': ariaLabel
}) => (
  <footer 
    id="footer"
    className={className}
    aria-label={ariaLabel || 'Site footer'}
    role="contentinfo"
  >
    {children}
  </footer>
);

// Landmark region for custom content areas
interface LandmarkProps {
  children: React.ReactNode;
  className?: string;
  role: 'banner' | 'search' | 'form' | 'region';
  'aria-label': string;
}

export const Landmark: React.FC<LandmarkProps> = ({ 
  children, 
  className = '',
  role,
  'aria-label': ariaLabel
}) => (
  <div 
    className={className}
    role={role}
    aria-label={ariaLabel}
  >
    {children}
  </div>
);

// Heading component with proper hierarchy
interface HeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const Heading: React.FC<HeadingProps> = ({ 
  level, 
  children, 
  className = '',
  id
}) => {
  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
  
  return (
    <HeadingTag 
      id={id}
      className={className}
    >
      {children}
    </HeadingTag>
  );
};

// List component with proper semantics
interface ListProps {
  children: React.ReactNode;
  className?: string;
  ordered?: boolean;
  'aria-label'?: string;
}

export const List: React.FC<ListProps> = ({ 
  children, 
  className = '',
  ordered = false,
  'aria-label': ariaLabel
}) => {
  const ListTag = ordered ? 'ol' : 'ul';
  
  return (
    <ListTag 
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </ListTag>
  );
};

// List item component
interface ListItemProps {
  children: React.ReactNode;
  className?: string;
}

export const ListItem: React.FC<ListItemProps> = ({ 
  children, 
  className = ''
}) => (
  <li className={className}>
    {children}
  </li>
);