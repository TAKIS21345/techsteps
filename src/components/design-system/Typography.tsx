import React from 'react';
import { TypographyProps } from './types';

const typographyVariants = {
    h1: 'text-8xl sm:text-10xl md:text-12xl lg:text-14xl font-bold text-neutral-900',
    h2: 'text-5xl sm:text-6xl md:text-7xl font-bold text-neutral-900',
    h3: 'text-4xl sm:text-5xl md:text-6xl font-semibold text-neutral-900',
    h4: 'text-3xl sm:text-4xl md:text-5xl font-semibold text-neutral-900',
    h5: 'text-2xl sm:text-3xl font-medium text-neutral-900',
    h6: 'text-xl sm:text-2xl font-medium text-neutral-900',
    'body-lg': 'text-lg sm:text-xl text-neutral-700',
    'body': 'text-base sm:text-lg text-neutral-700',
    'body-sm': 'text-sm sm:text-base text-neutral-600',
    'caption': 'text-xs sm:text-sm text-neutral-500',
    'overline': 'text-xs sm:text-sm font-medium text-neutral-500 uppercase tracking-wider',
};

const colorVariants = {
    primary: 'text-primary-600',
    secondary: 'text-neutral-600',
    success: 'text-success-600',
    warning: 'text-warning-600',
    error: 'text-error-600',
};

const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
};

const defaultElements = {
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    h4: 'h4',
    h5: 'h5',
    h6: 'h6',
    'body-lg': 'p',
    'body': 'p',
    'body-sm': 'p',
    'caption': 'span',
    'overline': 'span',
} as const;

export const Typography: React.FC<TypographyProps> = ({
    variant,
    color,
    align = 'left',
    as,
    className = '',
    children,
    'data-testid': testId,
}) => {
    const Component = as || defaultElements[variant];

    const baseClasses = [
        typographyVariants[variant],
        color ? colorVariants[color] : '',
        alignmentClasses[align],
        'leading-relaxed',
    ].filter(Boolean).join(' ');

    return (
        <Component
            className={`${baseClasses} ${className}`}
            data-testid={testId}
        >
            {children}
        </Component>
    );
};
