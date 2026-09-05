export type SyllabusNode = {
  slug: string;
  label: string;
  paper?: string;
  children?: SyllabusNode[];
};

export const UPSC_SYLLABUS: SyllabusNode[] = [
  {
    slug: "prelims",
    label: "Prelims",
    children: [
      {
        slug: "prelims-gs1",
        label: "GS Paper I",
        paper: "Prelims",
        children: [
          { slug: "history", label: "History", paper: "Prelims" },
          { slug: "art-culture", label: "Art & Culture", paper: "Prelims" },
          { slug: "geography", label: "Geography", paper: "Prelims" },
          { slug: "polity", label: "Polity & Governance", paper: "Prelims" },
          { slug: "economy", label: "Economy", paper: "Prelims" },
          { slug: "environment", label: "Environment & Ecology", paper: "Prelims" },
          { slug: "science-tech", label: "Science & Technology", paper: "Prelims" },
          { slug: "current-affairs", label: "Current Affairs", paper: "Prelims" },
        ],
      },
      { slug: "csat", label: "CSAT (Paper II)", paper: "Prelims" },
    ],
  },
  {
    slug: "mains",
    label: "Mains",
    children: [
      {
        slug: "gs1",
        label: "GS Paper I",
        paper: "GS1",
        children: [
          { slug: "indian-heritage", label: "Indian Heritage & Culture", paper: "GS1" },
          { slug: "modern-history", label: "Modern Indian History", paper: "GS1" },
          { slug: "world-history", label: "World History", paper: "GS1" },
          { slug: "indian-society", label: "Indian Society", paper: "GS1" },
          { slug: "world-geography", label: "World Geography", paper: "GS1" },
        ],
      },
      {
        slug: "gs2",
        label: "GS Paper II",
        paper: "GS2",
        children: [
          { slug: "constitution", label: "Constitution & Polity", paper: "GS2" },
          { slug: "governance", label: "Governance", paper: "GS2" },
          { slug: "social-justice", label: "Social Justice", paper: "GS2" },
          { slug: "international-relations", label: "International Relations", paper: "GS2" },
        ],
      },
      {
        slug: "gs3",
        label: "GS Paper III",
        paper: "GS3",
        children: [
          { slug: "economic-development", label: "Economic Development", paper: "GS3" },
          { slug: "agriculture", label: "Agriculture", paper: "GS3" },
          { slug: "infrastructure", label: "Infrastructure", paper: "GS3" },
          { slug: "internal-security", label: "Internal Security", paper: "GS3" },
          { slug: "disaster-management", label: "Disaster Management", paper: "GS3" },
          { slug: "biodiversity", label: "Biodiversity & Environment", paper: "GS3" },
        ],
      },
      {
        slug: "gs4",
        label: "GS Paper IV",
        paper: "GS4",
        children: [
          { slug: "ethics", label: "Ethics & Integrity", paper: "GS4" },
          { slug: "attitude", label: "Attitude & Aptitude", paper: "GS4" },
          { slug: "case-studies", label: "Case Studies", paper: "GS4" },
        ],
      },
      { slug: "essay", label: "Essay", paper: "Essay" },
    ],
  },
];

export function flattenSyllabus(nodes: SyllabusNode[]): SyllabusNode[] {
  return nodes.flatMap((n) => [n, ...(n.children ? flattenSyllabus(n.children) : [])]);
}

export const ALL_TAGS = flattenSyllabus(UPSC_SYLLABUS).map((n) => ({
  slug: n.slug,
  label: n.label,
  paper: n.paper,
}));
