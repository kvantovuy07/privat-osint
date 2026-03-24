import "server-only";

export type QueryKind =
  | "company"
  | "domain"
  | "username"
  | "email"
  | "repository"
  | "person"
  | "keyword";

export type SearchItem = {
  id: string;
  source: string;
  type: string;
  title: string;
  subtitle?: string;
  description?: string;
  url?: string;
  tags?: string[];
};

export type SearchSection = {
  id: string;
  title: string;
  description: string;
  items: SearchItem[];
};

export type SearchRun = {
  query: string;
  inferredType: QueryKind;
  summary: Array<{ label: string; value: string }>;
  warnings: string[];
  sections: SearchSection[];
  usedSources: string[];
  performedAt: string;
};

export type ConnectorCatalogItem = {
  id: string;
  name: string;
  category: string;
  status: "live" | "ready" | "requires_key" | "manual";
  description: string;
  officialUrl: string;
  queryKinds: QueryKind[];
  notes?: string;
};

export const connectorCatalog: ConnectorCatalogItem[] = [
  {
    id: "gleif",
    name: "GLEIF LEI Records",
    category: "Registry",
    status: "live",
    description: "Official LEI registry search for legal entities and corporate identifiers.",
    officialUrl: "https://www.gleif.org/en/lei-data/gleif-api",
    queryKinds: ["company", "keyword"],
  },
  {
    id: "github-users",
    name: "GitHub User Search",
    category: "Code Intelligence",
    status: "live",
    description: "Official GitHub public user and organization search.",
    officialUrl: "https://docs.github.com/en/rest/search/search#search-users",
    queryKinds: ["company", "username", "person", "keyword"],
  },
  {
    id: "github-repos",
    name: "GitHub Repository Search",
    category: "Code Intelligence",
    status: "live",
    description: "Official GitHub public repository search for repos, code footprints, and org activity.",
    officialUrl: "https://docs.github.com/en/rest/search/search#search-repositories",
    queryKinds: ["company", "domain", "repository", "keyword", "username"],
  },
  {
    id: "companies-house",
    name: "Companies House",
    category: "Registry",
    status: "requires_key",
    description: "UK corporate registry for officers, filings, and company records.",
    officialUrl: "https://developer.company-information.service.gov.uk/",
    queryKinds: ["company", "person", "keyword"],
  },
  {
    id: "sec-edgar",
    name: "SEC EDGAR",
    category: "Registry",
    status: "ready",
    description: "US filings, disclosure, and issuer records from the SEC.",
    officialUrl: "https://www.sec.gov/search-filings",
    queryKinds: ["company", "keyword", "person"],
  },
  {
    id: "opencorporates",
    name: "OpenCorporates",
    category: "Registry",
    status: "requires_key",
    description: "Global corporate registry aggregation with officer and filing coverage.",
    officialUrl: "https://opencorporates.com/info/api",
    queryKinds: ["company", "person", "keyword"],
  },
  {
    id: "opensanctions",
    name: "OpenSanctions",
    category: "Compliance",
    status: "ready",
    description: "Sanctions, watchlists, PEPs, and due diligence datasets.",
    officialUrl: "https://www.opensanctions.org/docs/api/",
    queryKinds: ["company", "person", "keyword"],
  },
  {
    id: "ofac",
    name: "OFAC Sanctions Lists",
    category: "Compliance",
    status: "manual",
    description: "US Treasury sanctions lists for compliance screening.",
    officialUrl: "https://ofac.treasury.gov/sanctions-list-service",
    queryKinds: ["company", "person", "keyword"],
  },
  {
    id: "spiderfoot",
    name: "SpiderFoot",
    category: "OSINT Automation",
    status: "ready",
    description: "Automated investigation engine for domains, IPs, emails, and usernames.",
    officialUrl: "https://github.com/smicallef/spiderfoot",
    queryKinds: ["company", "domain", "email", "username", "keyword"],
  },
  {
    id: "theharvester",
    name: "theHarvester",
    category: "OSINT Automation",
    status: "ready",
    description: "Public email, domain, and subdomain discovery across search sources.",
    officialUrl: "https://github.com/laramies/theHarvester",
    queryKinds: ["domain", "company", "email", "keyword"],
  },
  {
    id: "subfinder",
    name: "Subfinder",
    category: "Technical Footprint",
    status: "ready",
    description: "Fast passive subdomain enumeration for external surface mapping.",
    officialUrl: "https://github.com/projectdiscovery/subfinder",
    queryKinds: ["domain"],
  },
  {
    id: "amass",
    name: "OWASP Amass",
    category: "Technical Footprint",
    status: "ready",
    description: "Attack surface mapping and network infrastructure discovery.",
    officialUrl: "https://github.com/owasp-amass/amass",
    queryKinds: ["domain", "company"],
  },
  {
    id: "web-check",
    name: "Web-Check",
    category: "Technical Footprint",
    status: "ready",
    description: "Website and domain reconnaissance dashboard.",
    officialUrl: "https://github.com/Lissy93/web-check",
    queryKinds: ["domain", "company"],
  },
  {
    id: "octosuite",
    name: "Octosuite",
    category: "Code Intelligence",
    status: "ready",
    description: "GitHub investigation suite from Bellingcat for corporate and persona mapping.",
    officialUrl: "https://github.com/bellingcat/octosuite",
    queryKinds: ["company", "username", "person", "repository"],
  },
  {
    id: "sherlock",
    name: "Sherlock",
    category: "Identity",
    status: "ready",
    description: "Username enumeration across public services.",
    officialUrl: "https://github.com/sherlock-project/sherlock",
    queryKinds: ["username", "person"],
  },
  {
    id: "maigret",
    name: "Maigret",
    category: "Identity",
    status: "ready",
    description: "Username and account footprint search across public sites.",
    officialUrl: "https://github.com/soxoj/maigret",
    queryKinds: ["username", "person"],
  },
  {
    id: "gitleaks",
    name: "Gitleaks",
    category: "Defensive",
    status: "ready",
    description: "Defensive secret scanning for public repositories and code exposures.",
    officialUrl: "https://github.com/gitleaks/gitleaks",
    queryKinds: ["repository", "company", "domain", "keyword"],
  },
  {
    id: "trufflehog",
    name: "TruffleHog",
    category: "Defensive",
    status: "ready",
    description: "Defensive scanning for exposed secrets in public code and artifacts.",
    officialUrl: "https://github.com/trufflesecurity/trufflehog",
    queryKinds: ["repository", "company", "domain", "keyword"],
  },
];

export function inferQueryKind(input: string): QueryKind {
  const query = input.trim();

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query)) {
    return "email";
  }

  if (/^(?:https?:\/\/)?github\.com\/[^/\s]+\/[^/\s]+\/?$/.test(query)) {
    return "repository";
  }

  if (/^(?:@)?[a-z0-9][a-z0-9._-]{1,38}$/i.test(query)) {
    return query.startsWith("@") ? "username" : "keyword";
  }

  if (/^(?!https?:\/\/)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(query)) {
    return "domain";
  }

  if (query.includes("/")) {
    return "repository";
  }

  if (query.split(" ").length >= 2) {
    return "company";
  }

  return "keyword";
}

function githubHeaders() {
  const headers = new Headers({
    Accept: "application/vnd.github+json",
    "User-Agent": "Privat-OSINT-Console",
    "X-GitHub-Api-Version": "2022-11-28",
  });

  if (process.env.GITHUB_TOKEN) {
    headers.set("Authorization", `Bearer ${process.env.GITHUB_TOKEN}`);
  }

  return headers;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function searchGleifCompanies(query: string): Promise<SearchItem[]> {
  const url = `https://api.gleif.org/api/v1/lei-records?filter[entity.legalName]=${encodeURIComponent(
    query,
  )}&page[size]=5`;

  const data = await fetchJson<{
    data: Array<{
      id: string;
      attributes: {
        lei: string;
        entity: {
          legalName: { name: string };
          legalAddress?: { addressLines?: string[]; country?: string };
          legalJurisdiction?: string;
        };
        registration?: { status?: string };
      };
    }>;
  }>(url, {
    headers: {
      Accept: "application/vnd.api+json",
    },
  });

  return data.data.map((record) => ({
    id: record.id,
    source: "GLEIF",
    type: "registry-record",
    title: record.attributes.entity.legalName.name,
    subtitle: `LEI ${record.attributes.lei}`,
    description: [
      record.attributes.entity.legalAddress?.country,
      record.attributes.entity.legalJurisdiction,
      record.attributes.registration?.status,
    ]
      .filter(Boolean)
      .join(" • "),
    url: `https://search.gleif.org/#/record/${record.attributes.lei}`,
    tags: ["official registry", "lei"],
  }));
}

async function searchGithubUsers(query: string): Promise<SearchItem[]> {
  const data = await fetchJson<{
    items: Array<{
      id: number;
      login: string;
      type: string;
      html_url: string;
      avatar_url: string;
      score: number;
    }>;
  }>(
    `https://api.github.com/search/users?q=${encodeURIComponent(query)}&per_page=5`,
    { headers: githubHeaders() },
  );

  return data.items.map((item) => ({
    id: `github-user-${item.id}`,
    source: "GitHub",
    type: item.type.toLowerCase(),
    title: item.login,
    subtitle: item.type,
    description: `Public GitHub profile match with score ${item.score.toFixed(1)}`,
    url: item.html_url,
    tags: ["github", "public profile"],
  }));
}

async function searchGithubRepos(query: string): Promise<SearchItem[]> {
  const data = await fetchJson<{
    items: Array<{
      id: number;
      full_name: string;
      description: string | null;
      html_url: string;
      language: string | null;
      stargazers_count: number;
      updated_at: string;
    }>;
  }>(
    `https://api.github.com/search/repositories?q=${encodeURIComponent(
      query,
    )}&sort=updated&order=desc&per_page=5`,
    { headers: githubHeaders() },
  );

  return data.items.map((item) => ({
    id: `github-repo-${item.id}`,
    source: "GitHub",
    type: "repository",
    title: item.full_name,
    subtitle: item.language || "Language not specified",
    description: `${item.description || "No repository description"} • ${item.stargazers_count} stars`,
    url: item.html_url,
    tags: ["github", "repository", new Date(item.updated_at).getFullYear().toString()],
  }));
}

function recommendedConnectors(kind: QueryKind) {
  return connectorCatalog
    .filter((connector) => connector.queryKinds.includes(kind))
    .sort((a, b) => {
      const statusWeight = { live: 0, ready: 1, requires_key: 2, manual: 3 };
      return statusWeight[a.status] - statusWeight[b.status];
    })
    .slice(0, 8)
    .map((connector) => ({
      id: connector.id,
      source: connector.category,
      type: connector.status,
      title: connector.name,
      subtitle: connector.status.replace("_", " "),
      description: connector.description,
      url: connector.officialUrl,
      tags: connector.queryKinds,
    }));
}

export async function runUnifiedSearch(query: string): Promise<SearchRun> {
  const inferredType = inferQueryKind(query);
  const sections: SearchSection[] = [];
  const warnings: string[] = [
    "Results are sourced only from lawful public endpoints and curated open-source tools.",
    "Treat all matches as leads that require analyst verification before decision-making.",
  ];

  const usedSources = new Set<string>();

  if (inferredType === "company" || inferredType === "keyword") {
    try {
      const gleifResults = await searchGleifCompanies(query);
      if (gleifResults.length > 0) {
        usedSources.add("GLEIF");
        sections.push({
          id: "registry",
          title: "Registry Matches",
          description: "Official corporate records from GLEIF LEI data.",
          items: gleifResults,
        });
      }
    } catch {
      warnings.push("GLEIF could not be reached for this search.");
    }
  }

  if (
    inferredType === "company" ||
    inferredType === "keyword" ||
    inferredType === "username" ||
    inferredType === "person"
  ) {
    try {
      const githubUserResults = await searchGithubUsers(query.replace(/^@/, ""));
      if (githubUserResults.length > 0) {
        usedSources.add("GitHub User Search");
        sections.push({
          id: "github-users",
          title: "GitHub Profiles",
          description: "Public users and organizations that match the query.",
          items: githubUserResults,
        });
      }
    } catch {
      warnings.push("GitHub user search was unavailable or rate-limited.");
    }
  }

  if (
    inferredType === "company" ||
    inferredType === "keyword" ||
    inferredType === "repository" ||
    inferredType === "domain" ||
    inferredType === "username"
  ) {
    try {
      const githubRepoResults = await searchGithubRepos(query.replace(/^https?:\/\/github\.com\//, ""));
      if (githubRepoResults.length > 0) {
        usedSources.add("GitHub Repository Search");
        sections.push({
          id: "github-repos",
          title: "GitHub Repositories",
          description: "Recent public repositories and code footprints related to the query.",
          items: githubRepoResults,
        });
      }
    } catch {
      warnings.push("GitHub repository search was unavailable or rate-limited.");
    }
  }

  sections.push({
    id: "recommended",
    title: "Recommended Next Sources",
    description: "Curated connectors and tools to continue the investigation path.",
    items: recommendedConnectors(inferredType),
  });

  const resultCount = sections.reduce((count, section) => count + section.items.length, 0);

  return {
    query,
    inferredType,
    summary: [
      { label: "Query Type", value: inferredType },
      { label: "Sections", value: sections.length.toString() },
      { label: "Results", value: resultCount.toString() },
      { label: "Sources Used", value: Array.from(usedSources).length.toString() },
    ],
    warnings,
    sections,
    usedSources: Array.from(usedSources),
    performedAt: new Date().toISOString(),
  };
}
