import Head from 'next/head';
import React from 'react';

interface SEOTagsProps {
  metadata: {
    title?: string;
    description?: string;
    keywords?: string;
    ogImage?: string;
    ogTitle?: string;
    ogDescription?: string;
    canonicalUrl?: string;
    schemaMarkup?: any;
  };
}

export const SEOTags: React.FC<SEOTagsProps> = ({ metadata }) => {
  return (
    <Head>
      <title>{metadata.title || 'Mana Events - Premium Marketplace'}</title>
      <meta name="description" content={metadata.description || 'Find the best vendors for your events.'} />
      {metadata.keywords && <meta name="keywords" content={metadata.keywords} />}

      {/* Open Graph */}
      <meta property="og:title" content={metadata.ogTitle || metadata.title} />
      <meta property="og:description" content={metadata.ogDescription || metadata.description} />
      <meta property="og:image" content={metadata.ogImage || '/default-og.jpg'} />
      <meta property="og:type" content="website" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metadata.ogTitle || metadata.title} />
      <meta name="twitter:description" content={metadata.ogDescription || metadata.description} />
      <meta name="twitter:image" content={metadata.ogImage || '/default-og.jpg'} />

      {metadata.canonicalUrl && <link rel="canonical" href={metadata.canonicalUrl} />}

      {/* Structured Data */}
      {metadata.schemaMarkup && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(metadata.schemaMarkup) }}
        />
      )}
    </Head>
  );
};
