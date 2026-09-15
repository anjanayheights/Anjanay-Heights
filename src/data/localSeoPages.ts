export type LocalSeoPage = {
  slug: string;
  location: string;
  title: string;
  description: string;
  highlights: string[];
  searchTerms: string[];
};

// Each page is designed to provide genuinely useful local buying guidance,
// rather than thin keyword-only doorway content.
export const localSeoPages: LocalSeoPage[] = [
  {
    slug: 'noida-property-consultant',
    location: 'Noida',
    title: 'Property Consultant in Noida',
    description: 'Explore residential, commercial and investment property opportunities in Noida with requirement matching, property shortlisting and site-visit assistance.',
    highlights: ['Residential apartments', 'Commercial property', 'Property investment', 'Site visit assistance'],
    searchTerms: ['property consultant in Noida', 'real estate consultant Noida']
  },
  {
    slug: 'greater-noida-property-consultant',
    location: 'Greater Noida',
    title: 'Property Consultant in Greater Noida',
    description: 'Find property opportunities across Greater Noida with guidance on residential projects, commercial options, investment requirements and site visits.',
    highlights: ['Residential projects', 'Commercial opportunities', 'Investment property', 'Requirement matching'],
    searchTerms: ['property consultant Greater Noida', 'real estate consultant Greater Noida']
  },
  {
    slug: 'noida-extension-property',
    location: 'Noida Extension',
    title: 'Property Consultant in Noida Extension',
    description: 'Compare available residential and commercial opportunities in Noida Extension and get help shortlisting properties around your budget and requirements.',
    highlights: ['Apartments', 'Residential projects', 'Commercial options', 'Budget-based matching'],
    searchTerms: ['property consultant Noida Extension', 'Noida Extension property']
  },
  {
    slug: 'yamuna-expressway-property',
    location: 'Yamuna Expressway',
    title: 'Property Consultant on Yamuna Expressway',
    description: 'Explore selected residential, commercial, plot and land opportunities along the Yamuna Expressway corridor with investment-focused property assistance.',
    highlights: ['Plots & land', 'Residential property', 'Commercial property', 'Investment assistance'],
    searchTerms: ['Yamuna Expressway property consultant', 'Yamuna Expressway property']
  },
  {
    slug: 'jewar-property-consultant',
    location: 'Jewar',
    title: 'Property Consultant in Jewar',
    description: 'Explore property opportunities in Jewar and the surrounding growth corridor, including residential, commercial and land requirements.',
    highlights: ['Residential property', 'Commercial property', 'Plots & land', 'Investment requirements'],
    searchTerms: ['Jewar property consultant', 'Jewar real estate']
  },
  {
    slug: 'ghaziabad-property-consultant',
    location: 'Ghaziabad',
    title: 'Property Consultant in Ghaziabad',
    description: 'Get assistance finding residential and commercial property in Ghaziabad based on location, budget, property type and buying timeline.',
    highlights: ['Residential property', 'Commercial property', 'Budget matching', 'Site visits'],
    searchTerms: ['property consultant Ghaziabad', 'real estate consultant Ghaziabad']
  }
];
