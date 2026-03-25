import "server-only";

import { createHash } from "node:crypto";

import { parsePhoneNumberFromString } from "libphonenumber-js/max";

import { formatMessage, getDictionary, type Locale } from "@/lib/i18n";

export type QueryKind =
  | "company"
  | "domain"
  | "username"
  | "email"
  | "repository"
  | "person"
  | "keyword"
  | "phone";

export type ConfidenceLevel = "high" | "medium" | "low";
export type VerificationStatus = "verified" | "likely" | "candidate";
export type MatchKind = "direct" | "derived";

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
  dataTypes?: string[];
  entityType?: string;
  confidence?: ConfidenceLevel;
  verificationStatus?: VerificationStatus;
  verificationNote?: string;
  matchKind?: MatchKind;
  matchNote?: string;
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

export type HeavyToolGuide = {
  id: string;
  name: string;
  configured: boolean;
  tokenConfigured: boolean;
  description: string;
  queryKinds: QueryKind[];
  urlEnv: string;
  tokenEnv: string;
  connectionStatus: string;
  usageHint: string;
};

const SEC_USER_AGENT =
  process.env.SEC_USER_AGENT || "Privat-OSINT/1.0 research@privat-osint.local";

type WaybackSummary = {
  pageCount: number;
  closestUrl?: string;
  closestTimestamp?: string;
  captures: Array<{ timestamp: string; original: string }>;
};

type CommonCrawlCollection = {
  id: string;
  name: string;
  timegate: string;
  "cdx-api": string;
  from: string;
  to: string;
};

type CommonCrawlRecord = {
  timestamp: string;
  url: string;
  status?: string;
  mime?: string;
  length?: string;
  digest?: string;
  filename?: string;
};

type CommonCrawlSummary = {
  collection: CommonCrawlCollection;
  records: CommonCrawlRecord[];
};

type ProfileProbe = {
  platform: string;
  url: string;
  status: number;
  archivedPages?: number;
  confidence: ConfidenceLevel;
  verificationStatus: VerificationStatus;
  verificationNote: string;
  matchKind: MatchKind;
  matchNote: string;
};

type ProfileCandidate = {
  platform: string;
  url: string;
  pathVariants: string[];
  rejectPatterns?: RegExp[];
  headers?: Record<string, string>;
};

type SiteDocument = {
  finalUrl: string;
  origin: string;
  html: string;
};

type SiteResponseMeta = {
  finalUrl: string;
  origin: string;
  headers: Headers;
  status: number;
};

type JsonLdNode = Record<string, unknown>;

type SitePathKind =
  | "about"
  | "team"
  | "contact"
  | "hiring"
  | "docs"
  | "press"
  | "partner"
  | "security";

type SiteLinkCandidate = {
  url: string;
  text: string;
  kind: SitePathKind;
};

type DnsRecordType = "A" | "AAAA" | "MX" | "NS" | "TXT" | "CNAME";

type DnsSnapshot = Record<DnsRecordType, string[]>;

type BridgeConfig = {
  id: string;
  name: string;
  urlEnv: string;
  tokenEnv: string;
  queryKinds: QueryKind[];
  description: string;
};

type BridgeInvocation = {
  query: string;
  inferredType: QueryKind;
  matchKind: MatchKind;
  confidence: ConfidenceLevel;
  verificationStatus: VerificationStatus;
  verificationNote: string;
  matchNote: string;
  detail?: SearchDetail;
};

const highSignalBridgeProfileHosts = [
  "github.com",
  "gist.github.com",
  "gitlab.com",
  "reddit.com",
  "keybase.io",
  "t.me",
  "huggingface.co",
  "stackoverflow.com",
  "linkedin.com",
  "twitter.com",
  "x.com",
  "bsky.app",
  "instagram.com",
  "tiktok.com",
  "dev.to",
  "medium.com",
  "hub.docker.com",
  "kaggle.com",
  "leetcode.com",
  "codeberg.org",
  "bitbucket.org",
  "npmjs.com",
  "pypi.org",
  "replit.com",
  "tryhackme.com",
  "codecademy.com",
  "patreon.com",
  "developer.apple.com",
  "discussions.apple.com",
  "behance.net",
  "hackerone.com",
  "hackerearth.com",
  "hackerrank.com",
  "codeforces.com",
  "codewars.com",
  "chess.com",
  "crowdin.com",
  "news.ycombinator.com",
] as const;

const bridgeProfileRejectFragments = [
  "/search",
  "/users/filter",
  "/explore",
  "/directory",
  "/tag/",
  "/topics/",
  "/hashtag/",
  "/discover",
  "/login",
  "/signup",
] as const;

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
    id: "subfinder-bridge",
    name: "Subfinder Bridge",
    urlEnv: "SUBFINDER_BRIDGE_URL",
    tokenEnv: "SUBFINDER_BRIDGE_TOKEN",
    queryKinds: ["domain", "company", "keyword"],
    description: "Self-hosted Subfinder worker for passive subdomain enumeration.",
  },
  {
    id: "amass-bridge",
    name: "Amass Bridge",
    urlEnv: "AMASS_BRIDGE_URL",
    tokenEnv: "AMASS_BRIDGE_TOKEN",
    queryKinds: ["company", "domain", "keyword"],
    description: "Self-hosted Amass worker for deeper infrastructure and graph discovery.",
  },
  {
    id: "phoneinfoga-bridge",
    name: "PhoneInfoga Bridge",
    urlEnv: "PHONEINFOGA_BRIDGE_URL",
    tokenEnv: "PHONEINFOGA_BRIDGE_TOKEN",
    queryKinds: ["phone"],
    description: "Self-hosted PhoneInfoga worker for deeper phone-number intelligence.",
  },
  {
    id: "octosuite-bridge",
    name: "Octosuite Bridge",
    urlEnv: "OCTOSUITE_BRIDGE_URL",
    tokenEnv: "OCTOSUITE_BRIDGE_TOKEN",
    queryKinds: ["company", "person", "username", "repository", "keyword"],
    description: "Self-hosted Octosuite worker for deeper GitHub investigations and entity mapping.",
  },
];

export function getHeavyToolGuides(locale: Locale): HeavyToolGuide[] {
  return bridgeConfigs.map((config) => {
    const configured = Boolean(process.env[config.urlEnv]);
    const tokenConfigured = Boolean(process.env[config.tokenEnv]);

    return {
      id: config.id,
      name: config.name.replace(" Bridge", ""),
      configured,
      tokenConfigured,
      description: config.description,
      queryKinds: config.queryKinds,
      urlEnv: config.urlEnv,
      tokenEnv: config.tokenEnv,
      connectionStatus:
        locale === "ru"
          ? configured
            ? "Worker уже подключён к сайту"
            : "Нужен отдельный worker-хост"
          : configured
            ? "Worker is already wired into the site"
            : "A separate worker host is still required",
      usageHint:
        locale === "ru"
          ? configured
            ? "После подключения этот инструмент автоматически подмешивается в общую выдачу по поддерживаемым типам запросов."
            : "Поднимите workers/heavy-osint, задайте URL и токен в основном приложении, и результаты начнут появляться прямо в общей выдаче."
          : configured
            ? "Once configured, this tool feeds results back into unified search automatically for supported query types."
            : "Deploy workers/heavy-osint, set the bridge URL and token in the main app, and the results will flow into unified search automatically.",
    };
  });
}

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
    id: "email-intelligence",
    name: "Email Intelligence",
    category: "Identity",
    status: "live",
    description: "Mailbox normalization, provider classification, and local-part pivots.",
    officialUrl: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/email",
    queryKinds: ["email"],
  },
  {
    id: "gravatar",
    name: "Gravatar",
    category: "Identity",
    status: "live",
    description: "Public avatar footprint check for email hashes.",
    officialUrl: "https://gravatar.com/",
    queryKinds: ["email"],
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
    id: "common-crawl",
    name: "Common Crawl Index",
    category: "Archives",
    status: "live",
    description: "Historical crawl index coverage across recent Common Crawl collections.",
    officialUrl: "https://index.commoncrawl.org/",
    queryKinds: ["domain"],
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
    id: "ripestat",
    name: "RIPEstat",
    category: "Technical Footprint",
    status: "live",
    description: "Public IP, prefix, and ASN intelligence for hosting and provider mapping.",
    officialUrl: "https://stat.ripe.net/",
    queryKinds: ["domain"],
  },
  {
    id: "website-metadata",
    name: "Website Metadata",
    category: "Technical Footprint",
    status: "live",
    description: "Homepage title, description, canonical, robots, sitemap, and contact hint extraction.",
    officialUrl: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta/name",
    queryKinds: ["domain"],
  },
  {
    id: "website-headers",
    name: "HTTP Headers",
    category: "Technical Footprint",
    status: "live",
    description: "Server, redirect, and security-header footprint from the target site.",
    officialUrl: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers",
    queryKinds: ["domain"],
  },
  {
    id: "website-structured-data",
    name: "Structured Data",
    category: "Technical Footprint",
    status: "live",
    description: "JSON-LD organization, website, and public entity signals embedded on the site.",
    officialUrl: "https://schema.org/",
    queryKinds: ["domain"],
  },
  {
    id: "crawl-surface",
    name: "Crawl Surface",
    category: "Technical Footprint",
    status: "live",
    description: "robots.txt, sitemap.xml, humans.txt, and crawl-surface discovery for useful paths.",
    officialUrl: "https://www.rfc-editor.org/rfc/rfc9309",
    queryKinds: ["domain"],
  },
  {
    id: "crtsh",
    name: "crt.sh",
    category: "Technical Footprint",
    status: "live",
    description: "Certificate transparency logs for hostnames and passive subdomain hints.",
    officialUrl: "https://crt.sh/",
    queryKinds: ["domain"],
  },
  {
    id: "security-txt",
    name: "security.txt",
    category: "Technical Footprint",
    status: "live",
    description: "Public security contact file and disclosure policy discovery.",
    officialUrl: "https://securitytxt.org/",
    queryKinds: ["domain"],
  },
  {
    id: "wikidata",
    name: "Wikidata Entity Search",
    category: "Entity Intelligence",
    status: "live",
    description: "Public entity descriptions and reference pivots for organizations and people.",
    officialUrl: "https://www.wikidata.org/wiki/Wikidata:Main_Page",
    queryKinds: ["company", "person", "keyword"],
  },
  {
    id: "wikipedia",
    name: "Wikipedia Search",
    category: "Entity Intelligence",
    status: "live",
    description: "Public encyclopedia summaries and entity context from Wikipedia.",
    officialUrl: "https://www.mediawiki.org/wiki/API:Main_page",
    queryKinds: ["company", "person", "keyword"],
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
    status: "requires_key",
    description: "Sanctions, watchlists, PEPs, and due diligence datasets.",
    officialUrl: "https://www.opensanctions.org/docs/api/",
    queryKinds: ["company", "person", "keyword", "phone"],
    notes: "The current OpenSanctions API requires credentials. Wire an API key or self-host a synced dataset when you operationalize this layer.",
  },
  {
    id: "spiderfoot",
    name: "SpiderFoot",
    category: "OSINT Automation",
    status: "ready",
    description: "Automated investigation engine for domains, IPs, emails, usernames, and phone-linked pivots.",
    officialUrl: "https://github.com/smicallef/spiderfoot",
    queryKinds: ["company", "domain", "email", "username", "keyword", "phone"],
    notes: "The workbench already calls native HTTP sources for DNS, RDAP, Wayback, certificate logs, metadata, and username pivots. Use SpiderFoot as an optional self-hosted depth layer when you need heavier automation.",
  },
  {
    id: "theharvester",
    name: "theHarvester",
    category: "OSINT Automation",
    status: "ready",
    description: "Public email, domain, and subdomain discovery across search sources.",
    officialUrl: "https://github.com/laramies/theHarvester",
    queryKinds: ["domain", "company", "email", "keyword"],
    notes: "Best treated as an optional depth worker. The live app now pulls several native public sources directly for request-time results.",
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
    notes: "Use as a background depth layer when you need large-scale infrastructure mapping beyond direct request-time sources.",
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
    id: "phoneinfoga",
    name: "PhoneInfoga",
    category: "Phone OSINT",
    status: "ready",
    description: "Deeper phone-number footprinting and public-source phone pivots.",
    officialUrl: "https://github.com/sundowndev/phoneinfoga",
    queryKinds: ["phone"],
    notes: "Best treated as an optional heavy-worker depth layer alongside the built-in phone normalization flow.",
  },
  {
    id: "sherlock",
    name: "Sherlock",
    category: "Identity",
    status: "ready",
    description: "Username enumeration across public services.",
    officialUrl: "https://github.com/sherlock-project/sherlock",
    queryKinds: ["username", "person"],
    notes: "The live app now performs native Sherlock-class probes across a curated public platform set. Use a dedicated Sherlock worker only when you want much broader coverage.",
  },
  {
    id: "maigret",
    name: "Maigret",
    category: "Identity",
    status: "ready",
    description: "Username and account footprint search across public sites.",
    officialUrl: "https://github.com/soxoj/maigret",
    queryKinds: ["username", "person"],
    notes: "Optional richer depth layer for large username sweeps. The native app already runs direct public footprint checks at request time.",
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

  if (/^(?:https?:\/\/)?(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}(?:[/?#].*)?$/i.test(query)) {
    if (/^(?:https?:\/\/)?github\.com\/[^/\s]+\/[^/\s]+\/?$/i.test(query)) {
      return "repository";
    }

    return "domain";
  }

  if (/^\+\d[\d\s().-]{6,}$/.test(query)) {
    return "phone";
  }

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query)) {
    return "email";
  }

  if (/^(?:@)?[a-z0-9][a-z0-9._-]{1,38}$/i.test(query)) {
    return query.startsWith("@") ? "username" : "keyword";
  }

  if (query.includes("/")) {
    return "repository";
  }

  if (looksLikePersonName(query)) {
    return "person";
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

export function humanizeQueryKind(kind: QueryKind, locale: Locale) {
  if (locale === "ru") {
    return {
      company: "Компания",
      domain: "Домен",
      username: "Username",
      email: "Email",
      repository: "Репозиторий",
      person: "Человек",
      keyword: "Ключевое слово",
      phone: "Телефон",
    }[kind];
  }

  return toTitleCase(kind);
}

export function humanizeConnectorCategory(category: string, locale: Locale) {
  if (locale === "ru") {
    return {
      "Phone OSINT": "OSINT по телефону",
      Identity: "Идентичность",
      Registry: "Реестры",
      "Code Intelligence": "Code Intelligence",
      Archives: "Архивы",
      "Technical Footprint": "Технический след",
      "Entity Intelligence": "Entity Intelligence",
      "Company Intelligence": "Информация о компаниях",
      Compliance: "Комплаенс",
      "OSINT Automation": "OSINT-автоматизация",
      Defensive: "Защитный анализ",
    }[category] || category;
  }

  return category;
}

function extractMatch(html: string, pattern: RegExp) {
  return pattern.exec(html)?.[1]?.replace(/\s+/g, " ").trim();
}

function extractMatches(text: string, pattern: RegExp) {
  return Array.from(text.matchAll(pattern))
    .map((match) => match[1]?.trim())
    .filter(Boolean) as string[];
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function rootHost(hostname: string) {
  return hostname.replace(/^www\./i, "").toLowerCase();
}

function sameSiteHost(candidate: string, target: string) {
  const normalizedCandidate = rootHost(candidate);
  const normalizedTarget = rootHost(target);

  return (
    normalizedCandidate === normalizedTarget ||
    normalizedCandidate.endsWith(`.${normalizedTarget}`) ||
    normalizedTarget.endsWith(`.${normalizedCandidate}`)
  );
}

function normalizeUrlForKey(url?: string) {
  if (!url) {
    return "";
  }

  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.replace(/\/+$/, "") || "/";
    return `${parsed.origin}${pathname}`.toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

function extractMetaContent(html: string, key: string) {
  return (
    extractMatch(
      html,
      new RegExp(
        `<meta[^>]+property=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`,
        "i",
      ),
    ) ||
    extractMatch(
      html,
      new RegExp(
        `<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`,
        "i",
      ),
    )
  );
}

function inferInfrastructureProvider(values: string[]) {
  const haystack = values.join(" ").toLowerCase();
  const knownProviders = [
    { pattern: /(cloudflare|cloudflarenet)/i, label: "Cloudflare" },
    { pattern: /(vercel|vercel-dns|vercel\.app)/i, label: "Vercel" },
    { pattern: /(netlify)/i, label: "Netlify" },
    { pattern: /(fastly)/i, label: "Fastly" },
    { pattern: /(akamai)/i, label: "Akamai" },
    { pattern: /(amazon|aws|cloudfront)/i, label: "Amazon Web Services" },
    { pattern: /(google|gcp|googleusercontent)/i, label: "Google Cloud" },
    { pattern: /(azure|microsoft)/i, label: "Microsoft Azure" },
    { pattern: /(digitalocean)/i, label: "DigitalOcean" },
    { pattern: /(heroku)/i, label: "Heroku" },
    { pattern: /(github|githubusercontent|github\.io)/i, label: "GitHub Pages" },
  ];

  return knownProviders.find((provider) => provider.pattern.test(haystack))?.label || "";
}

function isLikelyPersonName(value: string) {
  const cleaned = value.trim();
  if (!cleaned || cleaned.length < 5 || cleaned.length > 80) {
    return false;
  }

  if (/\b(privacy|policy|cookie|terms|about|contact|careers?|jobs|support|security|blog)\b/i.test(cleaned)) {
    return false;
  }

  return /^[\p{Lu}][\p{L}'’-]+(?:\s+[\p{Lu}][\p{L}'’-]+){1,2}$/u.test(cleaned);
}

function extractRoleAnchoredPeople(text: string) {
  const normalized = text.replace(/\s+/g, " ");
  const roleWords =
    "CEO|CTO|CFO|COO|Founder|Co-Founder|Owner|President|Director|Managing Director|Head of [A-Z][a-z]+|генеральный директор|основатель|директор|руководитель";
  const patterns = [
    new RegExp(
      `([\\p{Lu}][\\p{L}'’-]+(?:\\s+[\\p{Lu}][\\p{L}'’-]+){1,2})\\s*(?:[-–—|,:])\\s*(${roleWords})`,
      "giu",
    ),
    new RegExp(
      `(${roleWords})\\s*(?:[-–—|,:]|is\\s+|:)\\s*([\\p{Lu}][\\p{L}'’-]+(?:\\s+[\\p{Lu}][\\p{L}'’-]+){1,2})`,
      "giu",
    ),
  ];

  const matches = patterns.flatMap((pattern) =>
    Array.from(normalized.matchAll(pattern)).map((match) => {
      const first = (match[1] || "").trim();
      const second = (match[2] || "").trim();
      const name = isLikelyPersonName(first) ? first : second;
      const role = name === first ? second : first;

      return {
        name,
        role,
      };
    }),
  );

  return Array.from(
    new Map(
      matches
        .filter((match) => match.name && match.role && isLikelyPersonName(match.name))
        .map((match) => [`${match.name.toLowerCase()}|${match.role.toLowerCase()}`, match]),
    ).values(),
  ).slice(0, 8);
}

async function fetchDnsSnapshot(domain: string): Promise<DnsSnapshot> {
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

        return [type, (data.Answer || []).map((answer) => answer.data).filter(Boolean)] as const;
      } catch {
        return [type, [] as string[]] as const;
      }
    }),
  );

  return Object.fromEntries(results) as DnsSnapshot;
}

async function fetchSiteDocument(domain: string): Promise<SiteDocument | null> {
  for (const url of [`https://${domain}`, `http://${domain}`]) {
    try {
      const response = await fetch(url, {
        cache: "no-store",
        redirect: "follow",
        signal: AbortSignal.timeout(9000),
      });

      if (!response.ok) {
        continue;
      }

      const html = await response.text();
      if (!html) {
        continue;
      }

      const finalUrl = response.url;
      return {
        finalUrl,
        origin: new URL(finalUrl).origin,
        html,
      };
    } catch {
      // try next candidate
    }
  }

  return null;
}

async function fetchSiteResponseMeta(domain: string): Promise<SiteResponseMeta | null> {
  for (const url of [`https://${domain}`, `http://${domain}`]) {
    try {
      let response = await fetch(url, {
        method: "HEAD",
        cache: "no-store",
        redirect: "follow",
        signal: AbortSignal.timeout(9000),
      });

      if (!response.ok || response.status === 405) {
        response = await fetch(url, {
          method: "GET",
          cache: "no-store",
          redirect: "follow",
          signal: AbortSignal.timeout(9000),
        });
      }

      if (!response.ok) {
        continue;
      }

      return {
        finalUrl: response.url,
        origin: new URL(response.url).origin,
        headers: response.headers,
        status: response.status,
      };
    } catch {
      // try next candidate
    }
  }

  return null;
}

function classifySitePath(target: string, label: string): SitePathKind | null {
  const text = `${target} ${label}`.toLowerCase();

  if (/(partner|partners|integration|integrations|ecosystem|alliances?)/i.test(text)) {
    return "partner";
  }

  if (/(contact|contacts|support|help|reach us|get in touch)/i.test(text)) {
    return "contact";
  }

  if (/(career|careers|job|jobs|hiring|vacanc)/i.test(text)) {
    return "hiring";
  }

  if (/(about|company|story|mission)/i.test(text)) {
    return "about";
  }

  if (/(team|leadership|founders?|people)/i.test(text)) {
    return "team";
  }

  if (/(docs|documentation|developer|api)/i.test(text)) {
    return "docs";
  }

  if (/(press|news|media|blog)/i.test(text)) {
    return "press";
  }

  if (/(security|trust|privacy|legal|compliance)/i.test(text)) {
    return "security";
  }

  return null;
}

function humanizeSitePath(kind: SitePathKind, locale: Locale) {
  if (locale === "ru") {
    return {
      about: "О компании",
      team: "Команда",
      contact: "Контакты",
      hiring: "Карьера",
      docs: "Документация",
      press: "Пресса / блог",
      partner: "Партнёры / интеграции",
      security: "Безопасность / доверие",
    }[kind];
  }

  return {
    about: "About",
    team: "Team",
    contact: "Contact",
    hiring: "Hiring",
    docs: "Docs",
    press: "Press / Blog",
    partner: "Partners / Integrations",
    security: "Security / Trust",
  }[kind];
}

function extractSiteLinkCandidates(html: string, finalUrl: string): SiteLinkCandidate[] {
  const baseUrl = new URL(finalUrl);
  const candidates = Array.from(
    html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi),
  )
    .map((match) => {
      const href = match[1]?.trim();
      const text = stripHtml(match[2] || "");

      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return null;
      }

      try {
        const resolved = new URL(href, finalUrl);

        if (!/^https?:$/i.test(resolved.protocol)) {
          return null;
        }

        if (!sameSiteHost(resolved.hostname, baseUrl.hostname)) {
          return null;
        }

        const kind = classifySitePath(resolved.href, text);
        if (!kind) {
          return null;
        }

        return {
          url: resolved.href.split("#")[0],
          text,
          kind,
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean) as SiteLinkCandidate[];

  return Array.from(
    new Map(candidates.map((candidate) => [candidate.url, candidate])).values(),
  ).slice(0, 8);
}

function extractExternalDomains(html: string, siteHostname: string) {
  return uniqueValues(
    Array.from(html.matchAll(/href=["'](https?:\/\/[^"']+)["']/gi))
      .map((match) => {
        try {
          return new URL(match[1]).hostname.replace(/^www\./i, "");
        } catch {
          return "";
        }
      })
      .filter(
        (hostname) =>
          hostname &&
          !sameSiteHost(hostname, siteHostname) &&
          !/(linkedin\.com|twitter\.com|x\.com|facebook\.com|instagram\.com|youtube\.com|t\.me|github\.com)/i.test(
            hostname,
          ),
      ),
  ).slice(0, 6);
}

function parseJsonSafely(input: string) {
  try {
    return JSON.parse(input) as unknown;
  } catch {
    return null;
  }
}

function parseJsonLines<T>(input: string) {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      const parsed = parseJsonSafely(line);
      return parsed && typeof parsed === "object" ? [parsed as T] : [];
    });
}

function flattenJsonLd(input: unknown): JsonLdNode[] {
  if (!input) {
    return [];
  }

  if (Array.isArray(input)) {
    return input.flatMap((item) => flattenJsonLd(item));
  }

  if (typeof input !== "object") {
    return [];
  }

  const node = input as Record<string, unknown>;
  const graph = Array.isArray(node["@graph"]) ? node["@graph"] : [];

  return [node, ...graph.flatMap((item) => flattenJsonLd(item))].filter(
    (value): value is JsonLdNode => typeof value === "object" && value !== null,
  );
}

function extractJsonLdObjects(html: string) {
  return Array.from(
    html.matchAll(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  )
    .flatMap((match) => flattenJsonLd(parseJsonSafely(match[1] || "")))
    .filter((node) => Object.keys(node).length > 0);
}

function readJsonLdText(node: JsonLdNode, key: string) {
  const value = node[key];

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "object" && value && "name" in value && typeof value.name === "string") {
    return value.name;
  }

  if (typeof value === "object" && value) {
    const address = value as Record<string, unknown>;
    const joined = [
      address.streetAddress,
      address.addressLocality,
      address.addressRegion,
      address.postalCode,
      address.addressCountry,
    ]
      .filter((entry): entry is string => typeof entry === "string" && Boolean(entry.trim()))
      .join(", ");

    if (joined) {
      return joined;
    }
  }

  return "";
}

function readJsonLdList(node: JsonLdNode, key: string) {
  const value = node[key];

  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value
      .flatMap((entry) => {
        if (typeof entry === "string") {
          return [entry];
        }
        if (typeof entry === "object" && entry && "url" in entry && typeof entry.url === "string") {
          return [entry.url];
        }
        if (typeof entry === "object" && entry && "name" in entry && typeof entry.name === "string") {
          return [entry.name];
        }
        return [];
      })
      .filter(Boolean);
  }

  return [];
}

function jsonLdType(node: JsonLdNode) {
  const raw = node["@type"];

  if (typeof raw === "string") {
    return raw;
  }

  if (Array.isArray(raw)) {
    return raw.filter((value): value is string => typeof value === "string").join(", ");
  }

  return "";
}

function parseXmlLocs(xml: string) {
  return uniqueValues(
    Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/gi))
      .map((match) => match[1]?.trim())
      .filter(Boolean) as string[],
  );
}

function canonicalizeUsername(query: string) {
  return query.replace(/^@/, "").trim();
}

function slugToken(token: string) {
  return token
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

type PersonIdentity = {
  normalizedName: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  initials: string;
  usernameVariants: string[];
  emailLocalParts: string[];
};

function looksLikePersonName(query: string) {
  const tokens = query
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (tokens.length < 2 || tokens.length > 3) {
    return false;
  }

  const companyHints = /\b(inc|llc|ltd|corp|company|co|gmbh|s\.a\.|sa|plc|group|holdings)\b/i;
  if (companyHints.test(query)) {
    return false;
  }

  return tokens.every((token) => /^[\p{L}][\p{L}'-]+$/u.test(token));
}

function buildPersonIdentity(query: string): PersonIdentity | null {
  if (!looksLikePersonName(query)) {
    return null;
  }

  const tokens = query
    .trim()
    .split(/\s+/)
    .map((token) => token.replace(/(^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$)/gu, ""))
    .filter(Boolean);

  if (tokens.length < 2) {
    return null;
  }

  const normalizedTokens = tokens.map(slugToken).filter(Boolean);
  const firstName = normalizedTokens[0];
  const lastName = normalizedTokens[normalizedTokens.length - 1];
  const middleName =
    normalizedTokens.length === 3 ? normalizedTokens[1] : undefined;

  if (!firstName || !lastName) {
    return null;
  }

  const firstInitial = firstName[0] || "";
  const lastInitial = lastName[0] || "";
  const middleInitial = middleName?.[0] || "";

  const usernameVariants = uniqueValues([
    `${firstName}.${lastName}`,
    `${firstName}_${lastName}`,
    `${firstName}-${lastName}`,
    `${firstName}${lastName}`,
    `${firstInitial}${lastName}`,
    `${firstName}${lastInitial}`,
    middleName ? `${firstName}.${middleInitial}.${lastName}` : "",
    middleName ? `${firstName}${middleInitial}${lastName}` : "",
    `${lastName}.${firstName}`,
    `${lastName}${firstName}`,
  ]).slice(0, 8);

  const emailLocalParts = uniqueValues([
    `${firstName}.${lastName}`,
    `${firstName}_${lastName}`,
    `${firstInitial}${lastName}`,
    middleName ? `${firstName}.${middleInitial}.${lastName}` : "",
  ]).slice(0, 6);

  return {
    normalizedName: tokens.join(" "),
    firstName: tokens[0],
    middleName: tokens.length === 3 ? tokens[1] : undefined,
    lastName: tokens[tokens.length - 1],
    initials: [firstInitial, middleInitial, lastInitial]
      .filter(Boolean)
      .join("")
      .toUpperCase(),
    usernameVariants,
    emailLocalParts,
  };
}

function safeDomainFromQuery(query: string) {
  return query
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .toLowerCase();
}

function parseEmailQuery(query: string) {
  const normalized = query.trim().toLowerCase();
  const [localPart = "", domain = ""] = normalized.split("@");

  return {
    normalized,
    localPart,
    domain,
  };
}

function md5(value: string) {
  return createHash("md5").update(value).digest("hex");
}

function isFreeMailDomain(domain: string) {
  return new Set([
    "gmail.com",
    "googlemail.com",
    "outlook.com",
    "hotmail.com",
    "live.com",
    "yahoo.com",
    "icloud.com",
    "me.com",
    "aol.com",
    "proton.me",
    "protonmail.com",
    "pm.me",
    "mail.com",
    "yandex.ru",
    "yandex.com",
    "gmx.com",
    "gmx.de",
  ]).has(domain);
}

async function searchPersonBreakdown(
  query: string,
  locale: Locale,
): Promise<SearchItem[]> {
  const identity = buildPersonIdentity(query);

  if (!identity) {
    return [];
  }

  return [
    {
      id: `person-breakdown-${identity.usernameVariants[0] || slugToken(query)}`,
      source: locale === "ru" ? "Разбор человека" : "Person Breakdown",
      type: "name-analysis",
      title: identity.normalizedName,
      subtitle:
        locale === "ru"
          ? "Имя разложено на поисковые pivots"
          : "Name decomposed into pivot-ready search variants",
      description:
        locale === "ru"
          ? "Сначала проверяйте точные entity-совпадения, затем переходите к username-вариантам, GitHub-handle и email local-part гипотезам."
          : "Start with exact entity matches, then pivot into username variants, GitHub handles, and likely email local-parts.",
      tags: ["person", "name-analysis", "pivot-plan"],
      confidence: "medium",
      verificationStatus: "likely",
      verificationNote:
        locale === "ru"
          ? "Это не внешний источник, а аналитический разбор имени для дальнейших проверок."
          : "This is an analyst-generated name breakdown for follow-on verification, not an external source.",
      matchKind: "derived",
      matchNote:
        locale === "ru"
          ? "Варианты построены из имени и фамилии и требуют подтверждения во внешних источниках."
          : "These variants were derived from the name and still need external corroboration.",
      details: [
        {
          label: locale === "ru" ? "Имя" : "First name",
          value: identity.firstName,
        },
        ...(identity.middleName
          ? [
              {
                label: locale === "ru" ? "Среднее имя" : "Middle name",
                value: identity.middleName,
              },
            ]
          : []),
        {
          label: locale === "ru" ? "Фамилия" : "Last name",
          value: identity.lastName,
        },
        {
          label: locale === "ru" ? "Инициалы" : "Initials",
          value: identity.initials,
        },
        {
          label: locale === "ru" ? "Username-варианты" : "Username variants",
          value: identity.usernameVariants.join(", "),
        },
        {
          label: locale === "ru" ? "Email local-part гипотезы" : "Email local-part guesses",
          value: identity.emailLocalParts.join(", "),
        },
      ],
    },
  ];
}

async function searchPersonVariantFootprints(
  query: string,
  locale: Locale,
): Promise<SearchItem[]> {
  const identity = buildPersonIdentity(query);

  if (!identity) {
    return [];
  }

  const candidates = identity.usernameVariants.slice(0, 2);
  const settled = await Promise.allSettled(
    candidates.map(async (candidate) => {
      const items = await searchUsernameFootprint(candidate, locale);
      return items.map((item, index) => ({
        ...item,
        id: `person-footprint-${candidate}-${index}`,
        details: [
          {
            label: locale === "ru" ? "Username-кандидат" : "Username candidate",
            value: candidate,
          },
          ...(item.details || []),
        ],
      }));
    }),
  );

  const deduped = new Map<string, SearchItem>();
  for (const result of settled) {
    if (result.status !== "fulfilled") {
      continue;
    }

    for (const item of result.value) {
      const key = item.url || `${item.title}-${item.subtitle || ""}`;
      if (!deduped.has(key)) {
        deduped.set(key, item);
      }
    }
  }

  return Array.from(deduped.values()).slice(0, 16);
}

async function searchPersonGithubCandidates(
  query: string,
  locale: Locale,
): Promise<SearchItem[]> {
  const identity = buildPersonIdentity(query);

  if (!identity) {
    return [];
  }

  const settled = await Promise.allSettled(
    identity.usernameVariants.slice(0, 4).map(async (candidate) => {
      const items = await searchGithubExactUser(candidate, locale);
      return items.map((item, index) => ({
        ...item,
        id: `person-github-${candidate}-${index}`,
        confidence: "medium" as ConfidenceLevel,
        verificationStatus: "likely" as VerificationStatus,
        verificationNote:
          locale === "ru"
            ? "GitHub-профиль существует, но связь с человеком выведена из варианта username."
            : "The GitHub profile exists, but its relation to the person was derived from a username variant.",
        matchKind: "derived" as MatchKind,
        matchNote:
          locale === "ru"
            ? "Совпадение получено через username-вариант, а не прямой идентификатор."
            : "This match came from a username variant, not a direct identifier.",
        details: [
          {
            label: locale === "ru" ? "Username-кандидат" : "Username candidate",
            value: candidate,
          },
          ...(item.details || []),
        ],
      }));
    }),
  );

  const deduped = new Map<string, SearchItem>();
  for (const result of settled) {
    if (result.status !== "fulfilled") {
      continue;
    }

    for (const item of result.value) {
      const key = item.url || `${item.title}-${item.subtitle || ""}`;
      if (!deduped.has(key)) {
        deduped.set(key, item);
      }
    }
  }

  return Array.from(deduped.values()).slice(0, 8);
}

function normalizeBridgeItem(
  toolName: string,
  item: SearchItem,
  index: number,
  invocation: BridgeInvocation,
): SearchItem {
  return {
    ...item,
    id: item.id || `${toolName}-${index}`,
    source: item.source || toolName,
    tags: item.tags || [toolName.toLowerCase(), "worker"],
    confidence: item.confidence || invocation.confidence,
    verificationStatus: item.verificationStatus || invocation.verificationStatus,
    verificationNote: item.verificationNote || invocation.verificationNote,
    matchKind: item.matchKind || invocation.matchKind,
    matchNote: item.matchNote || invocation.matchNote,
    details: invocation.detail
      ? [invocation.detail, ...(item.details || [])]
      : item.details,
  };
}

function bridgeProfileHost(url?: string) {
  if (!url) {
    return "";
  }

  try {
    const parsed = new URL(url);
    return rootHost(parsed.hostname);
  } catch {
    return "";
  }
}

function isDiagnosticBridgeItem(item: SearchItem) {
  return (
    item.type === "timeout" ||
    item.type === "command-error" ||
    item.type === "stderr" ||
    item.type === "raw-line" ||
    Boolean(item.tags?.some((tag) => /(timeout|worker-error|stderr)/i.test(tag)))
  );
}

function isUsefulBridgeProfileUrl(url?: string) {
  if (!url) {
    return false;
  }

  try {
    const parsed = new URL(url);
    const host = rootHost(parsed.hostname);
    const allowed = highSignalBridgeProfileHosts.some(
      (candidate) => host === candidate || host.endsWith(`.${candidate}`),
    );

    if (!allowed) {
      return false;
    }

    const composite = `${parsed.pathname.toLowerCase()}?${parsed.search.toLowerCase()}`;
    if (bridgeProfileRejectFragments.some((fragment) => composite.includes(fragment))) {
      return false;
    }

    if (host === "stackoverflow.com" && !parsed.pathname.startsWith("/users/")) {
      return false;
    }

    if (
      host === "linkedin.com" &&
      !(
        parsed.pathname.startsWith("/in/") ||
        parsed.pathname.startsWith("/pub/")
      )
    ) {
      return false;
    }

    if (host === "medium.com" && !parsed.pathname.startsWith("/@")) {
      return false;
    }

    if (host === "hub.docker.com" && !parsed.pathname.startsWith("/u/")) {
      return false;
    }

    if (host === "t.me" && parsed.pathname.split("/").filter(Boolean).length !== 1) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function bridgeProfileRank(item: SearchItem) {
  const host = bridgeProfileHost(item.url || item.subtitle);
  const hostRank = highSignalBridgeProfileHosts.findIndex(
    (candidate) => host === candidate || host.endsWith(`.${candidate}`),
  );
  const verificationRank =
    item.verificationStatus === "verified"
      ? 3
      : item.verificationStatus === "likely"
        ? 2
        : 1;
  const confidenceRank =
    item.confidence === "high" ? 3 : item.confidence === "medium" ? 2 : 1;

  return {
    hostRank: hostRank === -1 ? highSignalBridgeProfileHosts.length + 20 : hostRank,
    verificationRank,
    confidenceRank,
  };
}

function refineBridgeItems(config: BridgeConfig, items: SearchItem[]) {
  const usableItems = items.filter((item) => !isDiagnosticBridgeItem(item));
  if (usableItems.length === 0) {
    return [];
  }

  if (config.id === "sherlock-bridge" || config.id === "maigret-bridge") {
    const filtered = usableItems.filter((item) =>
      isUsefulBridgeProfileUrl(item.url || item.subtitle),
    );

    return filtered
      .sort((a, b) => {
        const left = bridgeProfileRank(a);
        const right = bridgeProfileRank(b);
        return (
          left.hostRank - right.hostRank ||
          right.verificationRank - left.verificationRank ||
          right.confidenceRank - left.confidenceRank ||
          a.title.localeCompare(b.title)
        );
      })
      .slice(0, config.id === "sherlock-bridge" ? 16 : 12);
  }

  if (config.id === "subfinder-bridge" || config.id === "amass-bridge") {
    return usableItems.slice(0, 24);
  }

  if (config.id === "theharvester-bridge") {
    return usableItems.slice(0, 20);
  }

  if (config.id === "phoneinfoga-bridge") {
    return usableItems.slice(0, 10);
  }

  return usableItems.slice(0, 20);
}

async function callToolBridge(
  config: BridgeConfig,
  query: string,
  inferredType: QueryKind,
  invocation: BridgeInvocation,
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
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    throw new Error(`${config.name} bridge returned ${response.status}`);
  }

  const data = (await response.json()) as {
    title?: string;
    description?: string;
    items?: SearchItem[];
  };

  const normalizedItems = (data.items || []).map((item, index) =>
    normalizeBridgeItem(config.name, item, index, invocation),
  );
  const refinedItems = refineBridgeItems(config, normalizedItems);

  if (refinedItems.length === 0) {
    const diagnostic = normalizedItems.find((item) => isDiagnosticBridgeItem(item));
    if (diagnostic?.description) {
      throw new Error(`${config.name}: ${diagnostic.description}`);
    }
    return null;
  }

  return {
    id: config.id,
    title: data.title || config.name,
    description:
      data.description || `Results returned by the configured ${config.name} worker.`,
    items: refinedItems,
  };
}

function bridgeInvocationsForQuery(
  config: BridgeConfig,
  query: string,
  inferredType: QueryKind,
  keywordLooksLikeHandle: boolean,
  locale: Locale,
): BridgeInvocation[] {
  const directInvocation = (override?: Partial<BridgeInvocation>): BridgeInvocation => ({
    query,
    inferredType,
    matchKind: "direct",
    confidence: "medium",
    verificationStatus: "likely",
    verificationNote:
      locale === "ru"
        ? `Результат вернул настроенный ${config.name} worker по прямому запросу.`
        : `The configured ${config.name} worker returned this result for the direct query.`,
    matchNote:
      locale === "ru"
        ? "Инструмент был вызван напрямую от исходного поискового ввода."
        : "The tool was called directly from the original search input.",
    ...override,
  });

  if (config.id === "sherlock-bridge" || config.id === "maigret-bridge") {
    if (inferredType === "username" || keywordLooksLikeHandle) {
      const username = canonicalizeUsername(query);
      return username
        ? [
            directInvocation({
              query: username,
              inferredType: "username",
            }),
          ]
        : [];
    }

    if (inferredType === "person") {
      const identity = buildPersonIdentity(query);
      if (!identity) {
        return [];
      }

      return identity.usernameVariants.slice(0, 2).map((candidate) =>
        directInvocation({
          query: candidate,
          inferredType: "username",
          matchKind: "derived",
          confidence: "low",
          verificationStatus: "candidate",
          verificationNote:
            locale === "ru"
              ? `Результат вернул ${config.name} worker по username-варианту, выведенному из имени.`
              : `${config.name} returned this result from a username variant derived from the person's name.`,
          matchNote:
            locale === "ru"
              ? "Это производный pivot по имени и фамилии, а не прямой идентификатор."
              : "This is a derived pivot from the person's name, not a direct identifier.",
          detail: {
            label: locale === "ru" ? "Username-кандидат" : "Username candidate",
            value: candidate,
          },
        }),
      );
    }

    return [];
  }

  if (config.id === "theharvester-bridge") {
    if (inferredType === "domain") {
      const domain = safeDomainFromQuery(query);
      return domain
        ? [
            directInvocation({
              query: domain,
              inferredType: "domain",
            }),
          ]
        : [];
    }

    if (inferredType === "email") {
      const { domain } = parseEmailQuery(query);
      return domain
        ? [
            directInvocation({
              query: domain,
              inferredType: "domain",
              matchKind: "derived",
              confidence: "medium",
              verificationStatus: "likely",
              verificationNote:
                locale === "ru"
                  ? `Результат вернул ${config.name} worker по домену, выведенному из email.`
                  : `${config.name} returned this result from the domain derived out of the email address.`,
              matchNote:
                locale === "ru"
                  ? "Инструмент вызван по домену email, а не по полному почтовому адресу."
                  : "The tool was called on the email domain, not the full mailbox.",
              detail: {
                label: locale === "ru" ? "Производный домен" : "Derived domain",
                value: domain,
              },
            }),
          ]
        : [];
    }

    return [];
  }

  if (config.id === "subfinder-bridge" || config.id === "amass-bridge") {
    if (inferredType !== "domain") {
      return [];
    }

    const domain = safeDomainFromQuery(query);
    return domain
      ? [
          directInvocation({
            query: domain,
            inferredType: "domain",
          }),
        ]
      : [];
  }

  if (config.id === "phoneinfoga-bridge") {
    if (inferredType !== "phone") {
      return [];
    }

    return [directInvocation()];
  }

  if (config.id === "octosuite-bridge") {
    if (inferredType === "repository") {
      return [
        directInvocation({
          query: query.replace(/^https?:\/\/github\.com\//i, ""),
          inferredType: "repository",
        }),
      ];
    }

    if (keywordLooksLikeHandle) {
      return [
        directInvocation({
          query: canonicalizeUsername(query),
          inferredType: "username",
        }),
      ];
    }

    if (config.queryKinds.includes(inferredType)) {
      return [directInvocation()];
    }

    return [];
  }

  if (config.id === "spiderfoot-bridge") {
    if (inferredType === "domain") {
      const domain = safeDomainFromQuery(query);
      return domain
        ? [
            directInvocation({
              query: domain,
              inferredType: "domain",
            }),
          ]
        : [];
    }

    if (keywordLooksLikeHandle) {
      return [
        directInvocation({
          query: canonicalizeUsername(query),
          inferredType: "username",
        }),
      ];
    }
  }

  return config.queryKinds.includes(inferredType) ? [directInvocation()] : [];
}

function mergeBridgeSections(
  config: BridgeConfig,
  sections: SearchSection[],
  locale: Locale,
): SearchSection | null {
  const items = new Map<string, SearchItem>();
  for (const section of sections) {
    for (const item of section.items) {
      const key = item.url || `${item.source}|${item.title}|${item.subtitle || ""}`;
      if (!items.has(key)) {
        items.set(key, item);
      }
    }
  }

  const mergedItems = refineBridgeItems(config, Array.from(items.values()));
  if (mergedItems.length === 0) {
    return null;
  }

  return {
    id: config.id,
    title: config.name.replace(" Bridge", ""),
    description:
      locale === "ru"
        ? `Результаты из подключённого ${config.name.replace(" Bridge", "")} worker.`
        : `Results returned by the connected ${config.name.replace(" Bridge", "")} worker.`,
    items: mergedItems,
  };
}

async function searchGleifCompanies(query: string, locale: Locale): Promise<SearchItem[]> {
  const dictionary = getDictionary(locale);
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
      {
        label: dictionary.searchResults.itemLabels.jurisdiction,
        value: record.attributes.entity.legalJurisdiction || dictionary.common.unknown,
      },
      {
        label: dictionary.searchResults.itemLabels.country,
        value: record.attributes.entity.legalAddress?.country || dictionary.common.unknown,
      },
      {
        label: dictionary.searchResults.itemLabels.status,
        value: record.attributes.registration?.status || dictionary.common.unknown,
      },
    ],
  }));
}

async function searchSecCompanies(query: string, locale: Locale): Promise<SearchItem[]> {
  const dictionary = getDictionary(locale);
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
  const tokens = normalized.split(/[^a-z0-9]+/).filter(Boolean);
  const matches = Object.values(data)
    .filter((item) => {
      const title = item.title.toLowerCase();
      const ticker = item.ticker.toLowerCase();
      const directTickerMatch = ticker === normalized;
      const tokenTickerMatch = tokens.includes(ticker) && normalized.length <= 6;
      return (
        title.includes(normalized) ||
        ticker.includes(normalized) ||
        directTickerMatch ||
        tokenTickerMatch
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
      { label: dictionary.searchResults.itemLabels.ticker, value: item.ticker },
      { label: dictionary.searchResults.itemLabels.cik, value: String(item.cik_str) },
    ],
  }));
}

function normalizeIdentityToken(value: string) {
  return value.replace(/^@/, "").trim().toLowerCase();
}

function usernameMatchWeight(login: string, target: string) {
  const normalizedLogin = normalizeIdentityToken(login);
  const normalizedTarget = normalizeIdentityToken(target);

  if (!normalizedLogin || !normalizedTarget) {
    return 0;
  }

  if (normalizedLogin === normalizedTarget) {
    return 4;
  }

  if (normalizedLogin.startsWith(normalizedTarget) || normalizedTarget.startsWith(normalizedLogin)) {
    return 3;
  }

  if (normalizedLogin.includes(normalizedTarget) || normalizedTarget.includes(normalizedLogin)) {
    return 2;
  }

  const slugLogin = slugToken(normalizedLogin);
  const slugTarget = slugToken(normalizedTarget);
  if (!slugLogin || !slugTarget) {
    return 0;
  }

  if (slugLogin === slugTarget) {
    return 4;
  }

  if (slugLogin.startsWith(slugTarget) || slugTarget.startsWith(slugLogin)) {
    return 2;
  }

  if (slugLogin.includes(slugTarget) || slugTarget.includes(slugLogin)) {
    return 1;
  }

  return 0;
}

async function searchGithubUsers(
  query: string,
  locale: Locale,
  focusUsername?: string,
): Promise<SearchItem[]> {
  const dictionary = getDictionary(locale);
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

  const filteredItems = focusUsername
    ? data.items
        .map((item) => ({
          item,
          weight: usernameMatchWeight(item.login, focusUsername),
        }))
        .filter((entry) => entry.weight > 0)
        .sort(
          (left, right) =>
            right.weight - left.weight || right.item.score - left.item.score,
        )
        .map((entry) => entry.item)
    : data.items;

  return filteredItems.map((item) => ({
    id: `github-user-${item.id}`,
    source: "GitHub",
    type: item.type.toLowerCase(),
    title: item.login,
    subtitle: item.type,
    description: `Public GitHub profile match with score ${item.score.toFixed(1)}`,
    url: item.html_url,
    tags: ["github", "public profile"],
    details: [
      { label: dictionary.searchResults.itemLabels.score, value: item.score.toFixed(1) },
      { label: dictionary.searchResults.itemLabels.profile, value: item.html_url },
    ],
  }));
}

async function searchGithubExactUser(
  username: string,
  locale: Locale,
): Promise<SearchItem[]> {
  const dictionary = getDictionary(locale);
  try {
    const item = await fetchJson<{
      login: string;
      id: number;
      html_url: string;
      type: string;
      name: string | null;
      bio: string | null;
      blog: string | null;
      twitter_username: string | null;
      public_repos: number;
      followers: number;
      following: number;
      company: string | null;
      location: string | null;
      created_at: string;
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
        description: item.bio || dictionary.searchResults.itemText.exactGithubMatch,
        url: item.html_url,
        tags: ["github", "exact match", "username"],
        details: [
          {
            label: locale === "ru" ? "Имя" : "Name",
            value: item.name || dictionary.common.notListed,
          },
          {
            label: dictionary.searchResults.itemLabels.publicRepos,
            value: String(item.public_repos),
          },
          {
            label: dictionary.searchResults.itemLabels.followers,
            value: String(item.followers),
          },
          {
            label: dictionary.searchResults.itemLabels.following,
            value: String(item.following),
          },
          {
            label: dictionary.searchResults.itemLabels.company,
            value: item.company || dictionary.common.notListed,
          },
          {
            label: dictionary.searchResults.itemLabels.location,
            value: item.location || dictionary.common.notListed,
          },
          {
            label: locale === "ru" ? "Сайт" : "Website",
            value: item.blog || dictionary.common.notListed,
          },
          {
            label: locale === "ru" ? "Twitter / X" : "Twitter / X",
            value: item.twitter_username || dictionary.common.notListed,
          },
          {
            label: locale === "ru" ? "Создан" : "Created",
            value: new Date(item.created_at).toLocaleDateString(
              locale === "ru" ? "ru-RU" : "en-US",
            ),
          },
        ],
      },
    ];
  } catch {
    return [];
  }
}

async function searchGithubRepos(query: string, locale: Locale): Promise<SearchItem[]> {
  const dictionary = getDictionary(locale);
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
    subtitle: item.language || dictionary.searchResults.itemText.languageNotSpecified,
    description: `${item.description || dictionary.searchResults.itemText.noRepositoryDescription} • ${item.stargazers_count} stars`,
    url: item.html_url,
    tags: ["github", "repository", new Date(item.updated_at).getFullYear().toString()],
    details: [
      { label: dictionary.searchResults.itemLabels.stars, value: String(item.stargazers_count) },
      {
        label: dictionary.searchResults.itemLabels.updated,
        value: new Date(item.updated_at).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US"),
      },
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

async function fetchCommonCrawlCollections() {
  const collections = await fetchJson<CommonCrawlCollection[]>("https://index.commoncrawl.org/collinfo.json");
  return collections.slice(0, 3);
}

async function fetchCommonCrawlSummary(domain: string): Promise<CommonCrawlSummary[]> {
  const collections = await fetchCommonCrawlCollections();
  const pattern = `*.${domain}/*`;

  const summaries = await Promise.all(
    collections.map(async (collection) => {
      const query = new URL(collection["cdx-api"]);
      query.searchParams.set("url", pattern);
      query.searchParams.set("output", "json");
      query.searchParams.set("fl", "timestamp,url,status,mime,length,digest,filename");
      query.searchParams.set("limit", "3");

      try {
        const payload = await fetchText(query.toString());
        const records = parseJsonLines<CommonCrawlRecord>(payload).filter(
          (record) => record.url && record.timestamp,
        );

        if (records.length === 0) {
          return null;
        }

        return {
          collection,
          records,
        } satisfies CommonCrawlSummary;
      } catch {
        return null;
      }
    }),
  );

  return summaries.filter(Boolean) as CommonCrawlSummary[];
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
  locale: Locale,
): Promise<SearchSection | null> {
  const dictionary = getDictionary(locale);
  try {
    const summary = await fetchWaybackSummary(target);
    const items: SearchItem[] = [
      {
        id: `${sectionId}-summary`,
        source: "Wayback Machine",
        type: "archive-summary",
        title: target,
        subtitle: dictionary.searchResults.itemText.historicalCoverage,
        description:
          summary.pageCount > 0
            ? formatMessage(dictionary.searchResults.itemText.archiveHistoryFound, {
                count: summary.pageCount,
              })
            : dictionary.searchResults.itemText.archiveHistoryEmpty,
        url: summary.closestUrl,
        tags: ["archive", "history"],
        details: [
          {
            label: dictionary.searchResults.itemLabels.archivePages,
            value: String(summary.pageCount),
          },
          {
            label: dictionary.searchResults.itemLabels.closestCapture,
            value: renderTimestamp(summary.closestTimestamp),
          },
        ],
      },
      ...summary.captures.map((capture, index) => ({
        id: `${sectionId}-capture-${index}`,
        source: "Wayback Machine",
        type: "capture",
        title: renderTimestamp(capture.timestamp),
        subtitle: capture.original,
        description: dictionary.searchResults.itemText.sampleSnapshot,
        url: `https://web.archive.org/web/${capture.timestamp}/${capture.original}`,
        tags: ["archive", "capture"],
      })),
    ];

    return {
      id: sectionId,
      title,
      description: dictionary.searchResults.sections.webArchivesDescription,
      items,
    };
  } catch {
    return null;
  }
}

async function buildCommonCrawlSection(
  domain: string,
  sectionId: string,
  title: string,
  locale: Locale,
): Promise<SearchSection | null> {
  const dictionary = getDictionary(locale);

  try {
    const summaries = await fetchCommonCrawlSummary(domain);
    if (summaries.length === 0) {
      return null;
    }

    const pattern = `*.${domain}/*`;
    const items: SearchItem[] = summaries.flatMap((summary) => {
      const queryUrl = new URL(summary.collection["cdx-api"]);
      queryUrl.searchParams.set("url", pattern);
      queryUrl.searchParams.set("output", "json");

      const summaryItem: SearchItem = {
        id: `${sectionId}-${summary.collection.id}`,
        source: "Common Crawl",
        type: "archive-summary",
        title: summary.collection.name,
        subtitle: `${summary.collection.from.slice(0, 10)} -> ${summary.collection.to.slice(0, 10)}`,
        description:
          locale === "ru"
            ? `Исторический индекс Common Crawl нашёл ${summary.records.length} sample-записи по шаблону ${pattern}.`
            : `Common Crawl indexed ${summary.records.length} sample records for ${pattern}.`,
        url: queryUrl.toString(),
        tags: ["archive", "common-crawl", "crawl-index"],
        dataTypes:
          locale === "ru"
            ? ["веб-архив", "исторический индекс", "crawl history"]
            : ["web archive", "historical index", "crawl history"],
        entityType: locale === "ru" ? "Архивный индекс домена" : "Domain archive index",
        verificationStatus: "verified",
        confidence: "high",
        matchKind: "direct",
        verificationNote:
          locale === "ru"
            ? "Запись получена напрямую из официального индекса Common Crawl."
            : "Record sourced directly from the official Common Crawl index.",
        matchNote:
          locale === "ru"
            ? "Прямое совпадение по доменному URL-шаблону."
            : "Direct match against the domain URL pattern.",
        details: [
          {
            label: locale === "ru" ? "Коллекция" : "Collection",
            value: summary.collection.id,
          },
          {
            label: locale === "ru" ? "Окно обхода" : "Crawl window",
            value: `${summary.collection.from.slice(0, 10)} -> ${summary.collection.to.slice(0, 10)}`,
          },
          {
            label: dictionary.searchResults.itemLabels.sample,
            value: String(summary.records.length),
          },
        ],
      };

      const recordItems = summary.records.map((record, index) => {
        const recordQuery = new URL(summary.collection["cdx-api"]);
        recordQuery.searchParams.set("url", record.url);
        recordQuery.searchParams.set("output", "json");
        recordQuery.searchParams.set("limit", "1");

        return {
          id: `${sectionId}-${summary.collection.id}-${index}`,
          source: "Common Crawl",
          type: "crawl-record",
          title: renderTimestamp(record.timestamp),
          subtitle: record.url,
          description:
            locale === "ru"
              ? `${record.status || dictionary.common.unknown} • ${record.mime || dictionary.common.notSpecified}`
              : `${record.status || dictionary.common.unknown} • ${record.mime || dictionary.common.notSpecified}`,
          url: recordQuery.toString(),
          tags: ["archive", "common-crawl", "record"],
          dataTypes:
            locale === "ru"
              ? ["crawl record", "исторический URL", "mime"]
              : ["crawl record", "historical URL", "mime"],
          entityType: locale === "ru" ? "Архивная запись" : "Archive record",
          verificationStatus: "verified",
          confidence: "high",
          matchKind: "direct",
          verificationNote:
            locale === "ru"
              ? "Запись Common Crawl подтверждает историческое появление URL в публичном обходе."
              : "Common Crawl confirms this URL appeared in a historical public crawl.",
          matchNote:
            locale === "ru"
              ? "Прямое совпадение по исторической crawl-записи."
              : "Direct match from a historical crawl record.",
          details: [
            {
              label: locale === "ru" ? "Коллекция" : "Collection",
              value: summary.collection.id,
            },
            {
              label: dictionary.searchResults.itemLabels.status,
              value: record.status || dictionary.common.unknown,
            },
            {
              label: dictionary.searchResults.itemLabels.sample,
              value: record.mime || dictionary.common.notSpecified,
            },
            {
              label: locale === "ru" ? "Размер" : "Length",
              value: record.length || dictionary.common.notSpecified,
            },
          ],
        } satisfies SearchItem;
      });

      return [summaryItem, ...recordItems];
    });

    return {
      id: sectionId,
      title,
      description:
        locale === "ru"
          ? "Исторический индекс Common Crawl по последним коллекциям и sample-записям домена."
          : "Recent Common Crawl collections and sampled historical records for the domain.",
      items,
    };
  } catch {
    return null;
  }
}

async function searchRdapDomain(domain: string, locale: Locale): Promise<SearchItem[]> {
  const dictionary = getDictionary(locale);
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
  const registrant = data.entities?.find((entity) =>
    entity.roles?.includes("registrant"),
  );
  const admin = data.entities?.find((entity) =>
    entity.roles?.includes("administrative"),
  );
  const technical = data.entities?.find((entity) =>
    entity.roles?.includes("technical"),
  );
  const registrarName = registrar?.vcardArray?.[1]?.find((entry) => entry[0] === "fn")?.[3];
  const registrantName = registrant?.vcardArray?.[1]?.find((entry) => entry[0] === "fn")?.[3];
  const adminName = admin?.vcardArray?.[1]?.find((entry) => entry[0] === "fn")?.[3];
  const technicalName = technical?.vcardArray?.[1]?.find((entry) => entry[0] === "fn")?.[3];
  const expiration = data.events?.find((event) => event.eventAction === "expiration");
  const registration = data.events?.find((event) => event.eventAction === "registration");

  return [
    {
      id: `rdap-${domain}`,
      source: "RDAP",
      type: "domain-record",
      title: data.ldhName,
      subtitle: registrarName ? `Registrar: ${registrarName}` : dictionary.searchResults.itemText.registrarAvailable,
      description: (data.status || []).slice(0, 3).join(" • "),
      url: `https://rdap.org/domain/${encodeURIComponent(domain)}`,
      tags: ["rdap", "domain"],
      dataTypes:
        locale === "ru"
          ? ["Домен", "Регистратор", "Владение", "Инфраструктура"]
          : ["Domain", "Registrar", "Ownership", "Infrastructure"],
      details: [
        {
          label: dictionary.searchResults.itemLabels.registered,
          value: registration?.eventDate || dictionary.common.unknown,
        },
        {
          label: dictionary.searchResults.itemLabels.expires,
          value: expiration?.eventDate || dictionary.common.unknown,
        },
        {
          label: dictionary.searchResults.itemLabels.nameservers,
          value:
            data.nameservers?.slice(0, 3).map((server) => server.ldhName).filter(Boolean).join(", ") ||
            dictionary.common.unknown,
        },
        {
          label: locale === "ru" ? "Registrant" : "Registrant",
          value: registrantName || dictionary.common.notListed,
        },
        {
          label: locale === "ru" ? "Admin contact" : "Admin contact",
          value: adminName || dictionary.common.notListed,
        },
        {
          label: locale === "ru" ? "Technical contact" : "Technical contact",
          value: technicalName || dictionary.common.notListed,
        },
      ],
    },
  ];
}

async function searchDnsRecords(domain: string, locale: Locale): Promise<SearchItem[]> {
  const dictionary = getDictionary(locale);
  const snapshot = await fetchDnsSnapshot(domain);
  const results = (Object.entries(snapshot) as Array<[DnsRecordType, string[]]>).map(([type, values]) => ({
    type,
    values,
  }));

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
        {
          label: dictionary.searchResults.itemLabels.recordCount,
          value: String(record.values.length),
        },
        {
          label: dictionary.searchResults.itemLabels.sample,
          value: record.values.slice(0, 2).join(" | "),
        },
      ],
    }));
}

async function searchHostingIntelligence(domain: string, locale: Locale): Promise<SearchItem[]> {
  const dictionary = getDictionary(locale);
  const snapshot = await fetchDnsSnapshot(domain);
  const ips = uniqueValues([...snapshot.A, ...snapshot.AAAA])
    .filter((value) => /^\d{1,3}(?:\.\d{1,3}){3}$/.test(value) || value.includes(":"))
    .slice(0, 3);

  const providerHint = inferInfrastructureProvider([...snapshot.CNAME, ...snapshot.NS, ...snapshot.MX]);
  const ipRecords = await Promise.all(
    ips.map(async (ip) => {
      try {
        const networkInfo = await fetchJson<{
          data?: {
            asns?: string[];
            prefix?: string;
          };
        }>(`https://stat.ripe.net/data/network-info/data.json?resource=${encodeURIComponent(ip)}`);

        const asn = networkInfo.data?.asns?.[0];
        const prefix = networkInfo.data?.prefix;

        if (!asn) {
          return {
            ip,
            prefix,
            asn: "",
            holder: "",
          };
        }

        const asOverview = await fetchJson<{
          data?: {
            holder?: string;
            resource?: string;
          };
        }>(
          `https://stat.ripe.net/data/as-overview/data.json?resource=${encodeURIComponent(`AS${asn}`)}`,
        ).catch(() => null);

        return {
          ip,
          prefix,
          asn,
          holder: asOverview?.data?.holder || "",
          resource: asOverview?.data?.resource || "",
        };
      } catch {
        return null;
      }
    }),
  );

  const fulfilled = ipRecords.filter(Boolean) as Array<{
    ip: string;
    prefix?: string;
    asn: string;
    holder: string;
    resource?: string;
  }>;

  if (!providerHint && fulfilled.length === 0) {
    return [];
  }

  const holders = uniqueValues(
    fulfilled.map((record) => record.holder).filter(Boolean),
  );

  const items: SearchItem[] = [
    {
      id: `hosting-${domain}`,
      source: "Hosting Intelligence",
      type: "hosting-summary",
      title: domain,
      subtitle: locale === "ru" ? "Хостинг, IP и ASN" : "Hosting, IP, and ASN",
      description:
        locale === "ru"
          ? "Провайдер хостинга и сетевой след, подтверждённые через DNS и RIPEstat."
          : "Hosting provider and network footprint confirmed through DNS and RIPEstat.",
      tags: ["hosting", "ip", "asn", "network"],
      dataTypes:
        locale === "ru"
          ? ["Хостинг", "IP", "ASN", "Сеть"]
          : ["Hosting", "IP", "ASN", "Network"],
      details: [
        {
          label: locale === "ru" ? "Provider hint" : "Provider hint",
          value: providerHint || holders[0] || dictionary.common.notFound,
        },
        {
          label: locale === "ru" ? "IP-адреса" : "IP addresses",
          value: ips.join(", ") || dictionary.common.notFound,
        },
        {
          label: locale === "ru" ? "ASN" : "ASN",
          value:
            uniqueValues(fulfilled.map((record) => record.asn).filter(Boolean))
              .map((asn) => `AS${asn}`)
              .join(", ") || dictionary.common.notFound,
        },
        {
          label: locale === "ru" ? "CNAME / CDN" : "CNAME / CDN",
          value: snapshot.CNAME.slice(0, 2).join(", ") || dictionary.common.notFound,
        },
      ],
      verificationStatus: "verified",
      confidence: "high",
      matchKind: "direct",
      verificationNote:
        locale === "ru"
          ? "Сетевые данные получены напрямую из DNS и официального RIPEstat."
          : "Network data came directly from DNS and official RIPEstat endpoints.",
      matchNote:
        locale === "ru"
          ? "Прямой network pivot от домена к IP и ASN."
          : "Direct network pivot from the domain to IP and ASN data.",
    },
    ...fulfilled.map((record, index) => ({
      id: `hosting-${domain}-${index}`,
      source: "Hosting Intelligence",
      type: "ip-asn",
      title: record.ip,
      subtitle: record.holder || (locale === "ru" ? "Хостинг-провайдер" : "Hosting provider"),
      description:
        locale === "ru"
          ? `IP и ASN-связка для внешнего контура сайта.`
          : "IP and ASN mapping for the external site footprint.",
      url: record.asn ? `https://stat.ripe.net/AS${record.asn}` : undefined,
      tags: ["hosting", "ip", "asn"],
      dataTypes:
        locale === "ru"
          ? ["Хостинг", "IP", "ASN"]
          : ["Hosting", "IP", "ASN"],
      details: [
        {
          label: locale === "ru" ? "ASN" : "ASN",
          value: record.asn ? `AS${record.asn}` : dictionary.common.notFound,
        },
        {
          label: locale === "ru" ? "Holder" : "Holder",
          value: record.holder || dictionary.common.notFound,
        },
        {
          label: locale === "ru" ? "Prefix" : "Prefix",
          value: record.prefix || dictionary.common.notFound,
        },
      ],
      verificationStatus: "verified" as VerificationStatus,
      confidence: "high" as ConfidenceLevel,
      matchKind: "direct" as MatchKind,
      verificationNote:
        locale === "ru"
          ? "IP и ASN подтверждены публичной сетевой телеметрией."
          : "The IP and ASN are confirmed by public network telemetry.",
      matchNote:
        locale === "ru"
          ? "Прямое совпадение по DNS-resolve."
          : "Direct DNS resolution match.",
    })),
  ];

  return items;
}

async function searchWebsiteMetadata(domain: string, locale: Locale): Promise<SearchItem[]> {
  const dictionary = getDictionary(locale);
  const siteDocument = await fetchSiteDocument(domain);

  if (!siteDocument) {
    return [];
  }

  const { finalUrl, origin, html } = siteDocument;
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
  const emails = uniqueValues(
    extractMatches(html, /\b([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})\b/gi),
  ).slice(0, 4);
  const phones = uniqueValues(
    extractMatches(html, /(\+?\d[\d().\s-]{7,}\d)/g),
  ).slice(0, 4);
  const socials = uniqueValues(
    extractMatches(html, /href=["'](https?:\/\/[^"']+)["']/gi).filter((link) =>
      /(linkedin\.com|twitter\.com|x\.com|facebook\.com|instagram\.com|youtube\.com|t\.me|github\.com)/i.test(
        link,
      ),
    ),
  ).slice(0, 4);

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
      description: description || dictionary.searchResults.itemText.noMetaDescription,
      url: finalUrl,
      tags: ["seo", "metadata", "homepage"],
      dataTypes:
        locale === "ru"
          ? ["SEO", "Контакты", "Соцссылки", "Статистика сайта"]
          : ["SEO", "Contacts", "Social Links", "Site Statistics"],
      details: [
        {
          label: dictionary.searchResults.itemLabels.titleLength,
          value: String((title || "").length),
        },
        {
          label: dictionary.searchResults.itemLabels.descriptionLength,
          value: String((description || "").length),
        },
        {
          label: dictionary.searchResults.itemLabels.canonical,
          value: canonical || dictionary.common.notDeclared,
        },
        {
          label: dictionary.searchResults.itemLabels.primaryH1,
          value: h1 || dictionary.common.notFound,
        },
        {
          label: dictionary.searchResults.itemLabels.robotsTxt,
          value: robotsOk,
        },
        {
          label: dictionary.searchResults.itemLabels.sitemapXml,
          value: sitemapOk,
        },
        {
          label: dictionary.searchResults.itemLabels.homepageEmails,
          value: emails.join(", ") || dictionary.common.notFound,
        },
        {
          label: dictionary.searchResults.itemLabels.homepagePhones,
          value: phones.join(", ") || dictionary.common.notFound,
        },
        {
          label: dictionary.searchResults.itemLabels.socialLinks,
          value: socials.join(", ") || dictionary.common.notFound,
        },
      ],
    },
  ];
}

async function searchSitePathSignals(domain: string, locale: Locale): Promise<SearchItem[]> {
  const dictionary = getDictionary(locale);
  const siteDocument = await fetchSiteDocument(domain);

  if (!siteDocument) {
    return [];
  }

  const { finalUrl, html } = siteDocument;
  const internalLinks = Array.from(
    new Set(
      Array.from(html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi))
        .map((match) => {
          try {
            const resolved = new URL(match[1], finalUrl);
            if (!sameSiteHost(resolved.hostname, new URL(finalUrl).hostname)) {
              return "";
            }
            return resolved.href.split("#")[0];
          } catch {
            return "";
          }
        })
        .filter(Boolean),
    ),
  );

  const priorityLinks = extractSiteLinkCandidates(html, finalUrl);
  if (priorityLinks.length === 0) {
    return [];
  }

  const crawledPages = await Promise.allSettled(
    priorityLinks.slice(0, 6).map(async (candidate) => {
      const pageHtml = await fetchText(candidate.url);
      const title = extractMatch(pageHtml, /<title[^>]*>([^<]+)<\/title>/i);
      const emails = uniqueValues(
        extractMatches(pageHtml, /\b([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})\b/gi),
      ).slice(0, 4);
      const phones = uniqueValues(
        extractMatches(pageHtml, /(\+?\d[\d().\s-]{7,}\d)/g),
      ).slice(0, 4);
      const externalDomains = extractExternalDomains(pageHtml, new URL(finalUrl).hostname);

      return {
        ...candidate,
        title,
        emails,
        phones,
        externalDomains,
      };
    }),
  );

  const fulfilledPages = crawledPages
    .flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));

  if (fulfilledPages.length === 0) {
    return [];
  }

  const partnerPages = fulfilledPages.filter((page) => page.kind === "partner");
  const contactPages = fulfilledPages.filter((page) => page.kind === "contact");
  const hiringPages = fulfilledPages.filter((page) => page.kind === "hiring");
  const docsPages = fulfilledPages.filter((page) => page.kind === "docs");
  const ecosystemDomains = uniqueValues(
    fulfilledPages.flatMap((page) => page.externalDomains),
  ).slice(0, 6);

  return [
    {
      id: `site-discovery-${domain}`,
      source: locale === "ru" ? "Исследование сайта" : "Site Discovery",
      type: "path-intelligence",
      title: domain,
      subtitle:
        locale === "ru"
          ? "Автоматически исследованы полезные внутренние пути"
          : "Useful internal paths were auto-investigated",
      description:
        locale === "ru"
          ? "Сайт был доисследован по приоритетным путям: контакты, команда, партнёры, карьера, безопасность и документация."
          : "The site was expanded through priority paths: contact, team, partners, hiring, security, and documentation.",
      tags: ["autopivot", "site-research", "follow-up"],
      dataTypes:
        locale === "ru"
          ? ["Пути сайта", "Статистика", "Контакты", "Партнёрства"]
          : ["Site Paths", "Statistics", "Contacts", "Partnerships"],
      details: [
        {
          label: locale === "ru" ? "Найдено внутренних ссылок" : "Internal links found",
          value: String(internalLinks.length),
        },
        {
          label: locale === "ru" ? "Исследовано приоритетных страниц" : "Priority pages investigated",
          value: String(fulfilledPages.length),
        },
        {
          label: locale === "ru" ? "Страницы партнёров / интеграций" : "Partner / integration pages",
          value: String(partnerPages.length),
        },
        {
          label: locale === "ru" ? "Контактные страницы" : "Contact pages",
          value: String(contactPages.length),
        },
        {
          label: locale === "ru" ? "Страницы карьеры" : "Hiring pages",
          value: String(hiringPages.length),
        },
        {
          label: locale === "ru" ? "Документация / API" : "Docs / API pages",
          value: String(docsPages.length),
        },
        {
          label: locale === "ru" ? "Домены экосистемы" : "Ecosystem domains",
          value: ecosystemDomains.join(", ") || dictionary.common.notFound,
        },
      ],
    },
    ...fulfilledPages.map((page, index) => ({
      id: `site-discovery-page-${index}`,
      source: locale === "ru" ? "Исследование сайта" : "Site Discovery",
      type: `${page.kind}-page`,
      title: page.title || page.text || page.url,
      subtitle: page.url,
      description:
        locale === "ru"
          ? `Найдена страница типа: ${humanizeSitePath(page.kind, locale)}`
          : `Detected page type: ${humanizeSitePath(page.kind, locale)}`,
      url: page.url,
      tags: ["autopivot", page.kind, "site-path"],
      dataTypes:
        page.kind === "partner"
          ? locale === "ru"
            ? ["Партнёрства", "Коллаборации", "Внешние домены"]
            : ["Partnerships", "Collaborations", "External Domains"]
          : page.kind === "contact"
            ? locale === "ru"
              ? ["Контакты", "Email", "Телефон"]
              : ["Contacts", "Email", "Phone"]
            : locale === "ru"
              ? ["Пути сайта", "Статистика", humanizeSitePath(page.kind, locale)]
              : ["Site Paths", "Statistics", humanizeSitePath(page.kind, locale)],
      details: [
        {
          label: locale === "ru" ? "Тип страницы" : "Page type",
          value: humanizeSitePath(page.kind, locale),
        },
        {
          label: locale === "ru" ? "Email" : "Emails",
          value: page.emails.join(", ") || dictionary.common.notFound,
        },
        {
          label: locale === "ru" ? "Телефоны" : "Phones",
          value: page.phones.join(", ") || dictionary.common.notFound,
        },
        {
          label: locale === "ru" ? "Внешние домены" : "External domains",
          value: page.externalDomains.join(", ") || dictionary.common.notFound,
        },
      ],
    })),
  ];
}

async function searchSiteOwnershipSignals(domain: string, locale: Locale): Promise<SearchItem[]> {
  const dictionary = getDictionary(locale);
  const siteDocument = await fetchSiteDocument(domain);

  if (!siteDocument) {
    return [];
  }

  const { finalUrl, html } = siteDocument;
  const baseUrl = new URL(finalUrl);
  const priorityLinks = extractSiteLinkCandidates(html, finalUrl).filter((candidate) =>
    candidate.kind === "about" || candidate.kind === "team" || candidate.kind === "contact",
  );

  const crawledPages = await Promise.allSettled(
    priorityLinks.slice(0, 4).map(async (candidate) => {
      const pageHtml = await fetchText(candidate.url);
      return {
        ...candidate,
        html: pageHtml,
        text: stripHtml(pageHtml).slice(0, 8000),
      };
    }),
  );

  const pages = [
    {
      url: finalUrl,
      kind: "about" as const,
      html,
      text: stripHtml(html).slice(0, 8000),
    },
    ...crawledPages.flatMap((result) => (result.status === "fulfilled" ? [result.value] : [])),
  ];

  const jsonLdNodes = pages.flatMap((page) => extractJsonLdObjects(page.html));
  const organizationNames = uniqueValues(
    [
      ...jsonLdNodes
        .filter((node) => /(organization|corporation|localbusiness|brand|store|company)/i.test(jsonLdType(node) || ""))
        .map((node) => readJsonLdText(node, "name") || readJsonLdText(node, "alternateName")),
      extractMetaContent(html, "og:site_name") || "",
      extractMetaContent(html, "application-name") || "",
      ...extractMatches(html, /(?:©|copyright)\s*(?:\d{4}(?:[-–]\d{4})?)?\s*([A-Z][A-Za-z0-9&.,' -]{2,80})/gi),
    ].map((value) => value.trim()),
  )
    .filter(
      (value) =>
        value &&
        value.length <= 80 &&
        !sameSiteHost(value, baseUrl.hostname) &&
        !/(privacy|cookie|terms|rights reserved|all rights reserved)/i.test(value),
    )
    .slice(0, 6);

  const directPeople = jsonLdNodes
    .filter((node) => /(person)/i.test(jsonLdType(node) || ""))
    .map((node) => ({
      name: readJsonLdText(node, "name"),
      role: readJsonLdText(node, "jobTitle") || readJsonLdText(node, "description"),
      url: readJsonLdText(node, "url"),
      sameAs: readJsonLdList(node, "sameAs").slice(0, 3),
    }))
    .filter((entry) => entry.name && isLikelyPersonName(entry.name))
    .slice(0, 6);

  const anchoredPeople = pages
    .flatMap((page) => extractRoleAnchoredPeople(page.text).map((person) => ({ ...person, url: page.url })))
    .slice(0, 6);

  const mergedPeople = Array.from(
    new Map(
      [
        ...directPeople.map((person) => ({
          key: person.name.toLowerCase(),
          value: {
            ...person,
            verificationStatus: "verified" as VerificationStatus,
            confidence: "high" as ConfidenceLevel,
            verificationNote:
              locale === "ru"
                ? "Имя и роль взяты из структурированных данных самого сайта."
                : "Name and role came from the site's own structured data.",
          },
        })),
        ...anchoredPeople.map((person) => ({
          key: person.name.toLowerCase(),
          value: {
            ...person,
            sameAs: [] as string[],
            verificationStatus: "likely" as VerificationStatus,
            confidence: "medium" as ConfidenceLevel,
            verificationNote:
              locale === "ru"
                ? "Имя найдено на страницах сайта рядом с ролью или должностью."
                : "The name was found on site pages alongside a role or title.",
          },
        })),
      ].map((entry) => [entry.key, entry.value]),
    ).values(),
  ).slice(0, 8);

  if (organizationNames.length === 0 && mergedPeople.length === 0) {
    return [];
  }

  return [
    {
      id: `ownership-${domain}`,
      source: "Site Ownership",
      type: "ownership-summary",
      title: organizationNames[0] || domain,
      subtitle: locale === "ru" ? "Организация и люди на сайте" : "Organization and people on the site",
      description:
        locale === "ru"
          ? "Сводка по организации, владельческим сигналам и людям, найденным на самом сайте."
          : "Organization, ownership hints, and people found directly on the site.",
      url: finalUrl,
      tags: ["ownership", "people", "site-evidence"],
      dataTypes:
        locale === "ru"
          ? ["Организация", "Люди", "Контакты", "Сайт"]
          : ["Organization", "People", "Contacts", "Website"],
      details: [
        {
          label: locale === "ru" ? "Организации" : "Organizations",
          value: organizationNames.join(", ") || dictionary.common.notFound,
        },
        {
          label: locale === "ru" ? "Люди" : "People",
          value:
            mergedPeople
              .slice(0, 4)
              .map((person) => (person.role ? `${person.name} (${person.role})` : person.name))
              .join(", ") || dictionary.common.notFound,
        },
        {
          label: locale === "ru" ? "Страницы-источники" : "Source pages",
          value: String(pages.length),
        },
      ],
      verificationStatus: "verified",
      confidence: "high",
      matchKind: "direct",
      verificationNote:
        locale === "ru"
          ? "Сигналы собраны с самого сайта и его приоритетных внутренних страниц."
          : "Signals were collected from the site itself and priority internal pages.",
      matchNote:
        locale === "ru"
          ? "Прямое исследование целевого сайта."
          : "Direct investigation of the target site.",
    },
    ...mergedPeople.map((person, index) => ({
      id: `ownership-person-${domain}-${index}`,
      source: "Site Ownership",
      type: "site-person",
      title: person.name,
      subtitle: person.role || (locale === "ru" ? "Человек на сайте" : "Person on site"),
      description:
        locale === "ru"
          ? "Имя найдено на сайте и сохранено как полезный people-signal."
          : "This name was found on the site and stored as a useful people signal.",
      url: person.url || person.sameAs[0] || finalUrl,
      tags: ["people", "ownership", "site-evidence"],
      dataTypes:
        locale === "ru"
          ? ["Человек", "Роль", "Сайт"]
          : ["Person", "Role", "Website"],
      details: [
        {
          label: locale === "ru" ? "Роль" : "Role",
          value: person.role || dictionary.common.notSpecified,
        },
        {
          label: locale === "ru" ? "sameAs" : "sameAs",
          value: person.sameAs.join(", ") || dictionary.common.notFound,
        },
      ],
      verificationStatus: person.verificationStatus,
      confidence: person.confidence,
      matchKind: "direct" as MatchKind,
      verificationNote: person.verificationNote,
      matchNote:
        locale === "ru"
          ? "Имя обнаружено на самом сайте."
          : "The name was discovered on the site itself.",
    })),
  ];
}

async function searchEmailIntelligence(
  input: string,
  locale: Locale,
): Promise<SearchItem[]> {
  const { normalized, localPart, domain } = parseEmailQuery(input);

  if (!localPart || !domain) {
    return [];
  }

  const corporate = !isFreeMailDomain(domain);

  return [
    {
      id: `email-${normalized}`,
      source: "Email Intelligence",
      type: "normalized-email",
      title: normalized,
      subtitle:
        locale === "ru"
          ? corporate
            ? "Корпоративный адрес"
            : "Публичный почтовый провайдер"
          : corporate
            ? "Corporate mailbox"
            : "Public webmail provider",
      description:
        locale === "ru"
          ? "Нормализация email, локальная часть и доменная привязка для последующих OSINT-pivots."
          : "Normalized mailbox, local-part, and domain pivots for follow-on OSINT steps.",
      tags: ["email", "normalized", corporate ? "corporate" : "webmail"],
      details: [
        {
          label: locale === "ru" ? "Локальная часть" : "Local part",
          value: localPart,
        },
        {
          label: locale === "ru" ? "Домен" : "Domain",
          value: domain,
        },
        {
          label: locale === "ru" ? "Тип провайдера" : "Provider type",
          value:
            locale === "ru"
              ? corporate
                ? "Корпоративный"
                : "Публичный"
              : corporate
                ? "Corporate"
                : "Public webmail",
        },
      ],
    },
  ];
}

async function searchGravatarProfile(
  input: string,
  locale: Locale,
): Promise<SearchItem[]> {
  const { normalized } = parseEmailQuery(input);
  if (!normalized.includes("@")) {
    return [];
  }

  const hash = md5(normalized);
  const avatarUrl = `https://www.gravatar.com/avatar/${hash}?d=404&s=200`;

  try {
    const response = await fetch(avatarUrl, {
      method: "HEAD",
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.timeout(7000),
    });

    if (!response.ok) {
      return [];
    }

    return [
      {
        id: `gravatar-${hash}`,
        source: "Gravatar",
        type: "public-avatar",
        title: normalized,
        subtitle: locale === "ru" ? "Найден публичный avatar hash" : "Public avatar hash detected",
        description:
          locale === "ru"
            ? "Для этого email-хэша найден публичный gravatar-след."
            : "A public gravatar footprint was found for this email hash.",
        url: avatarUrl,
        tags: ["email", "gravatar", "avatar"],
        details: [
          {
            label: locale === "ru" ? "MD5 hash" : "MD5 hash",
            value: hash,
          },
        ],
      },
    ];
  } catch {
    return [];
  }
}

async function searchCompaniesHouse(
  query: string,
  kind: Extract<QueryKind, "company" | "person" | "keyword">,
  locale: Locale,
): Promise<SearchItem[]> {
  const apiKey = process.env.COMPANIES_HOUSE_API_KEY;
  if (!apiKey) {
    return [];
  }

  const dictionary = getDictionary(locale);
  const auth = Buffer.from(`${apiKey}:`).toString("base64");
  const endpoint =
    kind === "person"
      ? `https://api.company-information.service.gov.uk/search/officers?q=${encodeURIComponent(query)}`
      : `https://api.company-information.service.gov.uk/search/companies?q=${encodeURIComponent(query)}`;

  const data = await fetchJson<{
    items?: Array<Record<string, unknown>>;
  }>(endpoint, {
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${auth}`,
    },
  });

  return (data.items || []).slice(0, 6).map((item, index) => {
    const title = String(item.title || item.snippet || `Companies House ${index + 1}`);
    const description = String(item.description || "");
    const address = String(item.address_snippet || "");
    const companyNumber = String(item.company_number || "");
    const links = (item.links || {}) as Record<string, unknown>;
    const linkTarget = kind === "person" ? links.self : links.self;
    const url =
      typeof linkTarget === "string"
        ? `https://find-and-update.company-information.service.gov.uk${linkTarget.replace(
            /^\/company\//,
            "/company/",
          )}`
        : undefined;

    return {
      id: `companies-house-${kind}-${index}`,
      source: "Companies House",
      type: kind === "person" ? "officer-record" : "company-record",
      title,
      subtitle: companyNumber || address || undefined,
      description: description || address || undefined,
      url,
      tags: ["companies-house", kind],
      details: [
        ...(companyNumber
          ? [{ label: locale === "ru" ? "Номер компании" : "Company number", value: companyNumber }]
          : []),
        ...(address
          ? [{ label: locale === "ru" ? "Адрес" : "Address", value: address }]
          : []),
        ...(description
          ? [{ label: dictionary.searchResults.itemLabels.status, value: description }]
          : []),
      ],
    };
  });
}

async function searchOpenCorporates(
  query: string,
  kind: Extract<QueryKind, "company" | "person" | "keyword">,
  locale: Locale,
): Promise<SearchItem[]> {
  const token = process.env.OPENCORPORATES_API_TOKEN;
  if (!token) {
    return [];
  }

  const endpoint =
    kind === "person"
      ? `https://api.opencorporates.com/v0.4/officers/search?q=${encodeURIComponent(query)}&api_token=${encodeURIComponent(token)}`
      : `https://api.opencorporates.com/v0.4/companies/search?q=${encodeURIComponent(query)}&api_token=${encodeURIComponent(token)}`;

  const data = await fetchJson<{
    results?: {
      companies?: Array<{ company?: Record<string, unknown> }>;
      officers?: Array<{ officer?: Record<string, unknown> }>;
    };
  }>(endpoint);

  if (kind === "person") {
    return (data.results?.officers || []).slice(0, 6).map((wrapper, index) => {
      const officer = wrapper.officer || {};
      return {
        id: `opencorporates-officer-${index}`,
        source: "OpenCorporates",
        type: "officer-record",
        title: String(officer.name || `Officer ${index + 1}`),
        subtitle: String(officer.company_name || officer.position || ""),
        description: String(officer.jurisdiction_code || ""),
        url: typeof officer.opencorporates_url === "string" ? officer.opencorporates_url : undefined,
        tags: ["opencorporates", "person"],
        details: [
          ...(officer.position
            ? [{ label: locale === "ru" ? "Позиция" : "Position", value: String(officer.position) }]
            : []),
          ...(officer.jurisdiction_code
            ? [{
                label: locale === "ru" ? "Юрисдикция" : "Jurisdiction",
                value: String(officer.jurisdiction_code),
              }]
            : []),
        ],
      };
    });
  }

  return (data.results?.companies || []).slice(0, 6).map((wrapper, index) => {
    const company = wrapper.company || {};
    return {
      id: `opencorporates-company-${index}`,
      source: "OpenCorporates",
      type: "company-record",
      title: String(company.name || `Company ${index + 1}`),
      subtitle: String(company.company_number || company.jurisdiction_code || ""),
      description: String(company.current_status || company.registered_address_in_full || ""),
      url: typeof company.opencorporates_url === "string" ? company.opencorporates_url : undefined,
      tags: ["opencorporates", "company"],
      details: [
        ...(company.company_number
          ? [{
              label: locale === "ru" ? "Номер компании" : "Company number",
              value: String(company.company_number),
            }]
          : []),
        ...(company.jurisdiction_code
          ? [{
              label: locale === "ru" ? "Юрисдикция" : "Jurisdiction",
              value: String(company.jurisdiction_code),
            }]
          : []),
        ...(company.incorporation_date
          ? [{
              label: locale === "ru" ? "Дата регистрации" : "Incorporation",
              value: String(company.incorporation_date),
            }]
          : []),
      ],
    };
  });
}

async function searchCertificateTransparency(
  domain: string,
  locale: Locale,
): Promise<SearchItem[]> {
  const dictionary = getDictionary(locale);

  try {
    const payload = await fetchText(
      `https://crt.sh/?q=${encodeURIComponent(`%.${domain}`)}&output=json`,
    );
    const entries = JSON.parse(payload) as Array<{
      id: number;
      name_value?: string;
      issuer_name?: string;
      entry_timestamp?: string;
    }>;
    const hostnames = uniqueValues(
      entries
        .flatMap((entry) => (entry.name_value || "").split("\n"))
        .map((hostname) => hostname.replace(/^\*\./, "").trim().toLowerCase())
        .filter((hostname) => hostname.endsWith(domain.toLowerCase())),
    );

    if (hostnames.length === 0) {
      return [];
    }

    return [
      {
        id: `crtsh-${domain}`,
        source: "crt.sh",
        type: "certificate-summary",
        title: domain,
        subtitle: "Passive subdomain hints from certificate transparency",
        description: formatMessage(dictionary.searchResults.itemText.crtSummary, {
          subdomains: hostnames.length,
        }),
        url: `https://crt.sh/?q=${encodeURIComponent(`%.${domain}`)}`,
        tags: ["crt.sh", "certificate-transparency", "subdomains"],
        details: [
          {
            label: dictionary.searchResults.itemLabels.subdomains,
            value: String(hostnames.length),
          },
          {
            label: dictionary.searchResults.itemLabels.sample,
            value: hostnames.slice(0, 5).join(", "),
          },
          {
            label: dictionary.searchResults.itemLabels.latestEntry,
            value: entries[0]?.entry_timestamp || dictionary.common.unknown,
          },
        ],
      },
    ];
  } catch {
    return [];
  }
}

async function searchSecurityTxt(domain: string, locale: Locale): Promise<SearchItem[]> {
  const dictionary = getDictionary(locale);
  const candidates = [
    `https://${domain}/.well-known/security.txt`,
    `https://${domain}/security.txt`,
    `http://${domain}/.well-known/security.txt`,
  ];

  for (const url of candidates) {
    try {
      const content = await fetchText(url);
      const contacts = uniqueValues(
        Array.from(content.matchAll(/^Contact:\s*(.+)$/gim)).map((match) => match[1].trim()),
      );
      const policies = uniqueValues(
        Array.from(content.matchAll(/^Policy:\s*(.+)$/gim)).map((match) => match[1].trim()),
      );
      const hiring = uniqueValues(
        Array.from(content.matchAll(/^Hiring:\s*(.+)$/gim)).map((match) => match[1].trim()),
      );

      return [
        {
          id: `securitytxt-${domain}`,
          source: "security.txt",
          type: "security-contact",
          title: domain,
          subtitle: url,
          description: dictionary.searchResults.itemText.securityTxtPresent,
          url,
          tags: ["security.txt", "contact", "disclosure"],
          details: [
            {
              label: dictionary.searchResults.itemLabels.contacts,
              value: contacts.join(", ") || dictionary.common.notFound,
            },
            {
              label: dictionary.searchResults.itemLabels.policy,
              value: policies.join(", ") || dictionary.common.notFound,
            },
            {
              label: dictionary.searchResults.itemLabels.hiring,
              value: hiring.join(", ") || dictionary.common.notFound,
            },
          ],
        },
      ];
    } catch {
      // continue to the next candidate
    }
  }

  return [];
}

async function searchWikidataEntities(query: string, locale: Locale): Promise<SearchItem[]> {
  const dictionary = getDictionary(locale);
  const language = locale === "ru" ? "ru" : "en";
  const data = await fetchJson<{
    search?: Array<{
      id: string;
      label?: string;
      description?: string;
      concepturi?: string;
      match?: { language?: string };
    }>;
  }>(
    `https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&limit=6&language=${language}&uselang=${language}&search=${encodeURIComponent(
      query,
    )}`,
  );

  return (data.search || []).map((item) => ({
    id: item.id,
    source: "Wikidata",
    type: "entity-reference",
    title: item.label || item.id,
    subtitle: item.description || dictionary.searchResults.itemText.wikidataMatch,
    description: dictionary.searchResults.itemText.wikidataMatch,
    url: item.concepturi?.replace("http://", "https://"),
    tags: ["wikidata", "entity", "public knowledge"],
    details: [
      {
        label: dictionary.searchResults.itemLabels.language,
        value: item.match?.language || dictionary.common.notSpecified,
      },
    ],
  }));
}

async function searchWikipediaEntities(query: string, locale: Locale): Promise<SearchItem[]> {
  const language = locale === "ru" ? "ru" : "en";
  const host = `${language}.wikipedia.org`;

  const data = await fetchJson<[string, string[], string[], string[]]>(
    `https://${host}/w/api.php?action=opensearch&limit=6&namespace=0&format=json&search=${encodeURIComponent(
      query,
    )}`,
  );

  const titles = data[1] || [];
  const descriptions = data[2] || [];
  const urls = data[3] || [];

  const settled = await Promise.allSettled(
    titles.slice(0, 6).map(async (title, index) => {
      const fallbackUrl = urls[index] || `https://${host}/wiki/${encodeURIComponent(title)}`;
      const summary = await fetchJson<{
        title?: string;
        description?: string;
        extract?: string;
        content_urls?: { desktop?: { page?: string } };
      }>(`https://${host}/api/rest_v1/page/summary/${encodeURIComponent(title)}`);

      return {
        id: `wikipedia-${language}-${title.toLowerCase().replace(/\s+/g, "-")}`,
        source: "Wikipedia",
        type: "encyclopedia-entry",
        title: summary.title || title,
        subtitle:
          summary.description ||
          descriptions[index] ||
          (locale === "ru" ? "Публичный энциклопедический контекст" : "Public encyclopedia context"),
        description:
          summary.extract ||
          descriptions[index] ||
          (locale === "ru"
            ? "Найдена публичная энциклопедическая справка по сущности."
            : "A public encyclopedia reference was found for this entity."),
        url: summary.content_urls?.desktop?.page || fallbackUrl,
        tags: ["wikipedia", "entity", "public knowledge"],
        dataTypes:
          locale === "ru"
            ? ["Справка", "Сущность", "Контекст"]
            : ["Reference", "Entity", "Context"],
        details: [
          {
            label: locale === "ru" ? "Язык Wikipedia" : "Wikipedia language",
            value: language,
          },
        ],
      } satisfies SearchItem;
    }),
  );

  return settled
    .flatMap((result, index) => {
      if (result.status === "fulfilled") {
        return [result.value];
      }

      const title = titles[index];
      if (!title) {
        return [];
      }

      return [
        {
          id: `wikipedia-${language}-${title.toLowerCase().replace(/\s+/g, "-")}`,
          source: "Wikipedia",
          type: "encyclopedia-entry",
          title,
          subtitle:
            descriptions[index] ||
            (locale === "ru" ? "Публичный энциклопедический контекст" : "Public encyclopedia context"),
          description:
            descriptions[index] ||
            (locale === "ru"
              ? "Найдена публичная энциклопедическая справка по сущности."
              : "A public encyclopedia reference was found for this entity."),
          url: urls[index],
          tags: ["wikipedia", "entity", "public knowledge"],
          dataTypes:
            locale === "ru"
              ? ["Справка", "Сущность", "Контекст"]
              : ["Reference", "Entity", "Context"],
          details: [
            {
              label: locale === "ru" ? "Язык Wikipedia" : "Wikipedia language",
              value: language,
            },
          ],
        } satisfies SearchItem,
      ];
    })
    .slice(0, 6);
}

async function searchHttpHeaders(domain: string, locale: Locale): Promise<SearchItem[]> {
  const dictionary = getDictionary(locale);
  const meta = await fetchSiteResponseMeta(domain);

  if (!meta) {
    return [];
  }

  const headerEntries = [
    ["server", meta.headers.get("server")],
    ["x-powered-by", meta.headers.get("x-powered-by")],
    ["content-security-policy", meta.headers.get("content-security-policy")],
    ["strict-transport-security", meta.headers.get("strict-transport-security")],
    ["x-frame-options", meta.headers.get("x-frame-options")],
    ["referrer-policy", meta.headers.get("referrer-policy")],
    ["permissions-policy", meta.headers.get("permissions-policy")],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  const securityHeaderCount = headerEntries.filter(([name]) =>
    /content-security-policy|strict-transport-security|x-frame-options|referrer-policy|permissions-policy/i.test(
      name,
    ),
  ).length;

  return [
    {
      id: `headers-${domain}`,
      source: "HTTP Headers",
      type: "http-header-snapshot",
      title: meta.finalUrl,
      subtitle:
        locale === "ru"
          ? `HTTP ${meta.status} • ${securityHeaderCount} security headers`
          : `HTTP ${meta.status} • ${securityHeaderCount} security headers`,
      description:
        locale === "ru"
          ? "Снимок серверных и security-заголовков для технического профиля сайта."
          : "Snapshot of server and security headers for the site's technical profile.",
      url: meta.finalUrl,
      tags: ["headers", "security", "web-check-class"],
      dataTypes:
        locale === "ru"
          ? ["HTTP", "Security Headers", "Технический след"]
          : ["HTTP", "Security Headers", "Technical Footprint"],
      details: [
        {
          label: locale === "ru" ? "Статус" : "Status",
          value: String(meta.status),
        },
        {
          label: locale === "ru" ? "Server" : "Server",
          value: meta.headers.get("server") || dictionary.common.notDeclared,
        },
        {
          label: locale === "ru" ? "X-Powered-By" : "X-Powered-By",
          value: meta.headers.get("x-powered-by") || dictionary.common.notDeclared,
        },
        {
          label: locale === "ru" ? "CSP" : "CSP",
          value: meta.headers.get("content-security-policy") || dictionary.common.notDeclared,
        },
        {
          label: locale === "ru" ? "HSTS" : "HSTS",
          value: meta.headers.get("strict-transport-security") || dictionary.common.notDeclared,
        },
        {
          label: locale === "ru" ? "Referrer-Policy" : "Referrer-Policy",
          value: meta.headers.get("referrer-policy") || dictionary.common.notDeclared,
        },
      ],
    },
  ];
}

async function searchStructuredData(domain: string, locale: Locale): Promise<SearchItem[]> {
  const dictionary = getDictionary(locale);
  const siteDocument = await fetchSiteDocument(domain);

  if (!siteDocument) {
    return [];
  }

  const objects = extractJsonLdObjects(siteDocument.html).filter((node) => {
    const type = jsonLdType(node).toLowerCase();
    return /(organization|corporation|localbusiness|person|website|softwareapplication)/i.test(
      type,
    );
  });

  if (objects.length === 0) {
    return [];
  }

  return objects.slice(0, 6).map((node, index) => {
    const sameAs = readJsonLdList(node, "sameAs").slice(0, 4);
    const address = readJsonLdText(node, "address");
    const contactPoint = readJsonLdList(node, "contactPoint").slice(0, 3);
    const name = readJsonLdText(node, "name") || readJsonLdText(node, "alternateName");
    const type = jsonLdType(node) || "Thing";
    const email = readJsonLdText(node, "email");
    const phone = readJsonLdText(node, "telephone");
    const foundingDate = readJsonLdText(node, "foundingDate");
    const url = readJsonLdText(node, "url") || siteDocument.finalUrl;
    const description = readJsonLdText(node, "description");

    return {
      id: `structured-data-${domain}-${index}`,
      source: "Structured Data",
      type: "json-ld-entity",
      title: name || domain,
      subtitle: type,
      description:
        description ||
        (locale === "ru"
          ? "На сайте найдена JSON-LD сущность, полезная для entity mapping и follow-on research."
          : "A JSON-LD entity was found on the site for entity mapping and follow-on research."),
      url,
      tags: ["json-ld", "schema.org", "entity"],
      dataTypes:
        locale === "ru"
          ? ["Сущность", "Контакты", "Соцссылки", "Структурированные данные"]
          : ["Entity", "Contacts", "Social Links", "Structured Data"],
      details: [
        {
          label: locale === "ru" ? "Тип сущности" : "Entity type",
          value: type,
        },
        {
          label: locale === "ru" ? "URL" : "URL",
          value: url,
        },
        {
          label: locale === "ru" ? "Email" : "Email",
          value: email || dictionary.common.notFound,
        },
        {
          label: locale === "ru" ? "Телефон" : "Phone",
          value: phone || dictionary.common.notFound,
        },
        {
          label: locale === "ru" ? "Адрес" : "Address",
          value: address || dictionary.common.notFound,
        },
        {
          label: locale === "ru" ? "Дата основания" : "Founding date",
          value: foundingDate || dictionary.common.notSpecified,
        },
        {
          label: locale === "ru" ? "sameAs" : "sameAs",
          value: sameAs.join(", ") || dictionary.common.notFound,
        },
        {
          label: locale === "ru" ? "Contact points" : "Contact points",
          value: contactPoint.join(", ") || dictionary.common.notFound,
        },
      ],
    };
  });
}

async function searchCrawlSurface(domain: string, locale: Locale): Promise<SearchItem[]> {
  const dictionary = getDictionary(locale);
  const siteMeta = await fetchSiteResponseMeta(domain);

  if (!siteMeta) {
    return [];
  }

  const robotsUrl = `${siteMeta.origin}/robots.txt`;
  const sitemapFallback = `${siteMeta.origin}/sitemap.xml`;
  const humansCandidates = [`${siteMeta.origin}/humans.txt`, `${siteMeta.origin}/.well-known/humans.txt`];

  const robotsText = await fetchText(robotsUrl).catch(() => "");
  const allowRules = uniqueValues(
    Array.from(robotsText.matchAll(/^Allow:\s*(.+)$/gim)).map((match) => match[1].trim()),
  );
  const disallowRules = uniqueValues(
    Array.from(robotsText.matchAll(/^Disallow:\s*(.+)$/gim)).map((match) => match[1].trim()),
  );
  const sitemapLinks = uniqueValues(
    Array.from(robotsText.matchAll(/^Sitemap:\s*(.+)$/gim)).map((match) => match[1].trim()),
  );

  const sitemapUrl = sitemapLinks[0] || sitemapFallback;
  const sitemapText = await fetchText(sitemapUrl).catch(() => "");
  const sitemapEntries = parseXmlLocs(sitemapText);
  const interestingEntries = sitemapEntries
    .filter((entry) =>
      /(about|team|leadership|contact|career|jobs|docs|api|partners?|integrations?|press|news|security|trust)/i.test(
        entry,
      ),
    )
    .slice(0, 8);

  let humansText = "";
  let humansUrl = "";
  for (const candidate of humansCandidates) {
    humansText = await fetchText(candidate).catch(() => "");
    if (humansText) {
      humansUrl = candidate;
      break;
    }
  }

  const humansLines = humansText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && !line.startsWith("/*"))
    .slice(0, 6);

  const items: SearchItem[] = [
    {
      id: `crawl-surface-${domain}`,
      source: "Crawl Surface",
      type: "crawl-summary",
      title: domain,
      subtitle:
        locale === "ru"
          ? "robots.txt, sitemap.xml и humans.txt"
          : "robots.txt, sitemap.xml, and humans.txt",
      description:
        locale === "ru"
          ? "Поверхность обхода сайта и полезные пути для дальнейшего доисследования."
          : "Site crawl surface and useful paths for follow-on investigation.",
      url: robotsText ? robotsUrl : sitemapEntries.length > 0 ? sitemapUrl : siteMeta.finalUrl,
      tags: ["robots", "sitemap", "crawl-surface"],
      dataTypes:
        locale === "ru"
          ? ["Пути сайта", "Статистика", "Навигация"]
          : ["Site Paths", "Statistics", "Navigation"],
      details: [
        {
          label: locale === "ru" ? "Allow rules" : "Allow rules",
          value: String(allowRules.length),
        },
        {
          label: locale === "ru" ? "Disallow rules" : "Disallow rules",
          value: String(disallowRules.length),
        },
        {
          label: locale === "ru" ? "Sitemap URLs" : "Sitemap URLs",
          value: String(sitemapEntries.length),
        },
        {
          label: locale === "ru" ? "Interesting paths" : "Interesting paths",
          value: interestingEntries.slice(0, 4).join(", ") || dictionary.common.notFound,
        },
        {
          label: locale === "ru" ? "humans.txt" : "humans.txt",
          value: humansUrl || dictionary.common.notFound,
        },
      ],
    },
  ];

  if (interestingEntries.length > 0) {
    items.push({
      id: `crawl-surface-paths-${domain}`,
      source: "Crawl Surface",
      type: "interesting-paths",
      title: locale === "ru" ? "Приоритетные пути из sitemap" : "Priority paths from sitemap",
      subtitle: sitemapUrl,
      description:
        locale === "ru"
          ? "Полезные внутренние URL из sitemap для поиска команды, контактов, партнёров, вакансий и документации."
          : "Useful internal URLs from the sitemap for team, contact, partner, hiring, and docs research.",
      url: sitemapUrl,
      tags: ["sitemap", "paths", "autopivot"],
      dataTypes:
        locale === "ru"
          ? ["Пути сайта", "Контакты", "Партнёрства"]
          : ["Site Paths", "Contacts", "Partnerships"],
      details: interestingEntries.slice(0, 6).map((entry, index) => ({
        label: locale === "ru" ? `Путь ${index + 1}` : `Path ${index + 1}`,
        value: entry,
      })),
    });
  }

  if (humansLines.length > 0) {
    items.push({
      id: `crawl-surface-humans-${domain}`,
      source: "Crawl Surface",
      type: "humans-txt",
      title: "humans.txt",
      subtitle: humansUrl,
      description:
        locale === "ru"
          ? "На сайте найден humans.txt с дополнительными hints по команде или структуре."
          : "A humans.txt file was found with extra hints about the team or site structure.",
      url: humansUrl,
      tags: ["humans.txt", "team-hints"],
      dataTypes:
        locale === "ru"
          ? ["Команда", "Пути сайта", "Контекст"]
          : ["Team", "Site Paths", "Context"],
      details: humansLines.map((line, index) => ({
        label: locale === "ru" ? `Строка ${index + 1}` : `Line ${index + 1}`,
        value: line,
      })),
    });
  }

  return items;
}

async function searchPhoneIntelligence(input: string, locale: Locale): Promise<SearchItem[]> {
  const dictionary = getDictionary(locale);
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
      subtitle: parsed.country || dictionary.searchResults.itemText.countryUnresolved,
      description: parsed.isValid()
        ? dictionary.searchResults.itemText.phoneValid
        : dictionary.searchResults.itemText.phoneInvalid,
      tags: ["phone", "e164", "normalized"],
      details: [
        {
          label: dictionary.searchResults.itemLabels.international,
          value: parsed.formatInternational(),
        },
        {
          label: dictionary.searchResults.itemLabels.national,
          value: parsed.formatNational(),
        },
        {
          label: dictionary.searchResults.itemLabels.country,
          value: parsed.country || dictionary.common.unknown,
        },
        {
          label: dictionary.searchResults.itemLabels.callingCode,
          value: `+${parsed.countryCallingCode}`,
        },
        {
          label: dictionary.searchResults.itemLabels.possible,
          value: parsed.isPossible() ? dictionary.common.yes : dictionary.common.no,
        },
        {
          label: dictionary.searchResults.itemLabels.valid,
          value: parsed.isValid() ? dictionary.common.yes : dictionary.common.no,
        },
        {
          label: dictionary.searchResults.itemLabels.phoneType,
          value: parsed.getType() || dictionary.common.unknown,
        },
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
            ? lookup.valid
              ? dictionary.searchResults.itemText.twilioValid
              : dictionary.searchResults.itemText.twilioInvalid
            : dictionary.searchResults.itemText.twilioNormalized,
        url: lookup.url,
        tags: ["phone", "twilio", "official api"],
        details: [
          {
            label: dictionary.searchResults.itemLabels.country,
            value: lookup.country_code || dictionary.common.unknown,
          },
          {
            label: dictionary.searchResults.itemLabels.callingCode,
            value: lookup.calling_country_code || dictionary.common.unknown,
          },
          {
            label: dictionary.searchResults.itemLabels.nationalFormat,
            value: lookup.national_format || dictionary.common.unknown,
          },
          {
            label: dictionary.searchResults.itemLabels.valid,
            value:
              typeof lookup.valid === "boolean"
                ? lookup.valid
                  ? dictionary.common.yes
                  : dictionary.common.no
                : dictionary.common.unknown,
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

function normalizePath(pathname: string) {
  return pathname.replace(/\/+$/, "") || "/";
}

function verifyProfileResponse(
  candidate: ProfileCandidate,
  normalized: string,
  finalUrl: URL,
  title: string,
  body: string,
) {
  const normalizedPath = normalizePath(finalUrl.pathname.toLowerCase());
  const pathOk = candidate.pathVariants.includes(normalizedPath);
  const rejectPatterns = candidate.rejectPatterns || [
    /\b404\b/i,
    /page not found/i,
    /profile not found/i,
    /user not found/i,
    /doesn['’]t exist/i,
    /not found/i,
  ];
  const rejected = rejectPatterns.some((pattern) => pattern.test(`${title}\n${body}`));
  const usernameMentioned = new RegExp(`\\b${normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(
    `${title}\n${body}\n${finalUrl.pathname}`,
  );

  if (!pathOk || rejected) {
    return {
      ok: false,
      confidence: "low" as ConfidenceLevel,
      verificationStatus: "candidate" as VerificationStatus,
      verificationNote: "Response did not pass strict path and content validation.",
      matchKind: "derived" as MatchKind,
      matchNote: "Suppressed because the profile signal was too weak or too generic.",
    };
  }

  return {
    ok: usernameMentioned,
    confidence: usernameMentioned ? ("high" as ConfidenceLevel) : ("medium" as ConfidenceLevel),
    verificationStatus: usernameMentioned
      ? ("verified" as VerificationStatus)
      : ("likely" as VerificationStatus),
    verificationNote: usernameMentioned
      ? "Profile path and page content both matched the username."
      : "Profile path matched the username, but page content offered limited confirmation.",
    matchKind: "derived" as MatchKind,
    matchNote: "Profile was discovered by direct public profile probing for the username.",
  };
}

async function probeProfileCandidate(
  candidate: ProfileCandidate,
  normalized: string,
): Promise<ProfileProbe | null> {
  const headers = new Headers({
    "User-Agent": "Privat-OSINT-Console",
  });

  Object.entries(candidate.headers || {}).forEach(([key, value]) => {
    headers.set(key, value);
  });

  const response = await fetch(candidate.url, {
    method: "GET",
    cache: "no-store",
    redirect: "follow",
    signal: AbortSignal.timeout(8000),
    headers,
  });

  if (!response.ok) {
    return null;
  }

  const finalUrl = new URL(response.url);
  const html = await response.text();
  const title = extractMatch(html, /<title[^>]*>([^<]+)<\/title>/i)?.toLowerCase() || "";
  const body = stripHtml(html).slice(0, 5000).toLowerCase();
  const verdict = verifyProfileResponse(candidate, normalized, finalUrl, title, body);

  if (!verdict.ok) {
    return null;
  }

  let archivedPages = 0;
  try {
    const summary = await fetchWaybackSummary(finalUrl.toString());
    archivedPages = summary.pageCount;
  } catch {
    archivedPages = 0;
  }

  return {
    platform: candidate.platform,
    url: finalUrl.toString(),
    status: response.status,
    archivedPages,
    confidence: verdict.confidence,
    verificationStatus: verdict.verificationStatus,
    verificationNote: verdict.verificationNote,
    matchKind: verdict.matchKind,
    matchNote: verdict.matchNote,
  };
}

async function searchUsernameFootprint(
  username: string,
  locale: Locale,
): Promise<SearchItem[]> {
  const dictionary = getDictionary(locale);
  const normalized = canonicalizeUsername(username);
  const candidates: ProfileCandidate[] = [
    {
      platform: "GitLab",
      url: `https://gitlab.com/${normalized}`,
      pathVariants: [`/${normalized}`],
      rejectPatterns: [/^\[\]$/i],
    },
    {
      platform: "Codeberg",
      url: `https://codeberg.org/${normalized}`,
      pathVariants: [`/${normalized}`],
    },
    {
      platform: "Bitbucket",
      url: `https://bitbucket.org/${normalized}`,
      pathVariants: [`/${normalized}`],
    },
    {
      platform: "DEV",
      url: `https://dev.to/${normalized}`,
      pathVariants: [`/${normalized}`],
    },
    {
      platform: "Hashnode",
      url: `https://hashnode.com/@${normalized}`,
      pathVariants: [`/@${normalized}`],
    },
    {
      platform: "Medium",
      url: `https://medium.com/@${normalized}`,
      pathVariants: [`/@${normalized}`],
      rejectPatterns: [/<body/i],
    },
    {
      platform: "Keybase",
      url: `https://keybase.io/${normalized}`,
      pathVariants: [`/${normalized}`],
    },
    {
      platform: "GitBook",
      url: `https://${normalized}.gitbook.io`,
      pathVariants: ["/"],
    },
    {
      platform: "Hugging Face",
      url: `https://huggingface.co/${normalized}`,
      pathVariants: [`/${normalized}`],
    },
    {
      platform: "Kaggle",
      url: `https://www.kaggle.com/${normalized}`,
      pathVariants: [`/${normalized}`],
    },
    {
      platform: "LeetCode",
      url: `https://leetcode.com/${normalized}/`,
      pathVariants: [`/${normalized}`, `/u/${normalized}`],
    },
    {
      platform: "PyPI",
      url: `https://pypi.org/user/${normalized}/`,
      pathVariants: [`/user/${normalized}`],
    },
    {
      platform: "Replit",
      url: `https://replit.com/@${normalized}`,
      pathVariants: [`/@${normalized}`],
    },
    {
      platform: "Reddit",
      url: `https://www.reddit.com/user/${normalized}`,
      pathVariants: [`/user/${normalized}`],
      rejectPatterns: [/Sorry, nobody on Reddit goes by that name\./i],
      headers: {
        "accept-language": "en-US,en;q=0.9",
      },
    },
    {
      platform: "npm",
      url: `https://www.npmjs.com/~${normalized}`,
      pathVariants: [`/~${normalized}`],
    },
    {
      platform: "Docker Hub",
      url: `https://hub.docker.com/u/${normalized}`,
      pathVariants: [`/u/${normalized}`],
    },
    {
      platform: "Telegram",
      url: `https://t.me/${normalized}`,
      pathVariants: [`/${normalized}`],
      rejectPatterns: [
        /<title>Telegram Messenger<\/title>/i,
        /tg:\/\/resolve\?domain=/i,
      ],
    },
    {
      platform: "Patreon",
      url: `https://www.patreon.com/${normalized}`,
      pathVariants: [`/${normalized}`],
    },
    {
      platform: "TryHackMe",
      url: `https://tryhackme.com/p/${normalized}`,
      pathVariants: [`/p/${normalized}`],
    },
    {
      platform: "Codecademy",
      url: `https://www.codecademy.com/profiles/${normalized}`,
      pathVariants: [`/profiles/${normalized}`],
    },
  ];

  const probes = await Promise.allSettled(
    candidates.map((candidate) => probeProfileCandidate(candidate, normalized)),
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
      description: formatMessage(dictionary.searchResults.itemText.usernameProfileHit, {
        status: probe.status,
      }),
      url: probe.url,
      tags: ["username", "profile", "sherlock-class"],
      confidence: probe.confidence,
      verificationStatus: probe.verificationStatus,
      verificationNote:
        locale === "ru"
          ? probe.verificationNote
              .replace("Profile path and page content both matched the username.", "Путь профиля и содержимое страницы совпали с username.")
              .replace("Profile path matched the username, but page content offered limited confirmation.", "Путь профиля совпал с username, но содержимое страницы подтвердило это лишь частично.")
          : probe.verificationNote,
      matchKind: probe.matchKind,
      matchNote:
        locale === "ru"
          ? "Найдено прямым публичным probe по username."
          : probe.matchNote,
      details: [
        {
          label: locale === "ru" ? "HTTP-статус" : "HTTP status",
          value: String(probe.status),
        },
        {
          label: dictionary.searchResults.itemLabels.waybackPages,
          value: String(probe.archivedPages || 0),
        },
        {
          label: locale === "ru" ? "Проверка" : "Verification",
          value:
            probe.verificationStatus === "verified"
              ? locale === "ru"
                ? "Подтверждено"
                : "Verified"
              : locale === "ru"
                ? "Вероятно"
                : "Likely",
        },
      ],
    }));
}

function inferEntityType(item: SearchItem, locale: Locale) {
  const haystack = [
    item.source,
    item.type,
    item.title,
    item.subtitle || "",
    item.description || "",
    ...(item.tags || []),
    ...(item.dataTypes || []),
  ]
    .join(" ")
    .toLowerCase();

  if (/(email|gravatar|mailbox|local part)/i.test(haystack)) {
    return locale === "ru" ? "Email" : "Email";
  }
  if (/(phone|телефон|calling code|carrier|e164|phoneinfoga)/i.test(haystack)) {
    return locale === "ru" ? "Телефон" : "Phone";
  }
  if (/(domain|dns|rdap|certificate|subdomain|security\.txt|robots|sitemap|headers|json-ld|structured data)/i.test(haystack)) {
    return locale === "ru" ? "Домен / сайт" : "Domain / Website";
  }
  if (/(person|officer|username|profile|name-analysis)/i.test(haystack)) {
    return locale === "ru" ? "Человек / профиль" : "Person / Profile";
  }
  if (/(github|repository|repo|octosuite)/i.test(haystack)) {
    return locale === "ru" ? "Репозиторий / код" : "Repository / Code";
  }
  if (/(company|registry|issuer|lei|ticker|jurisdiction|officer-record|company-record)/i.test(haystack)) {
    return locale === "ru" ? "Компания" : "Company";
  }
  if (/(archive|wayback|capture|wikipedia|wikidata|reference)/i.test(haystack)) {
    return locale === "ru" ? "Контекст / архив" : "Context / Archive";
  }

  return locale === "ru" ? "Данные" : "Data";
}

function defaultVerification(
  item: SearchItem,
  sectionId: string,
  locale: Locale,
): Pick<SearchItem, "confidence" | "verificationStatus" | "verificationNote" | "matchKind" | "matchNote"> {
  if (
    item.confidence &&
    item.verificationStatus &&
    item.verificationNote &&
    item.matchKind &&
    item.matchNote
  ) {
    return {
      confidence: item.confidence,
      verificationStatus: item.verificationStatus,
      verificationNote: item.verificationNote,
      matchKind: item.matchKind,
      matchNote: item.matchNote,
    };
  }

  const source = item.source.toLowerCase();
  const section = sectionId.toLowerCase();
  const directVerifiedSources = new Set([
    "gleif",
    "sec",
    "github",
    "rdap",
    "cloudflare doh",
    "website metadata",
    "http headers",
    "structured data",
    "site ownership",
    "hosting intelligence",
    "crawl surface",
    "crt.sh",
    "security.txt",
    "wikidata",
    "wikipedia",
    "phone intelligence",
    "twilio lookup",
    "gravatar",
    "email intelligence",
    "companies house",
    "opencorporates",
    "crunchbase",
  ]);

  if (section === "recommended") {
    return {
      confidence: "medium",
      verificationStatus: "verified",
      verificationNote:
        locale === "ru"
          ? "Это справочный источник или инструмент, а не прямой результат по сущности."
          : "This is a reference source or tool, not a direct entity result.",
      matchKind: "direct",
      matchNote:
        locale === "ru"
          ? "Показано как рекомендуемое продолжение исследования."
          : "Shown as a recommended next source for the investigation.",
    };
  }

  if (directVerifiedSources.has(source)) {
    return {
      confidence: "high",
      verificationStatus: "verified",
      verificationNote:
        locale === "ru"
          ? "Результат получен из живого источника или с самого целевого сайта."
          : "This result came from a live source or from the target site itself.",
      matchKind: "direct",
      matchNote:
        locale === "ru"
          ? "Связь с запросом прямая, без слабых эвристик."
          : "The relation to the query is direct rather than heuristic.",
    };
  }

  if (source === "username pivot") {
    return {
      confidence: "medium",
      verificationStatus: "likely",
      verificationNote:
        locale === "ru"
          ? "Профиль найден прямым probe по username, но всё равно требует ручной проверки на совпадение личности."
          : "The profile was found by direct username probing, but still needs manual identity confirmation.",
      matchKind: "derived",
      matchNote:
        locale === "ru"
          ? "Связь строится через username-pivot."
          : "The relation is built through a username pivot.",
    };
  }

  if (source === "sherlock" || source === "maigret") {
    return {
      confidence: "medium",
      verificationStatus: "likely",
      verificationNote:
        locale === "ru"
          ? "OSINT-инструмент подтвердил существование публичного профиля, но связь с конкретной сущностью ещё требует ручной проверки."
          : "The OSINT tool confirmed a public profile exists, but its relation to the target entity still needs manual review.",
      matchKind: "derived",
      matchNote:
        locale === "ru"
          ? "Совпадение получено через username-enumeration."
          : "This match came from username enumeration.",
    };
  }

  if (
    source === "subfinder" ||
    source === "amass" ||
    source === "theharvester" ||
    source === "spiderfoot" ||
    source === "phoneinfoga" ||
    source === "octosuite"
  ) {
    return {
      confidence: "medium",
      verificationStatus: "verified",
      verificationNote:
        locale === "ru"
          ? "Данные получены из специализированного OSINT-инструмента и требуют аналитической интерпретации, но сам артефакт подтверждён."
          : "The data came from a specialized OSINT tool and still needs analyst interpretation, but the artifact itself is confirmed.",
      matchKind: "direct",
      matchNote:
        locale === "ru"
          ? "Результат построен по прямому запуску инструмента на вашем запросе."
          : "The result was produced by running the tool directly against your query.",
    };
  }

  if (source === "site discovery" || source === "исследование сайта" || section.includes("site-discovery")) {
    return {
      confidence: "medium",
      verificationStatus: "verified",
      verificationNote:
        locale === "ru"
          ? "Страница и данные реально извлечены с целевого сайта, но их аналитический смысл может требовать проверки."
          : "The page and data were extracted from the target site, though their analyst meaning may still need review.",
      matchKind: "derived",
      matchNote:
        locale === "ru"
          ? "Результат получен из follow-on paths внутри сайта."
          : "The result was derived from follow-on paths inside the site.",
    };
  }

  if (source === "person breakdown" || source === "разбор человека") {
    return {
      confidence: "medium",
      verificationStatus: "likely",
      verificationNote:
        locale === "ru"
          ? "Это аналитическая разбивка имени, а не внешний факт."
          : "This is an analyst-generated breakdown rather than an external fact.",
      matchKind: "derived",
      matchNote:
        locale === "ru"
          ? "Используется как стартовая гипотеза для дальнейшей проверки."
          : "Used as a starting hypothesis for follow-on validation.",
    };
  }

  return {
    confidence: "medium",
    verificationStatus: "verified",
    verificationNote:
      locale === "ru"
        ? "Результат прошёл базовую верификацию по источнику и форме совпадения."
        : "The result passed baseline verification for its source and match pattern.",
    matchKind: "direct",
    matchNote:
      locale === "ru"
        ? "Связь с запросом считается прямой, если не указано иное."
        : "The relation to the query is treated as direct unless stated otherwise.",
  };
}

function scoreSearchItem(item: SearchItem) {
  const confidenceScore = item.confidence === "high" ? 3 : item.confidence === "medium" ? 2 : 1;
  const verificationScore =
    item.verificationStatus === "verified" ? 3 : item.verificationStatus === "likely" ? 2 : 1;
  const matchScore = item.matchKind === "direct" ? 2 : 1;
  const detailScore = item.details?.length || 0;
  const urlScore = item.url ? 1 : 0;

  return confidenceScore * 10 + verificationScore * 10 + matchScore * 5 + detailScore + urlScore;
}

function finalizeSearchSections(sections: SearchSection[], locale: Locale): SearchSection[] {
  return sections
    .map((section) => {
      const deduped = new Map<string, SearchItem>();

      for (const item of section.items) {
        const normalizedUrl = normalizeUrlForKey(item.url);
        const key = normalizedUrl
          ? [item.source.toLowerCase(), normalizedUrl].join("|")
          : [
              item.source.toLowerCase(),
              item.title.trim().toLowerCase(),
              (item.subtitle || "").trim().toLowerCase(),
            ].join("|");

        const current = deduped.get(key);
        if (!current || scoreSearchItem(item) > scoreSearchItem(current)) {
          deduped.set(key, item);
        }
      }

      const items = Array.from(deduped.values())
        .map((item) => {
          const defaults = defaultVerification(item, section.id, locale);
          const finalized: SearchItem = {
            ...item,
            entityType: item.entityType || inferEntityType(item, locale),
            confidence: item.confidence || defaults.confidence,
            verificationStatus: item.verificationStatus || defaults.verificationStatus,
            verificationNote: item.verificationNote || defaults.verificationNote,
            matchKind: item.matchKind || defaults.matchKind,
            matchNote: item.matchNote || defaults.matchNote,
          };

          if (
            finalized.verificationStatus === "candidate" ||
            (finalized.matchKind === "derived" &&
              finalized.confidence === "low" &&
              section.id !== "recommended")
          ) {
            return null;
          }

          return finalized;
        })
        .filter((item): item is SearchItem => Boolean(item))
        .sort((a, b) => scoreSearchItem(b) - scoreSearchItem(a)) as SearchItem[];

      return { ...section, items };
    })
    .filter((section) => section.id === "recommended" || section.items.length > 0);
}

function recommendedConnectors(kind: QueryKind, locale: Locale) {
  const dictionary = getDictionary(locale);
  return connectorCatalog
    .filter((connector) => connector.queryKinds.includes(kind))
    .sort((a, b) => {
      const statusWeight = { live: 0, ready: 1, requires_key: 2, manual: 3 };
      return statusWeight[a.status] - statusWeight[b.status];
    })
    .slice(0, 12)
    .map((connector) => ({
      id: connector.id,
      source: humanizeConnectorCategory(connector.category, locale),
      type: connector.status,
      title: connector.name,
      subtitle:
        connector.status === "live"
          ? dictionary.sourcesPage.live
          : connector.status === "ready"
            ? dictionary.sourcesPage.ready
            : connector.status === "requires_key"
              ? dictionary.sourcesPage.requiresKey
              : dictionary.sourcesPage.manual,
      description: connector.description,
      url: connector.officialUrl,
      tags: connector.queryKinds.map((kind) => humanizeQueryKind(kind, locale)),
      details: connector.notes
        ? [{ label: dictionary.searchResults.itemLabels.operatorNote, value: connector.notes }]
        : [],
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

export async function runUnifiedSearch(
  query: string,
  locale: Locale = "en",
): Promise<SearchRun> {
  const dictionary = getDictionary(locale);
  const inferredType = inferQueryKind(query);
  const normalizedQuery = query.trim();
  const keywordLooksLikeHandle =
    inferredType === "keyword" && /^(?:@)?[a-z0-9][a-z0-9._-]{2,38}$/i.test(normalizedQuery);
  const sections: SearchSection[] = [];
  const warnings: string[] = [
    dictionary.searchResults.warnings.lawful,
    dictionary.searchResults.warnings.verify,
  ];
  const usedSources = new Set<string>();
  const tasks: Array<Promise<void>> = [];

  const enqueueDomainTasks = (domain: string, idPrefix: string) => {
    tasks.push(
      (async () => {
        const items = await searchRdapDomain(domain, locale);
        addSection(
          sections,
          usedSources,
          "RDAP",
          dictionary.searchResults.sections.domainRegistrationTitle,
          dictionary.searchResults.sections.domainRegistrationDescription,
          items,
        );
      })(),
    );

    tasks.push(
      (async () => {
        const items = await searchDnsRecords(domain, locale);
        addSection(
          sections,
          usedSources,
          "Cloudflare DoH",
          dictionary.searchResults.sections.dnsFootprintTitle,
          dictionary.searchResults.sections.dnsFootprintDescription,
          items,
        );
      })(),
    );

    tasks.push(
      (async () => {
        const items = await searchWebsiteMetadata(domain, locale);
        addSection(
          sections,
          usedSources,
          "Website Metadata",
          dictionary.searchResults.sections.webMetadataTitle,
          dictionary.searchResults.sections.webMetadataDescription,
          items,
        );
      })(),
    );

    tasks.push(
      (async () => {
        const items = await searchSiteOwnershipSignals(domain, locale);
        addSection(
          sections,
          usedSources,
          "Site Ownership",
          locale === "ru" ? "Владение и люди" : "Ownership and People",
          locale === "ru"
            ? "Организация, владельческие сигналы и люди, найденные на самом сайте."
            : "Organization, ownership signals, and people found directly on the site.",
          items,
        );
      })(),
    );

    tasks.push(
      (async () => {
        const items = await searchHostingIntelligence(domain, locale);
        addSection(
          sections,
          usedSources,
          "Hosting Intelligence",
          locale === "ru" ? "Хостинг и сеть" : "Hosting and Network",
          locale === "ru"
            ? "IP, ASN, префиксы и хостинг-провайдеры для внешнего контура."
            : "IP, ASN, prefixes, and hosting providers for the external surface.",
          items,
        );
      })(),
    );

    tasks.push(
      (async () => {
        const items = await searchHttpHeaders(domain, locale);
        addSection(
          sections,
          usedSources,
          "HTTP Headers",
          locale === "ru" ? "HTTP-заголовки и безопасность" : "HTTP Headers and Security",
          locale === "ru"
            ? "Server, redirect и security headers для технического профиля сайта."
            : "Server, redirect, and security headers for the site's technical profile.",
          items,
        );
      })(),
    );

    tasks.push(
      (async () => {
        const items = await searchStructuredData(domain, locale);
        addSection(
          sections,
          usedSources,
          "Structured Data",
          locale === "ru" ? "Структурированные данные сайта" : "Website Structured Data",
          locale === "ru"
            ? "JSON-LD и schema.org сигналы для entity mapping, контактов и public company context."
            : "JSON-LD and schema.org signals for entity mapping, contacts, and public company context.",
          items,
        );
      })(),
    );

    tasks.push(
      (async () => {
        const items = await searchCrawlSurface(domain, locale);
        addSection(
          sections,
          usedSources,
          "Crawl Surface",
          locale === "ru" ? "Поверхность обхода сайта" : "Crawl Surface",
          locale === "ru"
            ? "robots.txt, sitemap.xml, humans.txt и полезные пути для дальнейшего исследования."
            : "robots.txt, sitemap.xml, humans.txt, and useful paths for deeper follow-on research.",
          items,
        );
      })(),
    );

    tasks.push(
      (async () => {
        const items = await searchSitePathSignals(domain, locale);
        addSection(
          sections,
          usedSources,
          locale === "ru" ? "Исследование сайта" : "Site Discovery",
          locale === "ru" ? "Пути сайта и бизнес-сигналы" : "Site Paths and Business Signals",
          locale === "ru"
            ? "Автоматическое доисследование внутренних страниц сайта: партнёры, контакты, карьера, документация и другие полезные пути."
            : "Automatic follow-up research across internal site paths: partners, contacts, hiring, docs, and other useful pivots.",
          items,
        );
      })(),
    );

    tasks.push(
      (async () => {
        const items = await searchCertificateTransparency(domain, locale);
        addSection(
          sections,
          usedSources,
          "crt.sh",
          dictionary.searchResults.sections.transparencyTitle,
          dictionary.searchResults.sections.transparencyDescription,
          items,
        );
      })(),
    );

    tasks.push(
      (async () => {
        const items = await searchSecurityTxt(domain, locale);
        addSection(
          sections,
          usedSources,
          "security.txt",
          dictionary.searchResults.sections.securityTxtTitle,
          dictionary.searchResults.sections.securityTxtDescription,
          items,
        );
      })(),
    );

    tasks.push(
      (async () => {
        const section = await buildWaybackSection(
          domain,
          `${idPrefix}-wayback`,
          dictionary.searchResults.sections.webArchivesTitle,
          locale,
        );
        if (section) {
          usedSources.add("Wayback Machine");
          sections.push(section);
        }
      })(),
    );

    tasks.push(
      (async () => {
        const section = await buildCommonCrawlSection(
          domain,
          `${idPrefix}-common-crawl`,
          locale === "ru" ? "Common Crawl архив" : "Common Crawl Archive",
          locale,
        );
        if (section) {
          usedSources.add("Common Crawl");
          sections.push(section);
        }
      })(),
    );
  };

  if (inferredType === "phone") {
    tasks.push(
      (async () => {
        const items = await searchPhoneIntelligence(normalizedQuery, locale);
        addSection(
          sections,
          usedSources,
          "Phone Intelligence",
          dictionary.searchResults.sections.phoneIntelligenceTitle,
          dictionary.searchResults.sections.phoneIntelligenceDescription,
          items,
        );
      })(),
    );

    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      warnings.push(dictionary.searchResults.warnings.twilioMissing);
    }

    tasks.push(
      (async () => {
        const section = await buildWaybackSection(
          normalizedQuery,
          "wayback-phone",
          dictionary.searchResults.sections.archiveFootprintTitle,
          locale,
        );
        if (section) {
          usedSources.add("Wayback Machine");
          sections.push(section);
        }
      })(),
    );
  }

  if (inferredType === "email") {
    const { domain } = parseEmailQuery(normalizedQuery);

    tasks.push(
      (async () => {
        const items = await searchEmailIntelligence(normalizedQuery, locale);
        addSection(
          sections,
          usedSources,
          "Email Intelligence",
          locale === "ru" ? "Анализ email" : "Email Intelligence",
          locale === "ru"
            ? "Нормализация адреса, тип провайдера и базовые pivots по локальной части и домену."
            : "Normalized mailbox, provider type, and pivot-ready local-part/domain details.",
          items,
        );
      })(),
    );

    tasks.push(
      (async () => {
        const items = await searchGravatarProfile(normalizedQuery, locale);
        addSection(
          sections,
          usedSources,
          "Gravatar",
          locale === "ru" ? "Публичный avatar-след" : "Public Avatar Footprint",
          locale === "ru"
            ? "Проверка публичного gravatar-следа по email-хэшу."
            : "Checks for a public gravatar footprint for the mailbox hash.",
          items,
        );
      })(),
    );

    if (domain) {
      enqueueDomainTasks(domain, "email-domain");
    }
  }

  if (inferredType === "company" || (inferredType === "keyword" && !keywordLooksLikeHandle)) {
    tasks.push(
      (async () => {
        const items = await searchGleifCompanies(normalizedQuery, locale);
        addSection(
          sections,
          usedSources,
          "GLEIF",
          dictionary.searchResults.sections.registryMatchesTitle,
          dictionary.searchResults.sections.registryMatchesDescription,
          items,
        );
      })(),
    );

    tasks.push(
      (async () => {
        const items = await searchSecCompanies(normalizedQuery, locale);
        addSection(
          sections,
          usedSources,
          "SEC",
          dictionary.searchResults.sections.publicCompanySignalsTitle,
          dictionary.searchResults.sections.publicCompanySignalsDescription,
          items,
        );
      })(),
    );
  }

  if (
    inferredType === "company" ||
    inferredType === "person" ||
    (inferredType === "keyword" && !keywordLooksLikeHandle)
  ) {
    if (inferredType === "person") {
      tasks.push(
        (async () => {
          const items = await searchPersonBreakdown(normalizedQuery, locale);
          addSection(
            sections,
            usedSources,
            locale === "ru" ? "Разбор человека" : "Person Breakdown",
            locale === "ru" ? "Разбор человека" : "Person Breakdown",
            locale === "ru"
              ? "Имя, инициалы, username-варианты и логика дальнейших pivots."
              : "Name parsing, initials, username variants, and next-step pivot logic.",
            items,
          );
        })(),
      );
    }

    tasks.push(
      (async () => {
        const items = await searchWikidataEntities(normalizedQuery, locale);
        addSection(
          sections,
          usedSources,
          "Wikidata",
          dictionary.searchResults.sections.personCompanyKnowledgeTitle,
          dictionary.searchResults.sections.personCompanyKnowledgeDescription,
          items,
        );
      })(),
    );

    tasks.push(
      (async () => {
        const items = await searchWikipediaEntities(normalizedQuery, locale);
        addSection(
          sections,
          usedSources,
          "Wikipedia",
          locale === "ru" ? "Публичный энциклопедический контекст" : "Public Encyclopedia Context",
          locale === "ru"
            ? "Wikipedia-справки и публичный контекст по людям, брендам и компаниям."
            : "Wikipedia references and public context for people, brands, and companies.",
          items,
        );
      })(),
    );

    if (inferredType !== "keyword" || !keywordLooksLikeHandle) {
      tasks.push(
        (async () => {
          const items = await searchCompaniesHouse(
            normalizedQuery,
            inferredType === "person" ? "person" : "company",
            locale,
          );
          addSection(
            sections,
            usedSources,
            "Companies House",
            locale === "ru" ? "Companies House" : "Companies House",
            locale === "ru"
              ? "Официальные корпоративные и officer-записи из реестра Великобритании."
              : "Official UK registry company and officer records.",
            items,
          );
        })(),
      );

      tasks.push(
        (async () => {
          const items = await searchOpenCorporates(
            normalizedQuery,
            inferredType === "person" ? "person" : "company",
            locale,
          );
          addSection(
            sections,
            usedSources,
            "OpenCorporates",
            locale === "ru" ? "OpenCorporates" : "OpenCorporates",
            locale === "ru"
              ? "Глобальные корпоративные и officer-совпадения из OpenCorporates."
              : "Global company and officer matches from OpenCorporates.",
            items,
          );
        })(),
      );

      if (!process.env.COMPANIES_HOUSE_API_KEY) {
        warnings.push(
          locale === "ru"
            ? "Companies House подключён как официальный keyed-коннектор. Добавьте COMPANIES_HOUSE_API_KEY, чтобы включить живой поиск."
            : "Companies House is wired as an official keyed connector. Add COMPANIES_HOUSE_API_KEY to activate live search.",
        );
      }

      if (!process.env.OPENCORPORATES_API_TOKEN) {
        warnings.push(
          locale === "ru"
            ? "OpenCorporates подключён как keyed-коннектор. Добавьте OPENCORPORATES_API_TOKEN, чтобы включить живой поиск."
            : "OpenCorporates is wired as a keyed connector. Add OPENCORPORATES_API_TOKEN to activate live search.",
        );
      }
    }
  }

  if (
    inferredType === "company" ||
    inferredType === "keyword" ||
    inferredType === "username" ||
    inferredType === "person"
  ) {
    tasks.push(
      (async () => {
        const usernameQuery = canonicalizeUsername(normalizedQuery);
        const items =
          inferredType === "username"
            ? [
                ...(await searchGithubExactUser(usernameQuery, locale)),
                ...(await searchGithubUsers(usernameQuery, locale, usernameQuery)),
              ]
            : inferredType === "person"
              ? [
                  ...(await searchPersonGithubCandidates(normalizedQuery, locale)),
                  ...(await searchGithubUsers(normalizedQuery, locale)),
                ]
              : keywordLooksLikeHandle
                ? [
                    ...(await searchGithubExactUser(usernameQuery, locale)),
                    ...(await searchGithubUsers(usernameQuery, locale, usernameQuery)),
                  ]
            : await searchGithubUsers(normalizedQuery, locale);

        addSection(
          sections,
          usedSources,
          "GitHub",
          dictionary.searchResults.sections.githubProfilesTitle,
          dictionary.searchResults.sections.githubProfilesDescription,
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
            : inferredType === "username" || keywordLooksLikeHandle
              ? `user:${canonicalizeUsername(normalizedQuery)}`
            : normalizedQuery;
        const items = await searchGithubRepos(githubRepoQuery, locale);
        addSection(
          sections,
          usedSources,
          "GitHub Repository Search",
          dictionary.searchResults.sections.githubReposTitle,
          dictionary.searchResults.sections.githubReposDescription,
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
          dictionary.searchResults.sections.crunchbaseTitle,
          dictionary.searchResults.sections.crunchbaseDescription,
          items,
        );
      })(),
    );

    if (!process.env.CRUNCHBASE_API_KEY) {
      warnings.push(dictionary.searchResults.warnings.crunchbaseMissing);
    }
  }

  if (inferredType === "domain") {
    const domain = safeDomainFromQuery(normalizedQuery);
    enqueueDomainTasks(domain, "domain");
  }

  if (inferredType === "username" || keywordLooksLikeHandle || inferredType === "person") {
    const username = canonicalizeUsername(normalizedQuery);

    if (inferredType === "person") {
      tasks.push(
        (async () => {
          const items = await searchPersonVariantFootprints(normalizedQuery, locale);
          addSection(
            sections,
            usedSources,
            locale === "ru" ? "След по username" : "Username Pivot",
            locale === "ru" ? "Пивоты по имени" : "Person Username Pivots",
            locale === "ru"
              ? "Лучшие username-варианты по имени и фамилии, проверенные на публичных платформах."
              : "Top username variants derived from the person's name and checked across public platforms.",
            items,
          );
        })(),
      );
    } else {
      tasks.push(
        (async () => {
          const items = await searchUsernameFootprint(username, locale);
          addSection(
            sections,
            usedSources,
            "Username Pivot",
            dictionary.searchResults.sections.usernameFootprintTitle,
            dictionary.searchResults.sections.usernameFootprintDescription,
            items,
          );
        })(),
      );
    }

    if (inferredType === "username" || keywordLooksLikeHandle) {
      tasks.push(
        (async () => {
          const section = await buildWaybackSection(
            normalizedQuery,
            "wayback-username",
            dictionary.searchResults.sections.usernameArchiveTitle,
            locale,
          );
          if (section) {
            usedSources.add("Wayback Machine");
            sections.push(section);
          }
        })(),
      );
    }
  }

  for (const config of bridgeConfigs) {
    if (!process.env[config.urlEnv]) {
      continue;
    }

    const invocations = bridgeInvocationsForQuery(
      config,
      normalizedQuery,
      inferredType,
      keywordLooksLikeHandle,
      locale,
    );

    if (invocations.length === 0) {
      continue;
    }

    tasks.push(
      (async () => {
        const results = await Promise.allSettled(
          invocations.map((invocation) =>
            callToolBridge(config, invocation.query, invocation.inferredType, invocation),
          ),
        );

        const successfulSections = results
          .filter(
            (result): result is PromiseFulfilledResult<SearchSection | null> =>
              result.status === "fulfilled",
          )
          .map((result) => result.value)
          .filter((section): section is SearchSection => Boolean(section && section.items.length > 0));

        const mergedSection = mergeBridgeSections(config, successfulSections, locale);
        if (mergedSection) {
          usedSources.add(config.name);
          sections.push(mergedSection);
        }

        const rejection = results.find((result) => result.status === "rejected");
        if (rejection && successfulSections.length === 0) {
          throw rejection.reason;
        }
      })(),
    );
  }

  const settled = await Promise.allSettled(tasks);
  for (const result of settled) {
    if (result.status === "rejected") {
      warnings.push(
        result.reason instanceof Error
          ? result.reason.message
          : dictionary.searchResults.warnings.sourceFailed,
      );
    }
  }

  sections.push({
    id: "recommended",
    title: dictionary.searchResults.sections.recommendedTitle,
    description: dictionary.searchResults.sections.recommendedDescription,
    items: recommendedConnectors(inferredType, locale),
  });

  const finalizedSections = finalizeSearchSections(sections, locale);
  const totalResults = finalizedSections.reduce((count, section) => count + section.items.length, 0);
  const liveSourcesUsed = Array.from(usedSources);
  const signalCount = finalizedSections.filter((section) => section.id !== "recommended").length;

  return {
    query: normalizedQuery,
    inferredType,
    summary: [
      {
        label: dictionary.searchResults.summary.queryType,
        value: humanizeQueryKind(inferredType, locale),
      },
      { label: dictionary.searchResults.summary.liveSources, value: String(liveSourcesUsed.length) },
      { label: dictionary.searchResults.summary.resultCards, value: String(totalResults) },
      { label: dictionary.searchResults.summary.signalSections, value: String(signalCount) },
    ],
    warnings: uniqueValues(warnings),
    sections: finalizedSections,
    usedSources: liveSourcesUsed,
    performedAt: new Date().toISOString(),
  };
}
