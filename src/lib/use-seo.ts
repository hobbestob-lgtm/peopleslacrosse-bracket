'use client';

import { useEffect } from 'react';

/**
 * Sets document-level SEO meta tags from client components.
 * Next.js Metadata API only works in server components, so
 * client pages use this hook for dynamic meta updates.
 */
export function useSEO({
  title,
  description,
  canonical,
  breadcrumbs,
}: {
  title: string;
  description: string;
  canonical?: string;
  breadcrumbs?: { name: string; href?: string }[];
}) {
  useEffect(() => {
    // Title
    document.title = `${title} -- People's Lacrosse Bracket`;

    // Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);

    // Canonical
    if (canonical) {
      let linkCanonical = document.querySelector('link[rel="canonical"]');
      if (!linkCanonical) {
        linkCanonical = document.createElement('link');
        linkCanonical.setAttribute('rel', 'canonical');
        document.head.appendChild(linkCanonical);
      }
      linkCanonical.setAttribute('href', `https://bracket.peopleslacrosse.com${canonical}`);
    }

    // OG tags
    const ogTags: Record<string, string> = {
      'og:title': title,
      'og:description': description,
      'og:url': `https://bracket.peopleslacrosse.com${canonical || ''}`,
      'twitter:title': title,
      'twitter:description': description,
    };

    for (const [prop, content] of Object.entries(ogTags)) {
      let el = document.querySelector(`meta[property="${prop}"]`) || document.querySelector(`meta[name="${prop}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(prop.startsWith('og:') ? 'property' : 'name', prop);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    }
  }, [title, description, canonical, breadcrumbs]);
}