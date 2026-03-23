export const getSubdomain = () => {
  const hostname = window.location.hostname;
  
  // if localhost or IP without a prefix, return null
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
    return null;
  }

  // Check against VITE_DEV_HOST suffix if it's defined
  const devHost = import.meta.env.VITE_DEV_HOST;
  if (devHost) {
    const devHostDomain = devHost.split(':')[0]; // Remove port if exists
    if (hostname.endsWith(`.${devHostDomain}`)) {
      return hostname.replace(`.${devHostDomain}`, '');
    }
  }

  // Handle localhost with subdomains explicitly (e.g. app.localhost)
  if (hostname.endsWith('.localhost')) {
    return hostname.replace('.localhost', '');
  }
  
  // Ignore Lovable domains (which usually have 3 parts but are the main app)
  if (hostname.endsWith('lovableproject.com') || hostname.endsWith('lovable.app')) {
    return null;
  }

  // Handle Netlify, Vercel, etc if needed. But specifically Lovable:
  
  // For production domains like omniseen.app
  // If hostname is app.omniseen.app, split gives ['app', 'omniseen', 'app']
  const parts = hostname.split('.');
  
  // If there are at least 3 parts, the first part is likely the subdomain
  if (parts.length >= 3) {
    if (parts[0] !== 'www') {
      return parts[0];
    }
  }
  
  return null;
};
