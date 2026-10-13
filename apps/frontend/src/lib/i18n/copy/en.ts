import type { PublicCopy } from "../public-copy";

export const en: PublicCopy = {
  brand: "AffeXAI Cortex",
  language: {
    name: "English",
    switchTo: "Türkçe",
    switchLabel: "View this page in Turkish",
  },
  nav: {
    label: "Main menu",
    modules: "Modules",
    howItWorks: "How it works",
    earlyAccess: "Early access",
    contact: "Contact",
    login: "Log in",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    menuTitle: "Menu",
    skipToContent: "Skip to content",
  },
  requestAccess: "Request early access",
  productPhase: "Early access · by invitation",
  moduleStatus: {
    "early-access": "Early access",
    "in-development": "In development",
    roadmap: "On the roadmap",
  },
  moduleStatusNote:
    "Statuses come from the module acceptance matrix; a module only advances after passing its acceptance tests.",
  footer: {
    tagline: "One decision desk for all of your brand communication.",
    siteLabel: "Site",
    legalLabel: "Legal",
    privacy: "Privacy",
    terms: "Terms of use",
    rights: "All rights reserved.",
  },
  meta: {
    home: {
      title: "AffeXAI Cortex · Brand communication center",
      description:
        "A platform that gathers support, form, campaign and conversation signals into a shared brand memory and shows every recommendation with its evidence. In early access.",
    },
    modules: {
      title: "Modules · AffeXAI Cortex",
      description:
        "AffeXAI Cortex modules and the current status of each, from the acceptance matrix.",
    },
    howItWorks: {
      title: "How it works · AffeXAI Cortex",
      description:
        "Channels, shared memory and the decision desk: the AffeXAI Cortex learning loop and its safeguards.",
    },
    earlyAccess: {
      title: "Early access · AffeXAI Cortex",
      description:
        "Apply for the AffeXAI Cortex early access programme; how it works and what to expect.",
    },
    contact: {
      title: "Contact · AffeXAI Cortex",
      description: "Ways to reach the AffeXAI team.",
    },
  },
  cmsMeta: {
    about: {
      title: "About · AffeXAI Cortex",
      description: "About AffeXAI and AffeXAI Cortex.",
    },
    support: {
      title: "Support · AffeXAI Cortex",
      description: "AffeXAI Cortex support resources and ways to get help.",
    },
    contact: {
      title: "Contact · AffeXAI Cortex",
      description: "Ways to reach the AffeXAI team.",
    },
    products: {
      title: "Products · AffeXAI Cortex",
      description: "An overview of AffeXAI Cortex products and modules.",
    },
  },
  home: {
    title: "Your brand's next right decision, on one desk.",
    lead: "AffeXAI Cortex gathers signals from support tickets, forms, campaigns and customer conversations into a shared brand memory. The goal is not another reporting screen: it is to show every recommendation with its evidence and turn it into action once you approve.",
    secondaryCta: "See how it works",
    problem: {
      title: "Signals are scattered, so decisions rely on gut feeling",
      items: [
        {
          title: "Every channel lives on its own screen",
          body: "Support, marketing and sales see the same customer in different tools.",
        },
        {
          title: "Reports do not say what to do",
          body: "Charts describe the situation; choosing the next step is still up to you.",
        },
        {
          title: "Outcomes never reach the next decision",
          body: "Whether a campaign or a reply worked is rarely written down.",
        },
      ],
    },
    loop: {
      title: "A closed learning loop",
      intro: "Cortex promises that every step of the loop below is traceable.",
      steps: [
        {
          title: "Listen",
          body: "Events from every channel arrive in one stream.",
        },
        {
          title: "Remember",
          body: "Events are written to the shared brand memory with their source.",
        },
        {
          title: "Recommend",
          body: "A recommendation shows which records it is based on.",
        },
        {
          title: "Approve",
          body: "No action runs until an authorised person approves it.",
        },
        {
          title: "Measure and learn",
          body: "The outcome is recorded and feeds the next recommendation.",
        },
      ],
      link: "The loop in detail",
    },
    status: {
      title: "Where we are today",
      body: "The platform has {count} modules. We only count a module as progressed once its real use case, permission boundaries and persisted outcome have been tested.",
      link: "All modules and their status",
    },
    principles: {
      title: "Our principles",
      items: [
        {
          title: "Recommendations with sources",
          body: "Every recommendation links to the records it relies on.",
        },
        {
          title: "Human approval first",
          body: "Automation actions run only after an authorised person approves; nobody can approve their own request.",
        },
        {
          title: "Organisation data stays apart",
          body: "Every record belongs to its organisation, and the separation is checked with two-organisation acceptance tests.",
        },
      ],
    },
    finalCta: {
      title: "Join early access",
      body: "We are working with organisations that want to shape the platform with us.",
    },
  },
  modules: {
    title: "Modules",
    lead: "AffeXAI Cortex is made of {count} modules. Each status comes from the acceptance matrix; a module only advances after passing its acceptance tests.",
    legendTitle: "What the statuses mean",
    legend: {
      "early-access":
        "Passed acceptance tests locally; release acceptance is not complete yet.",
      "in-development": "Development and verification are under way.",
      roadmap: "Planned; development has not started yet.",
    },
    summary:
      "{early} in early access · {development} in development · {roadmap} on the roadmap",
    cta: {
      title: "Which modules matter most to you?",
      body: "Tell us in your application; real needs set the development order.",
    },
  },
  howItWorks: {
    title: "How it works",
    lead: "Cortex has three layers: channels that collect signals, a shared memory that joins them, and a decision desk that turns recommendations into action.",
    layersTitle: "Three layers",
    layers: [
      {
        title: "Channels",
        body: "Modules such as forms, support tickets, campaigns, events and chat produce business events. Every event carries the organisation it belongs to.",
      },
      {
        title: "Shared memory",
        body: "Events reach the shared memory through an event stream designed not to lose events after an outage and not to process the same event twice. The memory finds related past records with vector search.",
      },
      {
        title: "Decision desk",
        body: "A recommendation, its evidence and the suggested action appear on one screen. The action runs after an authorised approval and its outcome is recorded.",
      },
    ],
    loopTitle: "The learning loop",
    safeguards: {
      title: "Safeguards and limits",
      items: [
        "Every record carries an organisation ID; reads and writes are limited to the caller's organisation.",
        "Automation actions need a separate approval permission; nobody can approve their own request.",
        "Calls to external addresses are limited to HTTPS and approved destinations.",
        "Session and permission decisions are made on the server; the interface only reflects them.",
      ],
    },
    notYet: {
      title: "Not ready yet",
      body: "The end-to-end learning loop, from recommendation to measured outcome, has not passed acceptance testing yet. Strategy recommendations and the brand and trust indicators are on the roadmap.",
      link: "Current module status",
    },
    cta: {
      title: "Let's try the loop with your data",
      body: "In early access we set priorities together.",
    },
  },
  earlyAccess: {
    eyebrow: "Early access",
    title: "AffeXAI Cortex is currently opening by invitation",
    lead: "The platform is in early access. Modules open to organisations step by step as they pass acceptance testing.",
    pricingNote:
      "There is no public price list yet. We agree scope and terms together, based on your needs.",
    stepsTitle: "How it works",
    steps: [
      "Send your application with a short note on your organisation and main need.",
      "We get in touch to clarify the scope together.",
      "When the fit is right, we set up your workspace and invite your team.",
    ],
    cta: "Apply by email",
    ctaHint: "If you prefer not to use the form, write to us directly:",
    form: {
      title: "Application form",
      intro: "All fields except the message are required.",
      name: "Full name",
      email: "Work email",
      company: "Organisation",
      message: "Your main need",
      messageHint:
        "For example: we want to see support tickets and CRM together.",
      optional: "optional",
      honeypot: "Leave this field empty",
      privacyNote:
        "The details you send are stored to evaluate your application.",
      privacyLink: "Privacy",
      submit: "Send application",
      submitting: "Sending…",
      successTitle: "Application received",
      successBody: "Thank you. We will review your request and reply by email.",
      errorTitle: "The application could not be sent",
      errorBody:
        "Something went wrong and your details are kept. Try again or write to us by email.",
      rateLimited:
        "Too many attempts in a short time. Please try again in a few minutes.",
      unavailable:
        "The application form is not available right now. You can send your request by email.",
      errorSummary: "{count} fields need attention.",
      errors: {
        nameRequired: "Enter your full name.",
        emailRequired: "Enter your email address.",
        emailInvalid: "Enter a valid email address (e.g. name@company.com).",
        companyRequired: "Enter your organisation's name.",
        tooLong: "This field can be at most {max} characters.",
      },
    },
  },
  contact: {
    title: "Contact",
    lead: "Write to us with questions, partnership ideas or about early access.",
    emailLabel: "Email",
    earlyAccess: {
      title: "Looking for early access?",
      body: "The application form sends your request straight to our team.",
      link: "Go to the application form",
    },
    existing: {
      title: "Already have a workspace?",
      body: "Browse the help center or log in to your workspace.",
      help: "Help center",
      login: "Log in",
    },
  },
  cmsPage: {
    pendingTitle: "This page is being prepared",
    pendingBody:
      "The content has not been published yet. Please check back soon.",
    errorTitle: "This page cannot be opened right now",
    errorBody:
      "Something went wrong while loading the content. Please try again shortly.",
    backHome: "Back to home",
    editorLink: "Open in content management",
  },
  legalDraft: {
    title: "Draft text",
    body: "This page is a sample draft and is not binding for AffeXAI. It is hidden from search engines until the final text is published.",
  },
  notFound: {
    code: "404",
    title: "We could not find that page",
    body: "The link may have changed or the page may have been removed.",
    backHome: "Back to home",
    contact: "Write to us",
  },
  help: {
    emptyTitle: "No articles yet",
    emptyBody:
      "The help center is being prepared. Meanwhile you can send your question to support.",
    errorTitle: "The help center could not be loaded",
    errorBody: "There was a connection problem. Please try again.",
    retry: "Try again",
    noResultsTitle: "No results",
    noResultsBody: "Try a different word or clear the filter.",
    clearSearch: "Clear search",
    contactSupport: "Write to support",
  },
};
