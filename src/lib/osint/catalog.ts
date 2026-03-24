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
    description: "Homepage title, description, canonical, robots, sitemap, and contact hint extraction.",
    officialUrl: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta/name",
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
      { label: dictionary.searchResults.itemLabels.ticker, value: item.ticker },
      { label: dictionary.searchResults.itemLabels.cik, value: String(item.cik_str) },
    ],
  }));
}

async function searchGithubUsers(query: string, locale: Locale): Promise<SearchItem[]> {
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
        description: item.bio || dictionary.searchResults.itemText.exactGithubMatch,
        url: item.html_url,
        tags: ["github", "exact match", "username"],
        details: [
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
  const registrarName = registrar?.vcardArray?.[1]?.find((entry) => entry[0] === "fn")?.[3];
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
      ],
    },
  ];
}

async function searchDnsRecords(domain: string, locale: Locale): Promise<SearchItem[]> {
  const dictionary = getDictionary(locale);
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

async function searchWebsiteMetadata(domain: string, locale: Locale): Promise<SearchItem[]> {
  const dictionary = getDictionary(locale);
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

async function searchUsernameFootprint(
  username: string,
  locale: Locale,
): Promise<SearchItem[]> {
  const dictionary = getDictionary(locale);
  const normalized = canonicalizeUsername(username);
  const candidates = [
    { platform: "GitHub", url: `https://github.com/${normalized}` },
    { platform: "GitLab", url: `https://gitlab.com/${normalized}` },
    { platform: "Bitbucket", url: `https://bitbucket.org/${normalized}` },
    { platform: "DEV", url: `https://dev.to/${normalized}` },
    { platform: "Keybase", url: `https://keybase.io/${normalized}` },
    { platform: "Telegram", url: `https://t.me/${normalized}` },
    { platform: "Hugging Face", url: `https://huggingface.co/${normalized}` },
    { platform: "Buy Me a Coffee", url: `https://buymeacoffee.com/${normalized}` },
    { platform: "Medium", url: `https://medium.com/@${normalized}` },
    { platform: "Reddit", url: `https://www.reddit.com/user/${normalized}` },
    { platform: "npm", url: `https://www.npmjs.com/~${normalized}` },
    { platform: "Docker Hub", url: `https://hub.docker.com/u/${normalized}` },
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
      description: formatMessage(dictionary.searchResults.itemText.usernameProfileHit, {
        status: probe.status,
      }),
      url: probe.url,
      tags: ["username", "profile", "sherlock-class"],
      details: [
        {
          label: locale === "ru" ? "HTTP-статус" : "HTTP status",
          value: String(probe.status),
        },
        {
          label: dictionary.searchResults.itemLabels.waybackPages,
          value: String(probe.archivedPages || 0),
        },
      ],
    }));
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
    const { localPart, domain } = parseEmailQuery(normalizedQuery);

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

    if (localPart) {
      tasks.push(
        (async () => {
          const items = [
            ...(await searchGithubExactUser(localPart, locale)),
            ...(await searchGithubUsers(localPart, locale)),
          ];
          addSection(
            sections,
            usedSources,
            "GitHub",
            locale === "ru" ? "GitHub по локальной части email" : "GitHub from Email Local-Part",
            locale === "ru"
              ? "Публичные GitHub-профили, которые совпадают с локальной частью email."
              : "Public GitHub profiles that match the email local-part.",
            items,
          );
        })(),
      );

      tasks.push(
        (async () => {
          const items = await searchUsernameFootprint(localPart, locale);
          addSection(
            sections,
            usedSources,
            "Username Pivot",
            locale === "ru" ? "Username-pivots из email" : "Username Pivots from Email",
            locale === "ru"
              ? "Нативные публичные профили, найденные по локальной части email."
              : "Native public profile pivots found from the email local-part.",
            items,
          );
        })(),
      );
    }

    if (domain) {
      enqueueDomainTasks(domain, "email-domain");
    }
  }

  if (inferredType === "company" || inferredType === "keyword") {
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

  if (inferredType === "company" || inferredType === "person" || inferredType === "keyword") {
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
                ...(await searchGithubExactUser(normalizedQuery, locale)),
                ...(await searchGithubUsers(canonicalizeUsername(normalizedQuery), locale)),
              ]
            : inferredType === "person"
              ? [
                  ...(await searchPersonGithubCandidates(normalizedQuery, locale)),
                  ...(await searchGithubUsers(normalizedQuery, locale)),
                ]
              : keywordLooksLikeHandle
                ? [
                    ...(await searchGithubExactUser(canonicalizeUsername(normalizedQuery), locale)),
                    ...(await searchGithubUsers(normalizedQuery, locale)),
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
    if (!config.queryKinds.includes(inferredType) || !process.env[config.urlEnv]) {
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

  const totalResults = sections.reduce((count, section) => count + section.items.length, 0);
  const liveSourcesUsed = Array.from(usedSources);
  const signalCount = sections.filter((section) => section.id !== "recommended").length;

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
    warnings,
    sections,
    usedSources: liveSourcesUsed,
    performedAt: new Date().toISOString(),
  };
}
