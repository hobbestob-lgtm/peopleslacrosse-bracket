'use client';

/**
 * SEO-friendly breadcrumb navigation.
 * Renders visible breadcrumbs + updates JSON-LD BreadcrumbList schema.
 */
interface BreadcrumbItem {
  name: string;
  href?: string;
}

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (items.length === 0) return null;

  // Build breadcrumb JSON-LD
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": item.name,
      ...(item.href ? { "item": `https://bracket.peopleslacrosse.com${item.href}` } : {}),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex items-center gap-1.5 text-sm text-gray-500 flex-wrap">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-1.5">
              {i > 0 && (
                <span className="text-gray-600" aria-hidden="true">›</span>
              )}
              {item.href && i < items.length - 1 ? (
                <a
                  href={item.href}
                  className="hover:text-[#ffd700] transition-colors text-gray-400"
                >
                  {item.name}
                </a>
              ) : (
                <span className="text-gray-300 font-medium" aria-current={i === items.length - 1 ? 'page' : undefined}>
                  {item.name}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}