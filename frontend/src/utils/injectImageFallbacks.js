// Add this helper function at the top of your Project.jsx or utils file:
export const injectImageFallbacks = (codeString) => {
  if (typeof codeString !== 'string') return codeString;

  // 🎨 THE PREMIUM DARK MESH FALLBACK:
  // An elegant, abstract dark vector graphic featuring sharp modern geometry
  // and subtle linear mesh details instead of standard boring text boxes.
  const coolSvgPlaceholder = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='500' viewBox='0 0 800 500'><defs><linearGradient id='bg' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%2318181b'/><stop offset='100%25' stop-color='%2309090b'/></linearGradient><linearGradient id='glow' x1='0%25' y1='0%25' x2='0%25' y2='100%25'><stop offset='0%25' stop-color='%2310b981' stop-opacity='0.4'/><stop offset='100%25' stop-color='%2306b6d4' stop-opacity='0.05'/></linearGradient></defs><rect width='100%25' height='100%25' fill='url(%23bg)'/><circle cx='650' cy='150' r='60' fill='url(%23glow)' opacity='0.6'/><path d='M-100 500 L250 220 L450 380 L680 180 L900 500 Z' fill='url(%23glow)'/><path d='M-100 500 L300 280 L550 420 L850 240 L1000 500 Z' fill='%2310b981' opacity='0.15' stroke='%2310b981' stroke-width='1'/><circle cx='400' cy='250' r='3' fill='%23ffffff' opacity='0.3'/><circle cx='200' cy='180' r='2' fill='%23ffffff' opacity='0.2'/><circle cx='550' cy='120' r='2.5' fill='%23ffffff' opacity='0.4'/><text x='50%25' y='85%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' font-weight='600' letter-spacing='0.2em' fill='%234b5563' fill-opacity='0.7'>EXPLORE VANGUARD SYSTEM</text></svg>";

  return codeString.replace(
    /<img\s+([^>]*?)src={?["']?([^"'}]+)["']?}?([^/>]*?)(\/?)(>)/g,
    (match, beforeSrc, srcValue, afterSrc, slash, closing) => {
      if (match.includes('onError')) return match;
      
      return `<img ${beforeSrc} src={${srcValue.startsWith('http') ? `"${srcValue}"` : srcValue}} ${afterSrc} onError={(e) => { e.target.onerror = null; e.target.src = "${coolSvgPlaceholder}"; }} ${slash}${closing}`;
    }
  );
};