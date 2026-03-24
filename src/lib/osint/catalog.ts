import "server-only";

import { parsePhoneNumberFromString } from "libphonenumber-js/max";

export type QueryKind =
  | "company"
  | "domain"
  | "username"
  | "email"
  | "repository"
  | "person"
  | "keyword"
  | "phone";

type SearchDetail = {
  label: string;
  value: string;
};

export type SearchItem = {
  id: string;
  source: string;
  type: string;
  title: string;
  subtitle?: string;
  description?: string;
  url?: string;
  tags?: string[];
  details?: SearchDetail[];
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

const SEC_USER_AGENT =
  process.env.SEC_USER_AGENT || "Privat-OSINT/1.0 research@privat-osint.local";

type WaybackSummary = {
  pageCount: number;
  closestUrl?: string;
  closestTimestamp?: string;
  captures: Array<{ timestamp: string; original: string }>;
};

type ProfileProbe = {
  platform: string;
  url: string;
  status: number;
  archivedPages?: number;
};

type BridgeConfig = {
  id: string;
  name: string;
  urlEnv: string;
  tokenEnv: string;
  queryKinds: QueryKind[];
  description: string;
};

const bridgeConfigs: BridgeConfig[] = [
  {
    id: "sherlock-bridge",
    name: "Sherlock Bridge",
    urlEnv: "SHERLOCK_BRIDGE_URL",
    tokenEnv: "SHERLOCK_BRIDGE_TOKEN",
    queryKinds: ["username", "person"],
    description: "Self-hosted Sherlock worker for deeper username enumeration.",
  },
  {
    id: "maigret-bridge",
    name: "Maigret Bridge",
    urlEnv: "MAIGRET_BRIDGE_URL",
    tokenEnv: "MAIGRET_BRIDGE_TOKEN",
    queryKinds: ["username", "person"],
    description: "Self-hosted Maigret worker for richer profile footprinting.",
  },
  {
    id: "spiderfoot-bridge",
    name: "SpiderFoot Bridge",
    urlEnv: "SPIDERFOOT_BRIDGE_URL",
    tokenEnv: "SPIDERFOOT_BRIDGE_TOKEN",
    queryKinds: ["company", "domain", "username", "email", "keyword", "phone"],
    description: "Self-hosted SpiderFoot worker for automated recon modules.",
  },
  {
    id: "theharvester-bridge",
    name: "theHarvester Bridge",
    urlEnv: "THEHARVESTER_BRIDGE_URL",
    tokenEnv: "THEHARVESTER_BRIDGE_TOKEN",
    queryKinds: ["company", "domain", "email", "keyword"],
    description: "Self-hosted theHarvester worker for public email and subdomain discovery.",
  },
  {
    id: "amass-bridge",
    name: "Amass Bridge",
    urlEnv: "AMASS_BRIDGE_URL",
    tokenEnv: "AMASS_BRIDGE_TOKEN",
    queryKinds: ["company", "domain", "keyword"],
    description: "Self-hosted Amass worker for deeper infrastructure and graph discovery.",
  },
];

export const connectorCatalog: ConnectorCatalogItem[] = [
  {
    id: "phone-parse",
    name: "Phone Intelligence",
    category: "Phone OSINT",
    status: "live",
    description: "E.164 parsing, country identification, formatting, and telecom metadata normalization.",
    officialUrl: "https://github.com/catamphetamine/libphonenumber-js",
    queryKinds: ["phone"],
  },
  {
    id: "twilio-lookup",
    name: "Twilio Lookup",
    category: "Phone OSINT",
    status: "requires_key",
    description: "Official phone lookup API for validation and telecom metadata.",
    officialUrl: "https://www.twilio.com/docs/lookup/v2-api",
    queryKinds: ["phone"],
    notes: "Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to activate live phone lookup.",
  },
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
    id: "sec-edgar",
    name: "SEC Company Tickers",
    category: "Registry",
    status: "live",
    description: "Official SEC public-company ticker and issuer reference data.",
    officialUrl: "https://www.sec.gov/search-filings",
    queryKinds: ["company", "keyword", "person"],
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
    id: "wayback",
    name: "Wayback Machine",
    category: "Archives",
    status: "live",
    description: "Internet Archive snapshot availability and CDX capture history.",
    officialUrl: "https://archive.org/web/",
    queryKinds: ["domain", "username", "company", "keyword", "phone"],
  },
  {
    id: "rdap",
    name: "RDAP",
    category: "Technical Footprint",
    status: "live",
    description: "Registration and lifecycle data for public domains through RDAP.",
    officialUrl: "https://rdap.org/",
    queryKinds: ["domain"],
  },
  {
    id: "dns-over-https",
    name: "DNS over HTTPS",
    category: "Technical Footprint",
    status: "live",
    description: "DNS records via HTTPS for A, AAAA, MX, NS, TXT, and CNAME analysis.",
    officialUrl: "https://developers.cloudflare.com/1.1.1.1/encryption/dns-over-https/make-api-requests/",
    queryKinds: ["domain"],
  },
  {
    id: "website-metadata",
    name: "Website Metadata",
    category: "Technical Footprint",
    status: "live",
    description: "Homepage title, description, canonical, robots, and sitemap checks.",
    officialUrl: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta/name",
    queryKinds: ["domain"],
  },
  {
    id: "crunchbase",
    name: "Crunchbase API",
    category: "Company Intelligence",
    status: "requires_key",
    description: "Company, person, and funding data via Crunchbase official API.",
    officialUrl: "https://data.crunchbase.com/v4-legacy/docs/using-autocompletes-api",
    queryKinds: ["company", "person", "keyword"],
    notes: "Requires CRUNCHBASE_API_KEY. This connector is official and optional, not scraped without credentials.",
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
    queryKinds: ["company", "person", "keyword", "phone"],
    notes: "Useful for compliance and screening workflows. Add API or dataset bridge when ready to operationalize it.",
  },
  {
    id: "spiderfoot",
    name: "SpiderFoot",
    category: "OSINT Automation",
    status: "ready",
    description: "Automated investigation engine for domains, IPs, emails, usernames, and phone-linked pivots.",
    officialUrl: "https://github.com/smicallef/spiderfoot",
    queryKinds: ["company", "domain", "email", "username", "keyword", "phone"],
    notes: "Set SPIDERFOOT_BRIDGE_URL to surface real SpiderFoot results inside the app.",
  },
  {
    id: "theharvester",
    name: "theHarvester",
    category: "OSINT Automation",
    status: "ready",
    description: "Public email, domain, and subdomain discovery across search sources.",
    officialUrl: "https://github.com/laramies/theHarvester",
    queryKinds: ["domain", "company", "email", "keyword"],
    notes: "Set THEHARVESTER_BRIDGE_URL to activate a worker-backed integration.",
  },
  {
    id: "subfinder",
    name: "Subfinder",
    category: "Technical Footprint",
    status: "ready",
    description: "Fast passive subdomain enumeration for external surface mapping.",
    officialUrl: "https://github.com/projectdiscovery/subfinder",
    queryKinds: ["domain"],
    notes: "Good fit for a background job worker rather than request-time Vercel execution.",
  },
  {
    id: "amass",
    name: "OWASP Amass",
    category: "Technical Footprint",
    status: "ready",
    description: "Attack surface mapping and network infrastructure discovery.",
    officialUrl: "https://github.com/owasp-amass/amass",
    queryKinds: ["domain", "company"],
    notes: "Set AMASS_BRIDGE_URL to activate deeper graph and infra discovery.",
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
    notes: "Strong GitHub pivot pack when you want deeper analyst-led exploration beyond public search endpoints.",
  },
  {
    id: "sherlock",
    name: "Sherlock",
    category: "Identity",
    status: "ready",
    description: "Username enumeration across public services.",
    officialUrl: "https://github.com/sherlock-project/sherlock",
    queryKinds: ["username", "person"],
    notes: "Set SHERLOCK_BRIDGE_URL to connect a real Sherlock worker. The app already includes a lightweight deployable footprint layer.",
  },
  {
    id: "maigret",
    name: "Maigret",
    category: "Identity",
    status: "ready",
    description: "Username and account footprint search across public sites.",
    officialUrl: "https://github.com/soxoj/maigret",
    queryKinds: ["username", "person"],
    notes: "Set MAIGRET_BRIDGE_URL to connect a richer username worker.",
  },
  {
    id: "gitleaks",
    name: "Gitleaks",
    category: "Defensive",
    status: "ready",
    description: "Defensive secret scanning for public repositories and code exposures.",
    officialUrl: "https://github.com/gitleaks/gitleaks",
    queryKinds: ["repository", "company", "domain", "keyword"],
    notes: "Keep this scoped to defensive review of public artifacts only.",
  },
  {
    id: "trufflehog",
    name: "TruffleHog",
    category: "Defensive",
    status: "ready",
    description: "Defensive scanning for exposed secrets in public code and artifacts.",
    officialUrl: "https://github.com/trufflesecurity/trufflehog",
    queryKinds: ["repository", "company", "domain", "keyword"],
    notes: "Keep this scoped to defensive review of public artifacts only.",
  },
];

export function inferQueryKind(input: string): QueryKind {
  const query = input.trim();

  if (/^\+\d[\d\s().-]{6,}$/.test(query)) {
    return "phone";
  }

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query)) {
    return "email";
  }

  if (/^(?:https?:\/\/)?github\.com\/[^/\s]+\/[^/\s]+\/?$/.test(query)) {
    return "repository";
  }

  if (/^(?!https?:\/\/)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(query)) {
    return "domain";
  }

  if (/^(?:@)?[a-z0-9][a-z0-9._-]{1,38}$/i.test(query)) {
    return query.startsWith("@") ? "username" : "keyword";
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

function secHeaders() {
  return {
    Accept: "application/json",
    "User-Agent": SEC_USER_AGENT,
  };
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    signal: AbortSignal.timeout(9000),
  });

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function fetchText(url: string, init?: RequestInit): Promise<string> {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    redirect: "follow",
    signal: AbortSignal.timeout(9000),
  });

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }

  return response.text();
}

function toTitleCase(text: string) {
  return text.replace(/(^\w|\s\w)/g, (match) => match.toUpperCase());
}

function extractMatch(html: string, pattern: RegExp) {
  return pattern.exec(html)?.[1]?.replace(/\s+/g, " ").trim();
}

function canonicalizeUsername(query: string) {
  return query.replace(/^@/, "").trim();
}

function safeDomainFromQuery(query: string) {
  return query
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .toLowerCase();
}

function normalizeBridgeItem(toolName: string, item: SearchItem, index: number): SearchItem {
  return {
    ...item,
    id: item.id || `${toolName}-${index}`,
    source: item.source || toolName,
    tags: item.tags || [toolName.toLowerCase(), "worker"],
  };
}

async function callToolBridge(
  config: BridgeConfig,
  query: string,
  inferredType: QueryKind,
): Promise<SearchSection | null> {
  const bridgeUrl = process.env[config.urlEnv];

  if (!bridgeUrl || !config.queryKinds.includes(inferredType)) {
    return null;
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  const token = process.env[config.tokenEnv];
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(bridgeUrl, {
    method: "POST",
    headers,
    cache: "no-store",
    body: JSON.stringify({
      query,
      type: inferredType,
    }),
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) {
    throw new Error(`${config.name} bridge returned ${response.status}`);
  }

  const data = (await response.json()) as {
    title?: string;
    description?: string;
    items?: SearchItem[];
  };

  return {
    id: config.id,
    title: data.title || config.name,
    description:
      data.description || `Results returned by the configured ${config.name} worker.`,
    items: (data.items || []).map((item, index) =>
      normalizeBridgeItem(config.name, item, index),
    ),
  };
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
    details: [
      { label: "Jurisdiction", value: record.attributes.entity.legalJurisdiction || "Unknown" },
      { label: "Country", value: record.attributes.entity.legalAddress?.country || "Unknown" },
      { label: "Status", value: record.attributes.registration?.status || "Unknown" },
    ],
  }));
}

async function searchSecCompanies(query: string): Promise<SearchItem[]> {
  const data = await fetchJson<
    Record<
      string,
      {
        cik_str: number;
        ticker: string;
        title: string;
      }
    >
  >("https://www.sec.gov/files/company_tickers.json", {
    headers: secHeaders(),
  });

  const normalized = query.trim().toLowerCase();
  const matches = Object.values(data)
    .filter((item) => {
      const title = item.title.toLowerCase();
      const ticker = item.ticker.toLowerCase();
      return (
        title.includes(normalized) ||
        ticker.includes(normalized) ||
        normalized.includes(ticker)
      );
    })
    .slice(0, 5);

  return matches.map((item) => ({
    id: `sec-${item.cik_str}`,
    source: "SEC",
    type: "issuer",
    title: item.title,
    subtitle: item.ticker,
    description: `Official SEC issuer reference for CIK ${item.cik_str}`,
    url: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${item.cik_str}&owner=exclude&count=40`,
    tags: ["sec", "public company"],
    details: [
      { label: "Ticker", value: item.ticker },
      { label: "CIK", value: String(item.cik_str) },
    ],
  }));
}

async function searchGithubUsers(query: string): Promise<SearchItem[]> {
  const data = await fetchJson<{
    items: Array<{
      id: number;
      login: string;
      type: string;
      html_url: string;
      score: number;
    }>;
  }>(
    `https://api.github.com/search/users?q=${encodeURIComponent(query)}&per_page=6`,
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
    details: [
      { label: "Score", value: item.score.toFixed(1) },
      { label: "Profile", value: item.html_url },
    ],
  }));
}

async function searchGithubExactUser(username: string): Promise<SearchItem[]> {
  try {
    const item = await fetchJson<{
      login: string;
      id: number;
      html_url: string;
      type: string;
      bio: string | null;
      public_repos: number;
      followers: number;
      following: number;
      company: string | null;
      location: string | null;
    }>(`https://api.github.com/users/${encodeURIComponent(username)}`, {
      headers: githubHeaders(),
    });

    return [
      {
        id: `github-exact-${item.id}`,
        source: "GitHub",
        type: "exact-profile",
        title: item.login,
        subtitle: item.type,
        description: item.bio || "Exact GitHub username match.",
        url: item.html_url,
        tags: ["github", "exact match", "username"],
        details: [
          { label: "Public repos", value: String(item.public_repos) },
          { label: "Followers", value: String(item.followers) },
          { label: "Following", value: String(item.following) },
          { label: "Company", value: item.company || "Not listed" },
          { label: "Location", value: item.location || "Not listed" },
        ],
      },
    ];
  } catch {
    return [];
  }
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
    )}&sort=updated&order=desc&per_page=6`,
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
    details: [
      { label: "Stars", value: String(item.stargazers_count) },
      { label: "Updated", value: new Date(item.updated_at).toLocaleDateString("en") },
    ],
  }));
}

async function fetchWaybackSummary(target: string): Promise<WaybackSummary> {
  const encoded = encodeURIComponent(target);
  const [available, captures, pageCountText] = await Promise.all([
    fetchJson<{
      archived_snapshots?: {
        closest?: {
          available: boolean;
          timestamp: string;
          url: string;
        };
      };
    }>(`https://archive.org/wayback/available?url=${encoded}`),
    fetchJson<string[][]>(
      `https://web.archive.org/cdx/search/cdx?url=${encoded}&output=json&fl=timestamp,original&filter=statuscode:200&limit=5`,
    ),
    fetchText(
      `https://web.archive.org/cdx/search/cdx?url=${encoded}&filter=statuscode:200&showNumPages=true`,
    ),
  ]);

  const sampleRows = captures.slice(1).map(([timestamp, original]) => ({
    timestamp,
    original,
  }));
  const rawPageCount = Number(pageCountText.trim());

  return {
    pageCount: Number.isNaN(rawPageCount) ? 0 : rawPageCount,
    closestTimestamp: available.archived_snapshots?.closest?.timestamp,
    closestUrl: available.archived_snapshots?.closest?.url,
    captures: sampleRows,
  };
}

function renderTimestamp(timestamp?: string) {
  if (!timestamp) {
    return "Unknown";
  }

  const year = timestamp.slice(0, 4);
  const month = timestamp.slice(4, 6);
  const day = timestamp.slice(6, 8);
  return `${year}-${month}-${day}`;
}

async function buildWaybackSection(
  target: string,
  sectionId: string,
  title: string,
): Promise<SearchSection | null> {
  try {
    const summary = await fetchWaybackSummary(target);
    const items: SearchItem[] = [
      {
        id: `${sectionId}-summary`,
        source: "Wayback Machine",
        type: "archive-summary",
        title: target,
        subtitle: "Historical web archive coverage",
        description:
          summary.pageCount > 0
            ? `${summary.pageCount} archive result pages with a latest known snapshot.`
            : "No substantial archive history was returned for this target.",
        url: summary.closestUrl,
        tags: ["archive", "history"],
        details: [
          { label: "Archive pages", value: String(summary.pageCount) },
          { label: "Closest capture", value: renderTimestamp(summary.closestTimestamp) },
        ],
      },
      ...summary.captures.map((capture, index) => ({
        id: `${sectionId}-capture-${index}`,
        source: "Wayback Machine",
        type: "capture",
        title: renderTimestamp(capture.timestamp),
        subtitle: capture.original,
        description: "Sample preserved snapshot from CDX history.",
        url: `https://web.archive.org/web/${capture.timestamp}/${capture.original}`,
        tags: ["archive", "capture"],
      })),
    ];

    return {
      id: sectionId,
      title,
      description: "Internet Archive coverage, latest capture, and historical sample points.",
      items,
    };
  } catch {
    return null;
  }
}

async function searchRdapDomain(domain: string): Promise<SearchItem[]> {
  const data = await fetchJson<{
    ldhName: string;
    status?: string[];
    nameservers?: Array<{ ldhName?: string }>;
    entities?: Array<{
      roles?: string[];
      vcardArray?: [string, Array<[string, unknown, string, string]>];
    }>;
    events?: Array<{ eventAction?: string; eventDate?: string }>;
  }>(`https://rdap.org/domain/${encodeURIComponent(domain)}`);

  const registrar = data.entities?.find((entity) =>
    entity.roles?.includes("registrar"),
  );
  const registrarName = registrar?.vcardArray?.[1]?.find((entry) => entry[0] === "fn")?.[3];
  const expiration = data.events?.find((event) => event.eventAction === "expiration");
  const registration = data.events?.find((event) => event.eventAction === "registration");

  return [
    {
      id: `rdap-${domain}`,
      source: "RDAP",
      type: "domain-record",
      title: data.ldhName,
      subtitle: registrarName ? `Registrar: ${registrarName}` : "Registrar data available",
      description: (data.status || []).slice(0, 3).join(" • "),
      url: `https://rdap.org/domain/${encodeURIComponent(domain)}`,
      tags: ["rdap", "domain"],
      details: [
        { label: "Registered", value: registration?.eventDate || "Unknown" },
        { label: "Expires", value: expiration?.eventDate || "Unknown" },
        {
          label: "Nameservers",
          value:
            data.nameservers?.slice(0, 3).map((server) => server.ldhName).filter(Boolean).join(", ") ||
            "Unknown",
        },
      ],
    },
  ];
}

async function searchDnsRecords(domain: string): Promise<SearchItem[]> {
  const recordTypes = ["A", "AAAA", "MX", "NS", "TXT", "CNAME"] as const;
  const results = await Promise.all(
    recordTypes.map(async (type) => {
      try {
        const data = await fetchJson<{
          Answer?: Array<{ data: string }>;
        }>(
          `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${type}`,
          {
            headers: {
              Accept: "application/dns-json",
            },
          },
        );

        const values = (data.Answer || []).map((answer) => answer.data).filter(Boolean);
        return { type, values };
      } catch {
        return { type, values: [] as string[] };
      }
    }),
  );

  return results
    .filter((record) => record.values.length > 0)
    .map((record) => ({
      id: `dns-${record.type}-${domain}`,
      source: "Cloudflare DoH",
      type: `dns-${record.type.toLowerCase()}`,
      title: `${record.type} records`,
      subtitle: domain,
      description: record.values.slice(0, 4).join(" • "),
      url: `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${record.type}`,
      tags: ["dns", record.type.toLowerCase(), "spiderfoot-class"],
      details: [
        { label: "Record count", value: String(record.values.length) },
        { label: "Sample", value: record.values.slice(0, 2).join(" | ") },
      ],
    }));
}

async function searchWebsiteMetadata(domain: string): Promise<SearchItem[]> {
  const httpsUrl = `https://${domain}`;
  const httpUrl = `http://${domain}`;

  let response: Response | null = null;
  let html = "";

  for (const url of [httpsUrl, httpUrl]) {
    try {
      response = await fetch(url, {
        cache: "no-store",
        redirect: "follow",
        signal: AbortSignal.timeout(9000),
      });

      if (response.ok) {
        html = await response.text();
        break;
      }
    } catch {
      // try the next candidate
    }
  }

  if (!response || !response.ok || !html) {
    return [];
  }

  const finalUrl = response.url;
  const origin = new URL(finalUrl).origin;
  const title = extractMatch(html, /<title[^>]*>([^<]+)<\/title>/i);
  const description =
    extractMatch(
      html,
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    ) ||
    extractMatch(
      html,
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    );
  const canonical = extractMatch(
    html,
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i,
  );
  const h1 = extractMatch(html, /<h1[^>]*>([^<]+)<\/h1>/i);

  const [robotsStatus, sitemapStatus] = await Promise.allSettled([
    fetch(`${origin}/robots.txt`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    }),
    fetch(`${origin}/sitemap.xml`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    }),
  ]);

  const robotsOk =
    robotsStatus.status === "fulfilled" ? String(robotsStatus.value.status) : "Unavailable";
  const sitemapOk =
    sitemapStatus.status === "fulfilled" ? String(sitemapStatus.value.status) : "Unavailable";

  return [
    {
      id: `seo-${domain}`,
      source: "Website Metadata",
      type: "seo-snapshot",
      title: title || finalUrl,
      subtitle: finalUrl,
      description: description || "No meta description exposed on the homepage.",
      url: finalUrl,
      tags: ["seo", "metadata", "homepage"],
      details: [
        { label: "Title length", value: String((title || "").length) },
        { label: "Description length", value: String((description || "").length) },
        { label: "Canonical", value: canonical || "Not declared" },
        { label: "Primary H1", value: h1 || "Not found" },
        { label: "robots.txt", value: robotsOk },
        { label: "sitemap.xml", value: sitemapOk },
      ],
    },
  ];
}

async function searchPhoneIntelligence(input: string): Promise<SearchItem[]> {
  const parsed = parsePhoneNumberFromString(input);

  if (!parsed) {
    return [];
  }

  const items: SearchItem[] = [
    {
      id: `phone-${parsed.number}`,
      source: "Phone Intelligence",
      type: "normalized-phone",
      title: parsed.number,
      subtitle: parsed.country || "Country unresolved",
      description: parsed.isValid()
        ? "Phone number parsed and validated against numbering metadata."
        : "Phone number parsed but did not fully validate against numbering metadata.",
      tags: ["phone", "e164", "normalized"],
      details: [
        { label: "International", value: parsed.formatInternational() },
        { label: "National", value: parsed.formatNational() },
        { label: "Country", value: parsed.country || "Unknown" },
        { label: "Calling code", value: `+${parsed.countryCallingCode}` },
        { label: "Possible", value: parsed.isPossible() ? "Yes" : "No" },
        { label: "Valid", value: parsed.isValid() ? "Yes" : "No" },
        { label: "Type", value: parsed.getType() || "Unknown" },
      ],
    },
  ];

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (accountSid && authToken) {
    try {
      const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
      const lookup = await fetchJson<{
        country_code?: string;
        calling_country_code?: string;
        national_format?: string;
        phone_number?: string;
        valid?: boolean;
        url?: string;
      }>(
        `https://lookups.twilio.com/v2/PhoneNumbers/${encodeURIComponent(parsed.number)}`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Basic ${auth}`,
          },
        },
      );

      items.push({
        id: `twilio-${parsed.number}`,
        source: "Twilio Lookup",
        type: "phone-lookup",
        title: lookup.phone_number || parsed.number,
        subtitle: "Official Twilio Lookup",
        description:
          typeof lookup.valid === "boolean"
            ? `Twilio marked this number as ${lookup.valid ? "valid" : "invalid"}.`
            : "Twilio lookup returned a normalization result.",
        url: lookup.url,
        tags: ["phone", "twilio", "official api"],
        details: [
          { label: "Country", value: lookup.country_code || "Unknown" },
          { label: "Calling code", value: lookup.calling_country_code || "Unknown" },
          { label: "National format", value: lookup.national_format || "Unknown" },
          {
            label: "Valid",
            value: typeof lookup.valid === "boolean" ? (lookup.valid ? "Yes" : "No") : "Unknown",
          },
        ],
      });
    } catch {
      // keep base parsing result only
    }
  }

  return items;
}

async function searchCrunchbase(query: string): Promise<SearchItem[]> {
  const key = process.env.CRUNCHBASE_API_KEY;
  if (!key) {
    return [];
  }

  const data = await fetchJson<{
    entities?: Array<{
      identifier?: { uuid?: string; value?: string; permalink?: string };
      short_description?: string;
      facet_ids?: string[];
    }>;
  }>(
    `https://api.crunchbase.com/api/v4/autocompletes?user_key=${encodeURIComponent(
      key,
    )}&query=${encodeURIComponent(query)}&collection_ids=organizations,people`,
  );

  return (data.entities || []).slice(0, 6).map((entity, index) => ({
    id: entity.identifier?.uuid || `crunchbase-${index}`,
    source: "Crunchbase",
    type: "company-intel",
    title: entity.identifier?.value || "Unnamed Crunchbase entity",
    subtitle: (entity.facet_ids || []).join(", ") || "organization",
    description: entity.short_description || "Crunchbase autocomplete result.",
    url: entity.identifier?.permalink
      ? `https://www.crunchbase.com${entity.identifier.permalink}`
      : undefined,
    tags: ["crunchbase", "optional api"],
  }));
}

async function probeProfile(url: string): Promise<number> {
  const response = await fetch(url, {
    method: "HEAD",
    cache: "no-store",
    redirect: "follow",
    signal: AbortSignal.timeout(7000),
  }).catch(async () => {
    const fallback = await fetch(url, {
      method: "GET",
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.timeout(7000),
    });
    return fallback;
  });

  return response.status;
}

async function searchUsernameFootprint(username: string): Promise<SearchItem[]> {
  const normalized = canonicalizeUsername(username);
  const candidates = [
    { platform: "GitHub", url: `https://github.com/${normalized}` },
    { platform: "GitLab", url: `https://gitlab.com/${normalized}` },
    { platform: "DEV", url: `https://dev.to/${normalized}` },
    { platform: "Keybase", url: `https://keybase.io/${normalized}` },
    { platform: "Telegram", url: `https://t.me/${normalized}` },
    { platform: "Hugging Face", url: `https://huggingface.co/${normalized}` },
    { platform: "Buy Me a Coffee", url: `https://buymeacoffee.com/${normalized}` },
  ];

  const probes = await Promise.allSettled(
    candidates.map(async (candidate) => {
      const status = await probeProfile(candidate.url);

      if (status >= 400) {
        return null;
      }

      let archivedPages = 0;
      try {
        const summary = await fetchWaybackSummary(candidate.url);
        archivedPages = summary.pageCount;
      } catch {
        archivedPages = 0;
      }

      const result: ProfileProbe = {
        platform: candidate.platform,
        url: candidate.url,
        status,
        archivedPages,
      };

      return result;
    }),
  );

  return probes
    .flatMap((probe) =>
      probe.status === "fulfilled" && probe.value ? [probe.value] : [],
    )
    .map((probe) => ({
      id: `profile-${probe.platform}-${normalized}`,
      source: "Username Pivot",
      type: "profile-hit",
      title: probe.platform,
      subtitle: probe.url,
      description: `Public profile route responded with status ${probe.status}.`,
      url: probe.url,
      tags: ["username", "profile", "sherlock-class"],
      details: [
        { label: "HTTP status", value: String(probe.status) },
        { label: "Wayback pages", value: String(probe.archivedPages || 0) },
      ],
    }));
}

function recommendedConnectors(kind: QueryKind) {
  return connectorCatalog
    .filter((connector) => connector.queryKinds.includes(kind))
    .sort((a, b) => {
      const statusWeight = { live: 0, ready: 1, requires_key: 2, manual: 3 };
      return statusWeight[a.status] - statusWeight[b.status];
    })
    .slice(0, 12)
    .map((connector) => ({
      id: connector.id,
      source: connector.category,
      type: connector.status,
      title: connector.name,
      subtitle: connector.status.replace("_", " "),
      description: connector.description,
      url: connector.officialUrl,
      tags: connector.queryKinds,
      details: connector.notes ? [{ label: "Operator note", value: connector.notes }] : [],
    }));
}

function addSection(
  sections: SearchSection[],
  usedSources: Set<string>,
  sourceName: string,
  title: string,
  description: string,
  items: SearchItem[],
) {
  if (items.length === 0) {
    return;
  }

  usedSources.add(sourceName);
  sections.push({
    id: title.toLowerCase().replace(/\s+/g, "-"),
    title,
    description,
    items,
  });
}

export async function runUnifiedSearch(query: string): Promise<SearchRun> {
  const inferredType = inferQueryKind(query);
  const normalizedQuery = query.trim();
  const sections: SearchSection[] = [];
  const warnings: string[] = [
    "Results are sourced only from lawful public endpoints and curated open-source workflows.",
    "Treat all matches as analyst leads that still need verification before any real-world action.",
  ];
  const usedSources = new Set<string>();
  const tasks: Array<Promise<void>> = [];

  if (inferredType === "phone") {
    tasks.push(
      (async () => {
        const items = await searchPhoneIntelligence(normalizedQuery);
        addSection(
          sections,
          usedSources,
          "Phone Intelligence",
          "Phone Intelligence",
          "Normalization, telecom metadata, and optional official lookup.",
          items,
        );
      })(),
    );

    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      warnings.push(
        "Twilio Lookup is wired as an optional official connector. Add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to activate live phone lookup.",
      );
    }

    tasks.push(
      (async () => {
        const section = await buildWaybackSection(
          normalizedQuery,
          "wayback-phone",
          "Archive Footprint",
        );
        if (section) {
          usedSources.add("Wayback Machine");
          sections.push(section);
        }
      })(),
    );
  }

  if (inferredType === "company" || inferredType === "keyword") {
    tasks.push(
      (async () => {
        const items = await searchGleifCompanies(normalizedQuery);
        addSection(
          sections,
          usedSources,
          "GLEIF",
          "Registry Matches",
          "Official corporate records from GLEIF LEI data.",
          items,
        );
      })(),
    );

    tasks.push(
      (async () => {
        const items = await searchSecCompanies(normalizedQuery);
        addSection(
          sections,
          usedSources,
          "SEC",
          "Public Company Signals",
          "Official SEC issuer references and ticker matches.",
          items,
        );
      })(),
    );
  }

  if (
    inferredType === "company" ||
    inferredType === "keyword" ||
    inferredType === "username" ||
    inferredType === "person"
  ) {
    tasks.push(
      (async () => {
        const items =
          inferredType === "username"
            ? [
                ...(await searchGithubExactUser(normalizedQuery)),
                ...(await searchGithubUsers(canonicalizeUsername(normalizedQuery))),
              ]
            : await searchGithubUsers(normalizedQuery);

        addSection(
          sections,
          usedSources,
          "GitHub",
          "GitHub Profiles",
          "Public users and organizations related to the query.",
          items,
        );
      })(),
    );
  }

  if (
    inferredType === "company" ||
    inferredType === "keyword" ||
    inferredType === "repository" ||
    inferredType === "domain" ||
    inferredType === "username"
  ) {
    tasks.push(
      (async () => {
        const githubRepoQuery =
          inferredType === "repository"
            ? normalizedQuery.replace(/^https?:\/\/github\.com\//, "")
            : normalizedQuery;
        const items = await searchGithubRepos(githubRepoQuery);
        addSection(
          sections,
          usedSources,
          "GitHub Repository Search",
          "GitHub Repositories",
          "Recent public repositories and code footprints related to the query.",
          items,
        );
      })(),
    );
  }

  if (inferredType === "company" || inferredType === "person" || inferredType === "keyword") {
    tasks.push(
      (async () => {
        const items = await searchCrunchbase(normalizedQuery);
        addSection(
          sections,
          usedSources,
          "Crunchbase",
          "Crunchbase Matches",
          "Company and people intelligence from the official Crunchbase API when configured.",
          items,
        );
      })(),
    );

    if (!process.env.CRUNCHBASE_API_KEY) {
      warnings.push(
        "Crunchbase is wired as an optional official connector. Add CRUNCHBASE_API_KEY to activate it.",
      );
    }
  }

  if (inferredType === "domain") {
    const domain = safeDomainFromQuery(normalizedQuery);

    tasks.push(
      (async () => {
        const items = await searchRdapDomain(domain);
        addSection(
          sections,
          usedSources,
          "RDAP",
          "Domain Registration",
          "Registrar, lifecycle, and nameserver information.",
          items,
        );
      })(),
    );

    tasks.push(
      (async () => {
        const items = await searchDnsRecords(domain);
        addSection(
          sections,
          usedSources,
          "Cloudflare DoH",
          "DNS Footprint",
          "DNS records for technical footprinting and SpiderFoot-style pivots.",
          items,
        );
      })(),
    );

    tasks.push(
      (async () => {
        const items = await searchWebsiteMetadata(domain);
        addSection(
          sections,
          usedSources,
          "Website Metadata",
          "Website Metadata and SEO",
          "Homepage metadata, canonical, and crawl surface indicators.",
          items,
        );
      })(),
    );

    tasks.push(
      (async () => {
        const section = await buildWaybackSection(domain, "wayback-domain", "Web Archives");
        if (section) {
          usedSources.add("Wayback Machine");
          sections.push(section);
        }
      })(),
    );
  }

  if (inferredType === "username") {
    const username = canonicalizeUsername(normalizedQuery);

    tasks.push(
      (async () => {
        const items = await searchUsernameFootprint(username);
        addSection(
          sections,
          usedSources,
          "Username Pivot",
          "Username Footprint",
          "Deployable, Sherlock-class profile pivots across a curated public set.",
          items,
        );
      })(),
    );

    tasks.push(
      (async () => {
        const section = await buildWaybackSection(
          normalizedQuery,
          "wayback-username",
          "Username Archive Trails",
        );
        if (section) {
          usedSources.add("Wayback Machine");
          sections.push(section);
        }
      })(),
    );
  }

  for (const config of bridgeConfigs) {
    if (!config.queryKinds.includes(inferredType)) {
      continue;
    }

    tasks.push(
      (async () => {
        const section = await callToolBridge(config, normalizedQuery, inferredType);
        if (section && section.items.length > 0) {
          usedSources.add(config.name);
          sections.push(section);
        }
      })(),
    );

    if (!process.env[config.urlEnv]) {
      warnings.push(
        `${config.name} is bridge-ready but not live yet. Set ${config.urlEnv} to connect your self-hosted worker.`,
      );
    }
  }

  const settled = await Promise.allSettled(tasks);
  for (const result of settled) {
    if (result.status === "rejected") {
      warnings.push(
        result.reason instanceof Error
          ? result.reason.message
          : "One of the live sources failed during execution.",
      );
    }
  }

  sections.push({
    id: "recommended",
    title: "Recommended Next Sources",
    description:
      "Curated OSINT connectors and workflows to continue the investigation without leaving the workbench logic.",
    items: recommendedConnectors(inferredType),
  });

  const totalResults = sections.reduce((count, section) => count + section.items.length, 0);
  const liveSourcesUsed = Array.from(usedSources);
  const signalCount = sections.filter((section) => section.id !== "recommended").length;

  return {
    query: normalizedQuery,
    inferredType,
    summary: [
      { label: "Query Type", value: toTitleCase(inferredType) },
      { label: "Live Sources", value: String(liveSourcesUsed.length) },
      { label: "Result Cards", value: String(totalResults) },
      { label: "Signal Sections", value: String(signalCount) },
    ],
    warnings,
    sections,
    usedSources: liveSourcesUsed,
    performedAt: new Date().toISOString(),
  };
}
