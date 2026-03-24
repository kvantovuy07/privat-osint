export const localeCookieName = "privat-osint-locale";
export const defaultLocale = "en" as const;
export const supportedLocales = ["en", "ru"] as const;

export type Locale = (typeof supportedLocales)[number];

export function isLocale(value: string | null | undefined): value is Locale {
  return Boolean(value && supportedLocales.includes(value as Locale));
}

const dictionaries = {
  en: {
    common: {
      appName: "Privat OSINT",
      workspaceName: "Private Intelligence Workspace",
      unlimited: "unlimited",
      logOut: "Log out",
      backToLogin: "Back to login",
      lawfulDisclaimer:
        "Only lawful public sources. No bypassing access controls, private account intrusion, or hidden collection.",
      openSourceRecord: "Open source record",
      openOfficialSource: "Open official source",
      openRawSnapshot: "Open raw snapshot",
      resultsSuffix: "results",
      system: "system",
      operator: "Operator",
      monthlyUsage: "Monthly usage",
      totalUsage: "Total usage",
      created: "Created",
      expires: "Expires",
      updated: "Updated",
      actor: "Actor",
      target: "Target",
      user: "User",
      type: "Type",
      sources: "Sources",
      noLiveSources: "No live sources",
      active: "Active",
      yes: "Yes",
      no: "No",
      unknown: "Unknown",
      unavailable: "Unavailable",
      notFound: "Not found",
      notDeclared: "Not declared",
      notListed: "Not listed",
      notSpecified: "Not specified",
    },
    language: {
      label: "Language",
      en: "EN",
      ru: "RU",
    },
    nav: {
      workspace: "Search",
      sources: "Sources",
      dossiers: "Dossiers",
      admin: "Admin",
    },
    loginPage: {
      title: "Private Intelligence Workspace",
      description:
        "Search corporate entities, public code footprints, compliance sources, and B2B signals from one controlled console.",
      requestAccess: "Request access",
    },
    requestPage: {
      eyebrow: "Access Intake",
      title: "Request access",
      description:
        "Access requests are reviewed inside the administrator cabinet. Approved users can receive time-bound access and query quotas.",
    },
    loginForm: {
      login: "Login",
      password: "Password",
      enter: "Enter Console",
      authorizing: "Authorizing...",
      requestAccess: "Request access",
    },
    accessForm: {
      name: "Name",
      requestedLogin: "Requested login",
      email: "Email",
      contact: "Telegram / contact",
      company: "Company / project",
      reason: "Reason",
      comment: "Comment",
      namePlaceholder: "Name or alias",
      loginPlaceholder: "future username",
      emailPlaceholder: "name@company.com",
      contactPlaceholder: "@handle or contact",
      companyPlaceholder: "Optional",
      reasonPlaceholder: "Why access is needed",
      commentPlaceholder: "Scope, expected usage, and any extra context",
      submit: "Submit Access Request",
      submitting: "Submitting...",
    },
    workspacePage: {
      title: "Unified Search Console",
      subtitle:
        "Start with one search bar, then pivot through phone enrichment, registries, SEC references, Wayback history, DNS, certificate transparency, RDAP, SEO metadata, security.txt, GitHub footprints, and native username intelligence.",
    },
    searchConsole: {
      eyebrow: "Unified Search",
      title:
        "Search across lawful company, domain, archive, person, and username intelligence in one place.",
      description:
        "Use a company name, domain, username, email, repository, person, phone number, or keyword. The console now combines registries, public code intelligence, archives, certificate transparency, SEO metadata, domain registration data, and native Sherlock-class pivots inside one analyst workflow.",
      placeholder:
        "company / domain / username / +phone / brand / repo / person / email",
      run: "Run Search",
      running: "Searching...",
      searchPaths:
        "Native search paths: email intelligence, Gravatar, phone lookup, Wikidata, SEC, GLEIF, Companies House, OpenCorporates, Wayback, DNS, crt.sh, RDAP, security.txt, SEO, GitHub, username pivots",
      snapshot: "Search Snapshot",
      dossierEyebrow: "Dossier",
      saveTitle: "Save this investigation",
      saveDescription:
        "Store the current result set in your personal cabinet with a title and analyst note.",
      dossierPlaceholder:
        "Why this search matters, what to verify next, and how it connects to the account strategy.",
      save: "Save Dossier",
      saving: "Saving...",
    },
    sourcesPage: {
      title: "Connector Library",
      subtitle:
        "Native sources are called directly inside the workbench. Keyed and optional depth layers stay available for expansion without breaking the lawful OSINT workflow.",
      sourcesSuffix: "Sources",
      live: "live",
      ready: "ready",
      requiresKey: "requires key",
      manual: "manual",
    },
    dossiersPage: {
      title: "Saved Dossiers",
      subtitle:
        "Store the searches that matter and keep a compact analyst note beside each one for follow-up, outreach, or due diligence.",
      empty:
        "No dossiers saved yet. Run a search in the workspace and store the result from the dossier panel.",
    },
    adminPage: {
      title: "Administrator Cabinet",
      subtitle:
        "Approve or reject access requests, provision analysts, edit quotas, and watch the operational audit trail from one private console.",
      accessRequests: "Access Requests",
      pendingApproval: "Pending approval",
      noPending:
        "No pending access requests. New submissions will appear here and can be approved into real user accounts.",
      users: "Users",
      accountsAndQuotas: "Accounts and quotas",
      audit: "Audit",
      recentEvents: "Recent admin and auth events",
      usage: "Usage",
      recentSearches: "Recent searches",
      monthly: "Monthly",
      total: "Total",
    },
    adminForms: {
      createTitle: "Create Account",
      createDescription:
        "Provision analysts and viewers with quotas, expiry, and a defined role.",
      username: "Username",
      password: "Password",
      name: "Name",
      email: "Email",
      role: "Role",
      accessExpires: "Access expires",
      totalQueryLimit: "Total query limit",
      monthlyQueryLimit: "Monthly query limit",
      createUser: "Create User",
      creating: "Creating...",
      approveAsUsername: "Approve as username",
      reviewNote: "Review note",
      reviewNotePlaceholder: "Why approved or rejected",
      approveAndCreate: "Approve and Create",
      reject: "Reject",
      applying: "Applying...",
      saveChanges: "Save Changes",
      saving: "Saving...",
      temporaryPassword: "Temporary password",
      displayName: "Display name",
      optionalEmail: "optional@company.com",
      requiredForApproval: "Required for approval",
      keepCurrentPassword: "Leave blank to keep current password",
      unlimitedIfBlank: "Unlimited if blank",
      noEmail: "No email",
    },
    actionMessages: {
      usernamePasswordRequired: "Username and password are required.",
      invalidCredentials: "Invalid credentials.",
      accountDisabled: "This account is disabled.",
      accountExpired: "This account has expired.",
      requestFieldsRequired:
        "Name, requested username, email, and reason are required.",
      requestSubmitted:
        "Access request submitted. The administrator can now approve or reject it from the console.",
      queryRequired:
        "Enter a company, domain, username, repository, person, phone number, or keyword.",
      searchCompleted: "Search completed across {count} live sources.",
      searchFailed: "Search failed.",
      dossierRequired:
        "A title and search snapshot are required to save a dossier.",
      dossierSaved: "Dossier saved to your cabinet.",
      userCreated: "User {username} created.",
      userCreateFailed:
        "Could not create the user. The username or email may already exist.",
      userIdMissing: "User ID is missing.",
      userUpdated: "Updated {username}.",
      userUpdateFailed: "Could not update this user.",
      requestDecisionRequired: "Request and decision are required.",
      accessRequestNotFound: "Access request not found.",
      accessRequestRejected: "Rejected {username}.",
      approvalRequiresCredentials: "Approval requires a username and password.",
      accessRequestApproved: "Approved {username} and created the account.",
      accessRequestApprovalFailed:
        "Could not approve the request. The username or email may already exist.",
    },
    searchResults: {
      warnings: {
        lawful:
          "Results are sourced only from lawful public endpoints and curated open-source workflows.",
        verify:
          "Treat all matches as analyst leads that still need verification before any real-world action.",
        twilioMissing:
          "Twilio Lookup is available as an optional official connector. Add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to activate live phone lookup.",
        crunchbaseMissing:
          "Crunchbase is available as an optional official connector. Add CRUNCHBASE_API_KEY to activate it.",
        sourceFailed: "One of the live sources failed during execution.",
      },
      summary: {
        queryType: "Query Type",
        liveSources: "Live Sources",
        resultCards: "Result Cards",
        signalSections: "Signal Sections",
      },
      sections: {
        phoneIntelligenceTitle: "Phone Intelligence",
        phoneIntelligenceDescription:
          "Normalization, telecom metadata, and optional official lookup.",
        registryMatchesTitle: "Registry Matches",
        registryMatchesDescription:
          "Official corporate records and entity knowledge from live public registries.",
        publicCompanySignalsTitle: "Public Company Signals",
        publicCompanySignalsDescription:
          "Official SEC issuer references and ticker matches.",
        personCompanyKnowledgeTitle: "Entity Knowledge",
        personCompanyKnowledgeDescription:
          "Wikidata entity descriptions and reference pivots for companies, brands, and people.",
        githubProfilesTitle: "GitHub Profiles",
        githubProfilesDescription:
          "Public users and organizations related to the query.",
        githubReposTitle: "GitHub Repositories",
        githubReposDescription:
          "Recent public repositories and code footprints related to the query.",
        crunchbaseTitle: "Crunchbase Matches",
        crunchbaseDescription:
          "Company and people intelligence from the official Crunchbase API when configured.",
        domainRegistrationTitle: "Domain Registration",
        domainRegistrationDescription:
          "Registrar, lifecycle, and nameserver information.",
        dnsFootprintTitle: "DNS Footprint",
        dnsFootprintDescription:
          "DNS records for technical footprinting and SpiderFoot-class pivots.",
        webMetadataTitle: "Website Metadata and SEO",
        webMetadataDescription:
          "Homepage metadata, contact hints, canonical, and crawl surface indicators.",
        webArchivesTitle: "Web Archives",
        webArchivesDescription:
          "Internet Archive coverage, latest capture, and historical sample points.",
        archiveFootprintTitle: "Archive Footprint",
        usernameFootprintTitle: "Username Footprint",
        usernameFootprintDescription:
          "Native Sherlock-class profile pivots across a curated public set.",
        usernameArchiveTitle: "Username Archive Trails",
        transparencyTitle: "Certificate Transparency",
        transparencyDescription:
          "Public certificate log entries and subdomain hints from crt.sh.",
        securityTxtTitle: "Security.txt and Contact Trails",
        securityTxtDescription:
          "security.txt presence plus public contact signals found on the site.",
        recommendedTitle: "Recommended Next Sources",
        recommendedDescription:
          "Curated OSINT connectors and workflows to continue the investigation without leaving the workbench logic.",
      },
      itemLabels: {
        jurisdiction: "Jurisdiction",
        country: "Country",
        status: "Status",
        ticker: "Ticker",
        cik: "CIK",
        score: "Score",
        profile: "Profile",
        publicRepos: "Public repos",
        followers: "Followers",
        following: "Following",
        company: "Company",
        location: "Location",
        stars: "Stars",
        updated: "Updated",
        archivePages: "Archive pages",
        closestCapture: "Closest capture",
        registered: "Registered",
        expires: "Expires",
        nameservers: "Nameservers",
        recordCount: "Record count",
        sample: "Sample",
        titleLength: "Title length",
        descriptionLength: "Description length",
        canonical: "Canonical",
        primaryH1: "Primary H1",
        robotsTxt: "robots.txt",
        sitemapXml: "sitemap.xml",
        homepageEmails: "Homepage emails",
        homepagePhones: "Homepage phones",
        socialLinks: "Social links",
        contacts: "Contacts",
        policy: "Policy",
        hiring: "Hiring",
        latestEntry: "Latest entry",
        subdomains: "Subdomains",
        international: "International",
        national: "National",
        callingCode: "Calling code",
        possible: "Possible",
        valid: "Valid",
        phoneType: "Type",
        nationalFormat: "National format",
        waybackPages: "Wayback pages",
        language: "Language",
        operatorNote: "Operator note",
      },
      itemText: {
        countryUnresolved: "Country unresolved",
        phoneValid:
          "Phone number parsed and validated against numbering metadata.",
        phoneInvalid:
          "Phone number parsed but did not fully validate against numbering metadata.",
        twilioValid: "Twilio marked this number as valid.",
        twilioInvalid: "Twilio marked this number as invalid.",
        twilioNormalized: "Twilio lookup returned a normalization result.",
        exactGithubMatch: "Exact GitHub username match.",
        languageNotSpecified: "Language not specified",
        noRepositoryDescription: "No repository description",
        historicalCoverage: "Historical web archive coverage",
        archiveHistoryFound:
          "{count} archive result pages with a latest known snapshot.",
        archiveHistoryEmpty:
          "No substantial archive history was returned for this target.",
        sampleSnapshot: "Sample preserved snapshot from CDX history.",
        registrarAvailable: "Registrar data available",
        noMetaDescription: "No meta description exposed on the homepage.",
        usernameProfileHit:
          "Public profile route responded with status {status}.",
        noSecurityTxt:
          "No security.txt file was found, but the site still exposed public contact hints.",
        securityTxtPresent:
          "security.txt was found and parsed from the target site.",
        wikidataMatch: "Public Wikidata entity match.",
        crtSummary:
          "{subdomains} unique hostnames were observed in recent certificate log entries.",
        resultCardUnknown: "Unknown",
      },
    },
  },
  ru: {
    common: {
      appName: "Privat OSINT",
      workspaceName: "Приватное аналитическое рабочее пространство",
      unlimited: "без лимита",
      logOut: "Выйти",
      backToLogin: "Назад ко входу",
      lawfulDisclaimer:
        "Только законные открытые источники. Без обхода доступа, вторжения в приватные аккаунты и скрытого сбора данных.",
      openSourceRecord: "Открыть источник",
      openOfficialSource: "Открыть официальный источник",
      openRawSnapshot: "Открыть сырой снимок",
      resultsSuffix: "результатов",
      system: "система",
      operator: "Оператор",
      monthlyUsage: "Использовано за месяц",
      totalUsage: "Использовано всего",
      created: "Создан",
      expires: "Истекает",
      updated: "Обновлён",
      actor: "Кто",
      target: "Цель",
      user: "Пользователь",
      type: "Тип",
      sources: "Источники",
      noLiveSources: "Нет живых источников",
      active: "Активен",
      yes: "Да",
      no: "Нет",
      unknown: "Неизвестно",
      unavailable: "Недоступно",
      notFound: "Не найдено",
      notDeclared: "Не указано",
      notListed: "Не указано",
      notSpecified: "Не указано",
    },
    language: {
      label: "Язык",
      en: "EN",
      ru: "RU",
    },
    nav: {
      workspace: "Поиск",
      sources: "Источники",
      dossiers: "Досье",
      admin: "Админ",
    },
    loginPage: {
      title: "Приватное аналитическое рабочее пространство",
      description:
        "Ищите компании, публичные code-footprints, комплаенс-источники и B2B-сигналы из одной контролируемой консоли.",
      requestAccess: "Подать заявку на доступ",
    },
    requestPage: {
      eyebrow: "Заявка на доступ",
      title: "Подать заявку на доступ",
      description:
        "Заявки проверяются в кабинете администратора. Одобренным пользователям можно выдать срок доступа и лимиты запросов.",
    },
    loginForm: {
      login: "Логин",
      password: "Пароль",
      enter: "Войти в консоль",
      authorizing: "Авторизация...",
      requestAccess: "Подать заявку на доступ",
    },
    accessForm: {
      name: "Имя",
      requestedLogin: "Желаемый логин",
      email: "Email",
      contact: "Telegram / контакт",
      company: "Компания / проект",
      reason: "Причина",
      comment: "Комментарий",
      namePlaceholder: "Имя или псевдоним",
      loginPlaceholder: "будущий логин",
      emailPlaceholder: "name@company.com",
      contactPlaceholder: "@handle или контакт",
      companyPlaceholder: "Необязательно",
      reasonPlaceholder: "Зачем нужен доступ",
      commentPlaceholder: "Контекст, ожидаемое использование и любые детали",
      submit: "Отправить заявку",
      submitting: "Отправка...",
    },
    workspacePage: {
      title: "Единая поисковая консоль",
      subtitle:
        "Начните с одной строки поиска, а затем переходите к phone enrichment, реестрам, данным SEC, истории Wayback, DNS, certificate transparency, RDAP, SEO-метаданным, security.txt, GitHub-footprints и нативной username-разведке.",
    },
    searchConsole: {
      eyebrow: "Единый поиск",
      title:
        "Ищите законную информацию по компаниям, доменам, архивам, людям и username в одном месте.",
      description:
        "Введите название компании, домен, username, email, репозиторий, человека, номер телефона или ключевое слово. Консоль объединяет реестры, публичную code intelligence, архивы, certificate transparency, SEO-метаданные, данные о домене и нативные Sherlock-class pivots в одном аналитическом workflow.",
      placeholder:
        "company / domain / username / +phone / brand / repo / person / email",
      run: "Запустить поиск",
      running: "Идёт поиск...",
      searchPaths:
        "Нативные пути поиска: email intelligence, Gravatar, phone lookup, Wikidata, SEC, GLEIF, Companies House, OpenCorporates, Wayback, DNS, crt.sh, RDAP, security.txt, SEO, GitHub, username pivots",
      snapshot: "Снимок поиска",
      dossierEyebrow: "Досье",
      saveTitle: "Сохранить это исследование",
      saveDescription:
        "Сохраните текущий набор результатов в личном кабинете с заголовком и заметкой аналитика.",
      dossierPlaceholder:
        "Почему этот поиск важен, что проверить дальше и как это связано со стратегией аккаунта.",
      save: "Сохранить досье",
      saving: "Сохранение...",
    },
    sourcesPage: {
      title: "Библиотека коннекторов",
      subtitle:
        "Нативные источники вызываются прямо внутри workbench. Ключевые и дополнительные depth-layer источники можно расширять без поломки lawful OSINT workflow.",
      sourcesSuffix: "Источники",
      live: "live",
      ready: "ready",
      requiresKey: "нужен ключ",
      manual: "manual",
    },
    dossiersPage: {
      title: "Сохранённые досье",
      subtitle:
        "Сохраняйте важные поиски и держите рядом компактную заметку аналитика для follow-up, outreach или due diligence.",
      empty:
        "Пока нет сохранённых досье. Выполните поиск в рабочем пространстве и сохраните результат из панели досье.",
    },
    adminPage: {
      title: "Кабинет администратора",
      subtitle:
        "Одобряйте или отклоняйте заявки, создавайте аналитиков, редактируйте лимиты и следите за аудит-логом из одной приватной консоли.",
      accessRequests: "Заявки на доступ",
      pendingApproval: "Ожидают решения",
      noPending:
        "Нет ожидающих заявок. Новые отправки появятся здесь и их можно будет превратить в реальные аккаунты.",
      users: "Пользователи",
      accountsAndQuotas: "Аккаунты и лимиты",
      audit: "Аудит",
      recentEvents: "Последние admin и auth события",
      usage: "Использование",
      recentSearches: "Последние поиски",
      monthly: "Месяц",
      total: "Всего",
    },
    adminForms: {
      createTitle: "Создать аккаунт",
      createDescription:
        "Выдавайте аналитикам и viewer-пользователям роли, лимиты и срок доступа.",
      username: "Логин",
      password: "Пароль",
      name: "Имя",
      email: "Email",
      role: "Роль",
      accessExpires: "Доступ до",
      totalQueryLimit: "Общий лимит запросов",
      monthlyQueryLimit: "Лимит запросов в месяц",
      createUser: "Создать пользователя",
      creating: "Создание...",
      approveAsUsername: "Одобрить как логин",
      reviewNote: "Заметка по решению",
      reviewNotePlaceholder: "Почему одобрено или отклонено",
      approveAndCreate: "Одобрить и создать",
      reject: "Отклонить",
      applying: "Применение...",
      saveChanges: "Сохранить изменения",
      saving: "Сохранение...",
      temporaryPassword: "Временный пароль",
      displayName: "Отображаемое имя",
      optionalEmail: "optional@company.com",
      requiredForApproval: "Обязательно для одобрения",
      keepCurrentPassword: "Оставьте пустым, чтобы сохранить текущий пароль",
      unlimitedIfBlank: "Пусто = без лимита",
      noEmail: "Без email",
    },
    actionMessages: {
      usernamePasswordRequired: "Логин и пароль обязательны.",
      invalidCredentials: "Неверные учётные данные.",
      accountDisabled: "Этот аккаунт отключён.",
      accountExpired: "Срок действия этого аккаунта истёк.",
      requestFieldsRequired:
        "Имя, желаемый логин, email и причина обязательны.",
      requestSubmitted:
        "Заявка отправлена. Администратор уже может одобрить или отклонить её из консоли.",
      queryRequired:
        "Введите компанию, домен, username, репозиторий, человека, номер телефона или ключевое слово.",
      searchCompleted: "Поиск завершён по {count} живым источникам.",
      searchFailed: "Поиск не удался.",
      dossierRequired:
        "Чтобы сохранить досье, нужны заголовок и снимок поиска.",
      dossierSaved: "Досье сохранено в вашем кабинете.",
      userCreated: "Пользователь {username} создан.",
      userCreateFailed:
        "Не удалось создать пользователя. Логин или email уже могут существовать.",
      userIdMissing: "Отсутствует ID пользователя.",
      userUpdated: "Пользователь {username} обновлён.",
      userUpdateFailed: "Не удалось обновить этого пользователя.",
      requestDecisionRequired: "Нужны заявка и решение.",
      accessRequestNotFound: "Заявка на доступ не найдена.",
      accessRequestRejected: "Заявка {username} отклонена.",
      approvalRequiresCredentials: "Для одобрения нужны логин и пароль.",
      accessRequestApproved: "Заявка {username} одобрена, аккаунт создан.",
      accessRequestApprovalFailed:
        "Не удалось одобрить заявку. Логин или email уже могут существовать.",
    },
    searchResults: {
      warnings: {
        lawful:
          "Результаты собираются только из законных публичных endpoint-ов и проверенных open-source workflow.",
        verify:
          "Все совпадения нужно трактовать как аналитические зацепки и дополнительно проверять перед любыми действиями.",
        twilioMissing:
          "Twilio Lookup доступен как дополнительный официальный коннектор. Добавьте TWILIO_ACCOUNT_SID и TWILIO_AUTH_TOKEN, чтобы включить live-поиск по номеру.",
        crunchbaseMissing:
          "Crunchbase доступен как дополнительный официальный коннектор. Добавьте CRUNCHBASE_API_KEY, чтобы включить его.",
        sourceFailed: "Один из живых источников завершился ошибкой.",
      },
      summary: {
        queryType: "Тип запроса",
        liveSources: "Живые источники",
        resultCards: "Карточки",
        signalSections: "Сигнальные секции",
      },
      sections: {
        phoneIntelligenceTitle: "Анализ телефона",
        phoneIntelligenceDescription:
          "Нормализация, телеком-метаданные и дополнительный официальный lookup.",
        registryMatchesTitle: "Совпадения по реестрам",
        registryMatchesDescription:
          "Официальные корпоративные записи и сведения об entity из живых публичных реестров.",
        publicCompanySignalsTitle: "Публичные сигналы компании",
        publicCompanySignalsDescription:
          "Официальные issuer-reference и ticker-совпадения из SEC.",
        personCompanyKnowledgeTitle: "Сведения об entity",
        personCompanyKnowledgeDescription:
          "Описание сущностей из Wikidata и reference-pivots для компаний, брендов и людей.",
        githubProfilesTitle: "Профили GitHub",
        githubProfilesDescription:
          "Публичные пользователи и организации, связанные с запросом.",
        githubReposTitle: "Репозитории GitHub",
        githubReposDescription:
          "Актуальные публичные репозитории и code-footprints по запросу.",
        crunchbaseTitle: "Совпадения Crunchbase",
        crunchbaseDescription:
          "Информация о компаниях и людях из официального API Crunchbase, если он настроен.",
        domainRegistrationTitle: "Регистрация домена",
        domainRegistrationDescription:
          "Регистратор, жизненный цикл и nameserver-информация.",
        dnsFootprintTitle: "DNS-footprint",
        dnsFootprintDescription:
          "DNS-записи для technical footprinting и SpiderFoot-class pivots.",
        webMetadataTitle: "Метаданные сайта и SEO",
        webMetadataDescription:
          "Метаданные главной страницы, контактные следы, canonical и индикаторы crawl-surface.",
        webArchivesTitle: "Веб-архивы",
        webArchivesDescription:
          "Покрытие Internet Archive, ближайший capture и исторические sample-точки.",
        archiveFootprintTitle: "Архивный след",
        usernameFootprintTitle: "След по username",
        usernameFootprintDescription:
          "Нативные Sherlock-class profile pivots по отобранному набору публичных сервисов.",
        usernameArchiveTitle: "Архивные следы username",
        transparencyTitle: "Certificate Transparency",
        transparencyDescription:
          "Публичные записи certificate log и подсказки по subdomain из crt.sh.",
        securityTxtTitle: "Security.txt и контактные следы",
        securityTxtDescription:
          "Наличие security.txt плюс публичные контактные сигналы, найденные на сайте.",
        recommendedTitle: "Рекомендуемые следующие источники",
        recommendedDescription:
          "Кураторский набор OSINT-коннекторов и workflow для продолжения исследования без выхода из логики workbench.",
      },
      itemLabels: {
        jurisdiction: "Юрисдикция",
        country: "Страна",
        status: "Статус",
        ticker: "Тикер",
        cik: "CIK",
        score: "Скор",
        profile: "Профиль",
        publicRepos: "Публичные репозитории",
        followers: "Подписчики",
        following: "Подписки",
        company: "Компания",
        location: "Локация",
        stars: "Звёзды",
        updated: "Обновлено",
        archivePages: "Архивные страницы",
        closestCapture: "Ближайший capture",
        registered: "Зарегистрирован",
        expires: "Истекает",
        nameservers: "Nameserver-ы",
        recordCount: "Количество записей",
        sample: "Пример",
        titleLength: "Длина title",
        descriptionLength: "Длина description",
        canonical: "Canonical",
        primaryH1: "Основной H1",
        robotsTxt: "robots.txt",
        sitemapXml: "sitemap.xml",
        homepageEmails: "Email на сайте",
        homepagePhones: "Телефоны на сайте",
        socialLinks: "Соцссылки",
        contacts: "Контакты",
        policy: "Policy",
        hiring: "Hiring",
        latestEntry: "Последняя запись",
        subdomains: "Поддомены",
        international: "Международный формат",
        national: "Национальный формат",
        callingCode: "Код страны",
        possible: "Возможен",
        valid: "Валиден",
        phoneType: "Тип",
        nationalFormat: "Локальный формат",
        waybackPages: "Страницы Wayback",
        language: "Язык",
        operatorNote: "Заметка оператора",
      },
      itemText: {
        countryUnresolved: "Страна не определена",
        phoneValid:
          "Номер телефона распознан и валидирован по numbering metadata.",
        phoneInvalid:
          "Номер телефона распознан, но не прошёл полную валидацию по numbering metadata.",
        twilioValid: "Twilio пометил номер как валидный.",
        twilioInvalid: "Twilio пометил номер как невалидный.",
        twilioNormalized: "Twilio вернул результат нормализации номера.",
        exactGithubMatch: "Точное совпадение username в GitHub.",
        languageNotSpecified: "Язык не указан",
        noRepositoryDescription: "Описание репозитория отсутствует",
        historicalCoverage: "Историческое покрытие веб-архива",
        archiveHistoryFound:
          "Найдено {count} страниц архивной выдачи с известным последним capture.",
        archiveHistoryEmpty:
          "По этой цели не удалось получить заметную архивную историю.",
        sampleSnapshot: "Пример сохранённого снимка из CDX.",
        registrarAvailable: "Данные регистратора доступны",
        noMetaDescription:
          "На главной странице не найдена meta description.",
        usernameProfileHit:
          "Публичный маршрут профиля ответил статусом {status}.",
        noSecurityTxt:
          "Файл security.txt не найден, но сайт всё равно выдал публичные контактные следы.",
        securityTxtPresent:
          "На целевом сайте найден и разобран security.txt.",
        wikidataMatch: "Публичное совпадение сущности в Wikidata.",
        crtSummary:
          "В последних certificate log записях замечено {subdomains} уникальных hostname.",
        resultCardUnknown: "Неизвестно",
      },
    },
  },
} as const;

export type Dictionary = (typeof dictionaries)[Locale];

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export function formatMessage(
  template: string,
  values: Record<string, string | number>,
) {
  return Object.entries(values).reduce(
    (message, [key, value]) => message.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

export function getDateLocale(locale: Locale) {
  return locale === "ru" ? "ru-RU" : "en-US";
}
