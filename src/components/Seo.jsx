import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://physiverse.org';
const SITE_NAME = 'Physiverse';
const DEFAULT_IMAGE = `${SITE_URL}/images/physics-lab-classroom.jpg`;
const DEFAULT_DESCRIPTION =
  'Free interactive physics simulations for mechanics, fluids, electromagnetism, optics, thermodynamics, and quantum systems. Explore concepts with live controls, graphs, equations, and experiments.';

export default function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  keywords = [],
  image = DEFAULT_IMAGE,
  type = 'website',
  structuredData,
}) {
  const canonicalPath = path === '/' ? '/' : `/${path.replace(/^\/+|\/+$/g, '')}`;
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;
  const pageTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const keywordContent = Array.isArray(keywords) ? keywords.filter(Boolean).join(', ') : keywords;

  return (
    <Helmet>
      <html lang="en" />
      <title>{pageTitle}</title>
      <link rel="canonical" href={canonicalUrl} />
      <meta name="description" content={description} />
      <meta name="robots" content="index, follow" />
      {keywordContent && <meta name="keywords" content={keywordContent} />}

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:alt" content={`${SITE_NAME} interactive physics lab`} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={`${SITE_NAME} interactive physics lab`} />

      {structuredData && (
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      )}
    </Helmet>
  );
}

Seo.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  path: PropTypes.string,
  keywords: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]),
  image: PropTypes.string,
  type: PropTypes.string,
  structuredData: PropTypes.object,
};

export { DEFAULT_DESCRIPTION, DEFAULT_IMAGE, SITE_NAME, SITE_URL };
