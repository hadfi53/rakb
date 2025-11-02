import { useEffect } from 'react';

interface SEOData {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  noindex?: boolean;
}

const defaultTitle = 'RAKB - Location de voitures au Maroc';
const defaultDescription =
  'Réservez votre voiture de location au Maroc en quelques clics. Grand choix de véhicules, tarifs compétitifs, assurance incluse. Service client 24/7.';
const defaultImage = 'https://rakb.ma/og-image.png';
const defaultUrl = 'https://rakb.ma';

export const useSEO = (seoData: SEOData = {}) => {
  useEffect(() => {
    const {
      title,
      description,
      image,
      url,
      type = 'website',
      noindex = false,
    } = seoData;

    const seoTitle = title ? `${title} | RAKB` : defaultTitle;
    const seoDescription = description || defaultDescription;
    const seoImage = image || defaultImage;
    const seoUrl = url || defaultUrl;

    // Update title
    document.title = seoTitle;

    // Helper to update or create meta tag
    const updateMetaTag = (property: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${property}"]`);
      
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, property);
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    // Update or create meta tags
    updateMetaTag('description', seoDescription);
    updateMetaTag('canonical', seoUrl);
    
    if (noindex) {
      updateMetaTag('robots', 'noindex, nofollow');
    }

    // Open Graph tags
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:url', seoUrl, true);
    updateMetaTag('og:title', seoTitle, true);
    updateMetaTag('og:description', seoDescription, true);
    updateMetaTag('og:image', seoImage, true);
    updateMetaTag('og:locale', 'fr_FR', true);
    updateMetaTag('og:site_name', 'RAKB', true);

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:url', seoUrl);
    updateMetaTag('twitter:title', seoTitle);
    updateMetaTag('twitter:description', seoDescription);
    updateMetaTag('twitter:image', seoImage);

    // Additional SEO tags
    updateMetaTag('author', 'RAKB');
    updateMetaTag('geo.region', 'MA');
    updateMetaTag('geo.placename', 'Morocco');
    updateMetaTag('language', 'French');

    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', seoUrl);
  }, [seoData]);
};

