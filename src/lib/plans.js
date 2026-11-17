export const DEFAULT_PLANS = [
  {
    id: 'pilot',
    name: 'PageWise Pilot',
    tagline: 'All premium capabilities unlocked during our early pilot program',
    price: '₹0',
    period: 'Pilot Access (Free)',
    badge: 'Early Pilot Active',
    badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    buttonText: 'Current Active Plan',
    popular: true,
    features: [
      '20 resume workspaces',
      'Unlimited manual editing',
      '100 exports per month',
      '50 Wiser Job Help analyses',
      '50 Wiser ATS evaluations',
      '30 custom templates',
      'All premium layout architectures unlocked',
      'AI improvement suggestions and instant application',
      'Early Pilot Access (No payment required)'
    ]
  },
  {
    id: 'free',
    name: 'Pagewise Free',
    tagline: 'Essential resume building forever',
    price: '₹0',
    period: 'forever',
    badge: 'Free Forever',
    badgeColor: 'bg-white/[0.04] text-[#8E94A5] border-white/[0.08]',
    buttonText: 'Current Free Tier',
    features: [
      '1 resume workspace',
      'Unlimited manual editing',
      '1 export per calendar month',
      '1 Wiser AI evaluation (Job Help & ATS)',
      '1 standard customizable template',
      'Basic resume editor',
      'Resume remains saved'
    ]
  },
  {
    id: 'day_pass',
    name: 'Wiser Day Pass',
    tagline: 'High speed power for urgent job applications',
    price: '₹49',
    period: 'one-time purchase (24 hours)',
    badge: '24 Hours · 1 Resume',
    badgeColor: 'bg-[#C88A58]/10 text-[#D49A6A] border-[#C88A58]/25',
    buttonText: 'Get 24h Day Pass',
    popular: false,
    features: [
      '1 resume workspace',
      'Unlimited manual editing',
      '3 premium templates',
      '5 exports',
      '3 Wiser Job Help analyses',
      '3 Wiser ATS evaluations',
      'AI improvement suggestions & application'
    ]
  },
  {
    id: 'pro_monthly',
    name: 'Pagewise Pro',
    tagline: 'The ultimate career growth & job hunting toolkit',
    price: '₹199',
    period: '/ month',
    badge: 'Recommended',
    badgeColor: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    buttonText: 'Upgrade to Pro',
    popular: true,
    features: [
      '5 resume workspaces',
      'Unlimited manual editing',
      '30 exports',
      '15 Wiser Job Help analyses',
      '15 Wiser ATS evaluations',
      'All premium templates',
      'AI improvement suggestions & application',
      'Resume version management',
      'All export formats (PDF, DOCX, PNG, HTML)'
    ]
  }
];
