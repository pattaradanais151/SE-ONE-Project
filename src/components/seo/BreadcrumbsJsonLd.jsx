// src/components/seo/BreadcrumbsJsonLd.jsx
import React from 'react';
import JsonLd from './JsonLd';
import { siteConfig } from '../../config/site';

export default function BreadcrumbsJsonLd({ items }) {
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `${siteConfig.url}${item.path}`
    }))
  };

  return <JsonLd data={breadcrumbData} />;
}