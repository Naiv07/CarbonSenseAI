import express, { Request, Response, NextFunction } from "express";
import path from "path";
import Groq from "groq-sdk";
import { getRank } from "./src/lib/rank";
import { computeEmissions } from "./src/lib/emissions";
import type { TelemetryState, EmissionsBreakdown, EmissionSnapshot, Achievement, Challenge, ActivityLog, UserLocation } from "./src/types";
import dotenv from "dotenv";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";

interface AuthenticatedRequest extends Request {
  uid?: string;
}

dotenv.config();

const app = express();
app.set("trust proxy", 1); // Railway runs behind a reverse proxy
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Security headers
// crossOriginOpenerPolicy disabled — signInWithPopup requires the popup window
// to communicate back to the opener; COOP: same-origin silently breaks that.
app.use(helmet({
  crossOriginOpenerPolicy: { policy: "unsafe-none" },
  strictTransportSecurity: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'self'"],
      scriptSrc:      ["'self'", "https://apis.google.com", "https://accounts.google.com"],
      styleSrc:       ["'self'", "'unsafe-inline'"],
      imgSrc:         ["'self'", "data:", "https://lh3.googleusercontent.com"],
      connectSrc:     [
        "'self'",
        "https://identitytoolkit.googleapis.com",
        "https://securetoken.googleapis.com",
        "https://www.googleapis.com",
        "https://accounts.google.com",
      ],
      fontSrc:        ["'self'"],
      frameSrc:       ["https://accounts.google.com", "https://carbonsense-e9991.firebaseapp.com"],
      objectSrc:      ["'none'"],
      baseUri:        ["'self'"],
      formAction:     ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
}));

// Restrict browser feature access
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=(), payment=(), usb=()");
  next();
});

// Gzip compression
app.use(compression());

app.use(express.json({ limit: "32kb" }));

// Rate limiters for AI endpoints (expensive LLM API calls)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests — please wait a moment." },
});

// General API limiter (disabled during tests to avoid rate-limit false positives)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.VITEST ? 10000 : 120,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", apiLimiter);
app.use("/api/ai/commander", aiLimiter);
app.use("/api/daily-insight", aiLimiter);

// --- Firebase Admin Auth (optional — skipped if FIREBASE_SERVICE_ACCOUNT not set) ---
let adminAuth: import("firebase-admin/auth").Auth | null = null;
(async () => {
  const svcAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!svcAccount) return;
  try {
    const { initializeApp, getApps, cert } = await import("firebase-admin/app");
    const { getAuth } = await import("firebase-admin/auth");
    if (!getApps().length) {
      initializeApp({ credential: cert(JSON.parse(svcAccount) as object) });
    }
    adminAuth = getAuth();
    if (process.env.NODE_ENV !== "production") console.log("Firebase Admin initialised.");
  } catch (e) {
    console.error("Firebase Admin init failed:", e);
  }
})();

async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!adminAuth || process.env.VITEST) return next(); // auth disabled in local dev and tests
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const token = header.slice(7);
    const decoded = await adminAuth.verifyIdToken(token);
    (req as AuthenticatedRequest).uid = decoded.uid;
    next();
  } catch (err) {
    console.error("[Auth] verifyIdToken failed:", (err as Error).message ?? err);
    res.status(401).json({ error: "Invalid token" });
  }
}

// Initialize Groq Client
let groqClient: Groq | null = null;
function getGroq(): Groq | null {
  if (!groqClient && process.env.GROQ_API_KEY) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

// Data types imported from ./src/types (single source of truth for client & server)

import { CHALLENGE_REFRESH_MS, ACTIVITY_LOG_MAX, EMISSION_HISTORY_MAX, HISTORY_SNAPSHOT_INTERVAL_MS } from "./src/lib/constants";

/** Format current time as HH:MM:SS */
function timestamp(): string {
  return new Date().toTimeString().split(" ")[0];
}

// --- In-memory State ---
let userLocation: UserLocation = { name: "", country: "", city: "" };

let userTelemetry: TelemetryState = {
  mileage: 12500,
  commuteFrequency: "DAILY",
  vehicleType: "INTERNAL_COMBUSTION_MEDIUM",
  flightsShortHaul: 0,
  flightsLongHaul: 0,
  utilityBill: 185,
  energySource: "mixed",
  heatingType: "none",
  category: "TRANSPORT",
  meatIntake: "DAILY",
  foodWaste: "medium",
  recycledPercent: 40,
  shoppingFrequency: "average",
  newElectronics: 0,
  clothingType: "none",
};

let challenges: Challenge[] = [
  {
    id: "oper-zero-grid",
    title: "OPER_ZERO_GRID",
    description: "Offset your monthly grid consumption by investing in community wind projects.",
    xp: 500,
    status: "AVAILABLE",
    category: "ENERGY",
    xpReward: 500,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCEt1grbf_Yb95wstRr_Bw2z1yybN5XgYYFqEP81PKRdSOtWohaTGSmyPF0OCDh0_WvMHbAmDFiCfqNFMxEdg_EnklZj3i1ZPTNhPBDYIgmL8NhUlqj9HJW6f10pXFO-0Xids0VOduMx0wF8arHiBwPGeLGGJjd1ZwWCmi_9YCLOph3JDqsk2JSdtemrX2-uM_qwmhjkASEwgltmmMORoYzhuXJK4HtAPiHKB6X-isQ8oUt1sNW1tN2BGLcVsPJuajQhwcvIZZdMGWm",
    tasks: [
      { id: "ozg-t1", label: "Sign up for a community wind or solar plan", completed: false },
      { id: "ozg-t2", label: "Log your current monthly energy bill as a baseline", completed: false },
      { id: "ozg-t3", label: "Track your kWh usage for one full week", completed: false },
      { id: "ozg-t4", label: "Share the challenge with one friend or neighbour", completed: false },
    ],
  },
  {
    id: "bio-shield-alpha",
    title: "BIO_SHIELD_ALPHA",
    description: "Support massive reforestation in the Amazon basin. Target: 10k Hectares.",
    xp: 850,
    status: "AVAILABLE",
    category: "REFORESTATION",
    urgency: "URGENT: 48H REMAINING",
    xpReward: 850,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAhw0533HcolCMG68x8paQLanAnKH9csTFN5YQKyXCAHDfTeNOjVrI_Q-m1C4qw-npF27O82gDhARdro7TQDnz0b4d-WaX7XuX2msV_woaiBUHB3Jngm6Yk0YcSlB6BwZ8aBeSqpmUx84xwswf2rQ82dVOspBwVYlZ8lBfvETaCPg79DoToIhhf8p2Hj7vx09eu2IcYGutmq6xR1RUavy8tnR0pRJLSGhUng5tHQiGjH1ve7HPdEwXF_IrUHOXVbsMwLEGT6rqxmGDo",
    tasks: [
      { id: "bsa-t1", label: "Research and choose a verified reforestation charity", completed: false },
      { id: "bsa-t2", label: "Make a contribution to plant at least 12 trees", completed: false },
      { id: "bsa-t3", label: "Post about your contribution on social media", completed: false },
    ],
  },
  {
    id: "urban-refit-x",
    title: "URBAN_REFIT_X",
    description: "Pilot program for retrofitting low-income housing with smart carbon scrubbers.",
    xp: 1200,
    status: "LOCKED",
    category: "RETROFIT",
    urgency: "TIER_3: COMMANDER ONLY",
    xpReward: 1200,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBzlZYc-KyO1YrgvSoIJj3YZ2fU7kpz2L-9s68I3eQcHTNbxS7c0joara5U5HEgdwobhltvtNqZCEpU01eG-sF_5K-tKcfPOKmVGAWiWqoDFrJwxMcgcVhRp4TMjSMbFGz-MsvjiM4jUYvBB_IUwlJfUYX2wcTK45CBsB0KYcPPcf9fI1CfMYzYs44HKeFMfjyrYXhi2-HNM3cMO5z3ygVHSi-Y9Ve2EzQMhxlfcV5_4FhlUBSY0BHslkZMD43PTRoSwFYD_FPPg-_G",
    tasks: [
      { id: "urx-t1", label: "Complete a housing retrofit feasibility survey", completed: false },
      { id: "urx-t2", label: "Connect with a local housing authority or NGO", completed: false },
      { id: "urx-t3", label: "Identify 3 candidate properties in your area", completed: false },
      { id: "urx-t4", label: "Submit a funding application or grant proposal", completed: false },
    ],
  },
  {
    id: "transit-shift",
    title: "TRANSIT_SHIFT",
    description: "Replace 3 days of personal vehicle commutes per week with public transit or cycling.",
    xp: 400,
    status: "AVAILABLE",
    category: "TRANSPORT",
    xpReward: 400,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCEt1grbf_Yb95wstRr_Bw2z1yybN5XgYYFqEP81PKRdSOtWohaTGSmyPF0OCDh0_WvMHbAmDFiCfqNFMxEdg_EnklZj3i1ZPTNhPBDYIgmL8NhUlqj9HJW6f10pXFO-0Xids0VOduMx0wF8arHiBwPGeLGGJjd1ZwWCmi_9YCLOph3JDqsk2JSdtemrX2-uM_qwmhjkASEwgltmmMORoYzhuXJK4HtAPiHKB6X-isQ8oUt1sNW1tN2BGLcVsPJuajQhwcvIZZdMGWm",
    tasks: [
      { id: "ts-t1", label: "Plan your first car-free commute route", completed: false },
      { id: "ts-t2", label: "Complete 3 car-free commute days this week", completed: false },
      { id: "ts-t3", label: "Download a local transit or bike-share app", completed: false },
      { id: "ts-t4", label: "Log your CO2 saved compared to driving", completed: false },
    ],
  },
  {
    id: "zero-plastic-cycle",
    title: "ZERO_PLASTIC_CYCLE",
    description: "Eliminate single-use plastics across all household consumption zones for 30 days.",
    xp: 350,
    status: "AVAILABLE",
    category: "WASTE",
    urgency: "CHALLENGE: 14D WINDOW",
    xpReward: 350,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAhw0533HcolCMG68x8paQLanAnKH9csTFN5YQKyXCAHDfTeNOjVrI_Q-m1C4qw-npF27O82gDhARdro7TQDnz0b4d-WaX7XuX2msV_woaiBUHB3Jngm6Yk0YcSlB6BwZ8aBeSqpmUx84xwswf2rQ82dVOspBwVYlZ8lBfvETaCPg79DoToIhhf8p2Hj7vx09eu2IcYGutmq6xR1RUavy8tnR0pRJLSGhUng5tHQiGjH1ve7HPdEwXF_IrUHOXVbsMwLEGT6rqxmGDo",
    tasks: [
      { id: "zpc-t1", label: "Audit your kitchen for single-use plastic items", completed: false },
      { id: "zpc-t2", label: "Replace plastic bags with reusable alternatives", completed: false },
      { id: "zpc-t3", label: "Switch to a reusable water bottle and coffee cup", completed: false },
      { id: "zpc-t4", label: "Go 7 consecutive days without buying single-use plastic", completed: false },
    ],
  },
  {
    id: "home-audit-pro",
    title: "HOME_AUDIT_PRO",
    description: "Complete an energy efficiency audit and implement at least 2 recommended optimizations.",
    xp: 600,
    status: "AVAILABLE",
    category: "ENERGY",
    xpReward: 600,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCzqTRPDZEtIiwFPcHVwkwRSnyHhtKodv6uMRK1nrO4wvvw6c57jO7nK3s6afGRxSmkTpUhAVXQzooq4vXkzw9gITewx6Cb2oQZE84MROiFiv7QSKoZd6YDN6txHrMn8hufR9-EY35lncm3J0l9FzsLvkIbgH5g7dmTcSMUk3b-bpSwqO0uwUy_CjQFmV1EHDhUKS-TN7r6DclCZKUCXn5fdWxH6ohjRD6kyKh0GLzfzbkwfFW5QwjhVPenNDu_42j97ANlom9SS1CN",
    tasks: [
      { id: "hap-t1", label: "Book or complete a home energy audit", completed: false },
      { id: "hap-t2", label: "Switch all bulbs to LED lighting", completed: false },
      { id: "hap-t3", label: "Install a smart thermostat or programmable timer", completed: false },
      { id: "hap-t4", label: "Seal draughts around windows and doors", completed: false },
    ],
  },
];

let activityLogs: ActivityLog[] = [
  { time: "14:22:05", text: "LOG: COMMUTE_DETECTED", impact: "+2.4kg", type: "LOG" },
  { time: "12:10:48", text: "INIT: RENEWABLE_SWAP", impact: "-1.8kg", type: "INIT" },
  { time: "09:15:33", text: "DATA: GROCERY_INPUT", impact: "+12.1kg", type: "DATA" },
  { time: "08:00:00", text: "SYS: MISSION_REFRESH", impact: "OK", type: "SYS" },
  { time: "23:59:00", text: "LOG: DAILY_SUMMARY", impact: "-5.2kg", type: "LOG" },
];

let activeSimulation = { plantBased: true, solarConversion: false, evMobility: true };

let appSettings = { safetyThreshold: 5.1, scrubberEfficiency: 85, audioFeedback: true };

let emissionHistory: EmissionSnapshot[] = [];
let streakData = { days: 1, lastDate: new Date().toDateString() };

let lastChallengeRefresh: number = Date.now();

let dailyInsightCache: { date: string; text: string; city: string } | null = null;

let commanderRecommendation = {
  warning: "Your transport emissions are the biggest part of your footprint. Even switching to remote work a few days a week could make a noticeable difference.",
  action: "REMOTE",
  projectedSaving: "-0.4t",
  sector: "Transport",
  status: "ACTIVE",
};

// --- Emissions Calculation ---
// Delegates to the shared pure function in src/lib/emissions.ts (single source of truth).
// skipSimulation = true → raw habits only (used for scoring)
// skipSimulation = false → includes what-if simulation (used for Insights display)
function calculateEmissions(skipSimulation = false): EmissionsBreakdown {
  return computeEmissions(userTelemetry, skipSimulation ? undefined : activeSimulation);
}

// Baseline locked from initial telemetry (no simulations)
let baselineEmissions: number = calculateEmissions(true).total;

// --- Localisation context for personalised challenge descriptions ---
function getLocalContext(country: string) {
  type Ctx = { transit: string; solar: string; ev: string; diet: string; waste: string };
  const map: Record<string, Ctx> = {
    "India":          { transit: "metro rail or auto-rickshaw",            solar: "PM Surya Ghar rooftop solar scheme",       ev: "FAME II EV subsidy",               diet: "traditional dal, sabzi & plant-based staples",      waste: "Swachh Bharat composting programme" },
    "United States":  { transit: "light rail, subway or BRT",             solar: "IRA 30% solar tax credit",                 ev: "$7,500 federal EV tax credit",     diet: "plant-forward US diet",                             waste: "EPA WasteWise municipal recycling" },
    "United Kingdom": { transit: "Tube, National Rail or local bus",      solar: "Smart Export Guarantee (SEG)",             ev: "Plug-in Car Grant",                diet: "UK plant-based market",                             waste: "kerbside recycling scheme" },
    "Germany":        { transit: "S-Bahn, U-Bahn or DB Regio",           solar: "EEG solar feed-in tariff",                 ev: "KfW EV charging subsidy",          diet: "German vegetarian cuisine",                         waste: "Grüner Punkt dual-system recycling" },
    "France":         { transit: "TGV, RER or city bus network",          solar: "EDF Obligation d'Achat solar scheme",      ev: "bonus écologique EV rebate",       diet: "traditional French vegetable-forward cuisine",      waste: "tri-sélectif municipal sorting system" },
    "Netherlands":    { transit: "NS train, tram or OV-chipkaart bus",   solar: "Salderingsregeling net metering",          ev: "MIA/Vamil EV fiscal incentives",  diet: "Dutch plant-rich diet",                             waste: "statiegeld deposit-return scheme" },
    "Japan":          { transit: "Shinkansen or city metro network",      solar: "FIT solar feed-in scheme",                 ev: "Clean Energy Vehicle subsidy",     diet: "traditional Japanese fish & vegetable diet",        waste: "strict municipal waste classification" },
    "China":          { transit: "HSR, metro or BRT network",             solar: "national rooftop solar subsidy",           ev: "national NEV purchase subsidy",    diet: "vegetable-forward Chinese cuisine",                 waste: "mandatory waste classification system" },
    "South Korea":    { transit: "KTX, metro or city bus",               solar: "RPS solar incentive scheme",               ev: "K-EV subsidy programme",           diet: "traditional Korean vegetable-forward cuisine",      waste: "volume-based waste fee system" },
    "Australia":      { transit: "metro, bus or tram network",            solar: "STC small-scale technology certificates",  ev: "state EV rebate programme",        diet: "plant-forward Australian diet",                     waste: "National Packaging Targets recycling" },
    "Canada":         { transit: "SkyTrain, GO Transit or city bus",     solar: "Canada Greener Homes solar grant",         ev: "$5,000 federal iZEV rebate",       diet: "plant-forward Canadian diet",                       waste: "provincial blue box recycling programme" },
    "Brazil":         { transit: "BRT or metro network",                  solar: "ANEEL distributed solar generation",       ev: "national EV incentive programme",  diet: "traditional plant-rich Brazilian cuisine",          waste: "PNRS solid waste programme" },
    "Singapore":      { transit: "MRT or SBS Transit bus",               solar: "SolarNova solar PV scheme",                ev: "EV Early Adoption Incentive",      diet: "hawker centre plant-based options",                 waste: "NEA zero-waste programme" },
    "Nigeria":        { transit: "BRT or danfo bus network",              solar: "national off-grid solar initiative",       ev: "emerging EV transition fund",      diet: "traditional Nigerian vegetable-rich cuisine",       waste: "Lagos waste management programme" },
    "South Africa":   { transit: "Gautrain or MyCiTi BRT",               solar: "NERSA net metering scheme",                ev: "emerging EV policy framework",     diet: "traditional South African plant-rich cuisine",      waste: "national paper & packaging recycling" },
    "Indonesia":      { transit: "Transjakarta BRT or commuter rail",    solar: "national PLTS rooftop programme",          ev: "national EV roadmap subsidy",      diet: "traditional Indonesian vegetable-forward cuisine",  waste: "Adipura national waste programme" },
    "Pakistan":       { transit: "urban bus rapid transit",              solar: "AEDB net metering scheme",                 ev: "national EV policy incentive",     diet: "traditional daal & vegetable cuisine",              waste: "solid waste management programme" },
    "Mexico":         { transit: "Metro, Metrobús or SITEUR BRT",        solar: "CRE interconnection solar tariff",         ev: "green licence plate EV benefit",   diet: "traditional plant-rich Mexican cuisine",            waste: "Programa de Gestión Integral de Residuos" },
    "Turkey":         { transit: "metro, metrobüs or city bus",          solar: "YEKDEM solar feed-in scheme",              ev: "ÖTV exemption for EVs",            diet: "traditional Turkish meze & vegetable diet",         waste: "municipal selective collection" },
    "Egypt":          { transit: "Cairo Metro or minibus network",        solar: "FIT solar scheme",                         ev: "emerging EV incentive fund",       diet: "traditional Egyptian ful & vegetable diet",         waste: "national solid waste programme" },
    "Saudi Arabia":   { transit: "Riyadh Metro or city bus",             solar: "NEOM & Vision 2030 solar projects",        ev: "national EV strategy subsidy",     diet: "traditional Saudi plant-rich cuisine",              waste: "National Waste Management Centre" },
    "UAE":            { transit: "Dubai Metro or RTA bus",               solar: "Shams Dubai net metering scheme",          ev: "free public EV charging policy",   diet: "traditional Emirati plant-forward cuisine",         waste: "UAE Green Agenda 2030 recycling" },
    "Sweden":         { transit: "SL, SJ regional rail or city bus",     solar: "Investeringsstöd solar subsidy",           ev: "bonus-malus EV registration rebate","diet": "New Nordic vegetarian cuisine",                  waste: "Producentansvar packaging recycling" },
    "Norway":         { transit: "NSB, T-bane or city tram",             solar: "Enova solar support scheme",               ev: "world-leading EV VAT exemption",   diet: "Nordic vegetable-forward diet",                     waste: "Grønt Punkt deposit-return scheme" },
    "Switzerland":    { transit: "SBB rail, tram or PostBus",            solar: "ProKilowatt solar subsidy",                ev: "cantonal EV incentives",           diet: "Swiss vegetarian & plant-forward cuisine",          waste: "Separatsammlung recycling system" },
    "Poland":         { transit: "PKP, SKM or city tram",                solar: "Mój Prąd solar subsidy",                   ev: "national EV charging infrastructure fund","diet": "traditional Polish vegetable-forward cuisine",  waste: "GPSO selective waste collection" },
    "Spain":          { transit: "RENFE, Metro or city bus",             solar: "IDAE solar self-consumption scheme",       ev: "MOVES III EV purchase incentive",  diet: "traditional Mediterranean plant-forward diet",      waste: "SIGRE selective packaging collection" },
    "Italy":          { transit: "Trenitalia, Metro or city bus",        solar: "Conto Energia solar incentive",            ev: "Ecobonus EV purchase incentive",   diet: "traditional Mediterranean plant-forward diet",      waste: "Raccolta Differenziata recycling scheme" },
    "Portugal":       { transit: "CP rail, Metro or Carris bus",         solar: "SERUP solar self-consumption scheme",      ev: "Fundo Ambiental EV subsidy",       diet: "traditional Portuguese plant-forward cuisine",      waste: "SPV Valorização de Embalagens" },
    "Denmark":        { transit: "DSB, S-tog or city bus",               solar: "Solcelleanlæg net metering scheme",        ev: "registration tax EV exemption",    diet: "New Nordic vegetarian cuisine",                     waste: "Affaldsdatasystemet recycling scheme" },
    "Philippines":    { transit: "LRT, MRT or jeepney e-PUV network",   solar: "net metering scheme (ERC)",                ev: "EV incentives under RA 11697",     diet: "traditional Filipino plant-based dishes",           waste: "RA 9003 ecological solid waste programme" },
    "Vietnam":        { transit: "metro or BRT network",                 solar: "FIT solar programme",                      ev: "national EV incentive scheme",     diet: "traditional Vietnamese vegetable-forward cuisine",  waste: "national solid waste management" },
    "Thailand":       { transit: "BTS Skytrain, MRT or city bus",        solar: "Net Energy Metering scheme",               ev: "EV30@30 incentive programme",      diet: "traditional Thai vegetable & tofu cuisine",         waste: "Pollution Control Department recycling" },
    "Kenya":          { transit: "Nairobi BRT or matatu network",        solar: "KPLC net metering scheme",                 ev: "emerging EV policy framework",     diet: "traditional Kenyan plant-forward cuisine",           waste: "National Solid Waste Management Strategy" },
    "Argentina":      { transit: "SUBE metro or Metrobus BRT",          solar: "Programa RenovAr solar scheme",            ev: "national EV tax exemption",        diet: "Argentine plant-forward cuisine",                   waste: "Basura Cero recycling initiative" },
    "Chile":          { transit: "Metro de Santiago or Transantiago",    solar: "net billing solar scheme",                 ev: "national EV incentive",            diet: "traditional Chilean plant-rich cuisine",            waste: "Ley REP extended producer responsibility" },
    "Colombia":       { transit: "Transmilenio BRT or Metro Medellín",  solar: "net metering solar scheme (CREG)",         ev: "national EV incentive programme",  diet: "traditional Colombian plant-forward cuisine",       waste: "Política de Gestión Integral de Residuos" },
    "New Zealand":    { transit: "Auckland AT Metro or Metlink",         solar: "solar buy-back scheme",                    ev: "Clean Car Discount scheme",        diet: "plant-forward New Zealand diet",                    waste: "national product stewardship programme" },
  };
  return map[country] ?? { transit: "local public transit", solar: "national solar incentive programme", ev: "government EV subsidy", diet: "local plant-based cuisine", waste: "municipal recycling programme" };
}

const CHALLENGE_IMG = {
  transport: "https://lh3.googleusercontent.com/aida-public/AB6AXuCEt1grbf_Yb95wstRr_Bw2z1yybN5XgYYFqEP81PKRdSOtWohaTGSmyPF0OCDh0_WvMHbAmDFiCfqNFMxEdg_EnklZj3i1ZPTNhPBDYIgmL8NhUlqj9HJW6f10pXFO-0Xids0VOduMx0wF8arHiBwPGeLGGJjd1ZwWCmi_9YCLOph3JDqsk2JSdtemrX2-uM_qwmhjkASEwgltmmMORoYzhuXJK4HtAPiHKB6X-isQ8oUt1sNW1tN2BGLcVsPJuajQhwcvIZZdMGWm",
  energy:    "https://lh3.googleusercontent.com/aida-public/AB6AXuCzqTRPDZEtIiwFPcHVwkwRSnyHhtKodv6uMRK1nrO4wvvw6c57jO7nK3s6afGRxSmkTpUhAVXQzooq4vXkzw9gITewx6Cb2oQZE84MROiFiv7QSKoZd6YDN6txHrMn8hufR9-EY35lncm3J0l9FzsLvkIbgH5g7dmTcSMUk3b-bpSwqO0uwUy_CjQFmV1EHDhUKS-TN7r6DclCZKUCXn5fdWxH6ohjRD6kyKh0GLzfzbkwfFW5QwjhVPenNDu_42j97ANlom9SS1CN",
  food:      "https://lh3.googleusercontent.com/aida-public/AB6AXuAhw0533HcolCMG68x8paQLanAnKH9csTFN5YQKyXCAHDfTeNOjVrI_Q-m1C4qw-npF27O82gDhARdro7TQDnz0b4d-WaX7XuX2msV_woaiBUHB3Jngm6Yk0YcSlB6BwZ8aBeSqpmUx84xwswf2rQ82dVOspBwVYlZ8lBfvETaCPg79DoToIhhf8p2Hj7vx09eu2IcYGutmq6xR1RUavy8tnR0pRJLSGhUng5tHQiGjH1ve7HPdEwXF_IrUHOXVbsMwLEGT6rqxmGDo",
  retrofit:  "https://lh3.googleusercontent.com/aida-public/AB6AXuBzlZYc-KyO1YrgvSoIJj3YZ2fU7kpz2L-9s68I3eQcHTNbxS7c0joara5U5HEgdwobhltvtNqZCEpU01eG-sF_5K-tKcfPOKmVGAWiWqoDFrJwxMcgcVhRp4TMjSMbFGz-MsvjiM4jUYvBB_IUwlJfUYX2wcTK45CBsB0KYcPPcf9fI1CfMYzYs44HKeFMfjyrYXhi2-HNM3cMO5z3ygVHSi-Y9Ve2EzQMhxlfcV5_4FhlUBSY0BHslkZMD43PTRoSwFYD_FPPg-_G",
};

// Generates a personalised challenge list based on user telemetry and location.
// Preserves joinedAt / status for IDs that already exist in `existing`.
function generatePersonalizedChallenges(
  telemetry: TelemetryState,
  location: UserLocation,
  existing: Challenge[]
): Challenge[] {
  const ctx = getLocalContext(location.country);
  const place = location.city || location.country || "your region";
  const raw = calculateEmissions(true);

  type Candidate = Omit<Challenge, "joinedAt" | "progress"> & { priority: number };
  const pool: Candidate[] = [];

  // ── TRANSPORT ────────────────────────────────────────────────────────────
  if (telemetry.vehicleType !== "ELECTRIC_BEV" && telemetry.commuteFrequency !== "REMOTE") {
    pool.push({
      id: "transit-commute",
      title: "TRANSIT_SHIFT",
      description: `You commute ${telemetry.commuteFrequency.toLowerCase()} by car in ${place}. Swap 3+ days per week to ${ctx.transit} — each car-free day saves ~0.3 kg CO2. In ${location.country || "your country"}, transit riders average 2.6× lower transport emissions.`,
      xp: 400, xpReward: 400, status: "AVAILABLE",
      category: "TRANSPORT",
      image: CHALLENGE_IMG.transport,
      priority: telemetry.commuteFrequency === "DAILY" ? 88 : 60,
      tasks: [
        { id: "tc-t1", label: "Plan your first car-free commute route", completed: false },
        { id: "tc-t2", label: "Complete 3 car-free commute days this week", completed: false },
        { id: "tc-t3", label: "Download a local transit or bike-share app", completed: false },
        { id: "tc-t4", label: "Log your CO2 saved compared to driving", completed: false },
      ],
    });
  }

  if (telemetry.vehicleType !== "ELECTRIC_BEV" && telemetry.vehicleType !== "HYBRID_PLUG_IN" && telemetry.mileage > 5000) {
    const saving = Math.round(raw.transport * 0.7 * 10) / 10;
    pool.push({
      id: "ev-adoption",
      title: "EV_CONVERT",
      description: `At ${telemetry.mileage.toLocaleString()} km/year your vehicle emits ${raw.transport}t CO2e. Switch to an EV using ${ctx.ev} and cut transport emissions by ~${saving}t/year. ${location.country ? `${location.country} has expanding public charging networks` : "Charging infrastructure is growing fast"}.`,
      xp: 750, xpReward: 750, status: "AVAILABLE",
      category: "TRANSPORT",
      urgency: "HIGH_IMPACT: ~70% TRANSPORT REDUCTION",
      image: CHALLENGE_IMG.transport,
      priority: telemetry.mileage > 15000 ? 85 : telemetry.mileage > 8000 ? 72 : 50,
      tasks: [
        { id: "ev-t1", label: "Research EV models suited to your driving needs", completed: false },
        { id: "ev-t2", label: "Find 3 public charging locations near your home or work", completed: false },
        { id: "ev-t3", label: "Calculate your annual fuel savings from switching to EV", completed: false },
        { id: "ev-t4", label: "Book a test drive at a local EV dealership", completed: false },
      ],
    });
  }

  if (telemetry.flightsLongHaul > 1 || telemetry.flightsShortHaul > 2) {
    const flightCO2 = (telemetry.flightsLongHaul * 1.56 + telemetry.flightsShortHaul * 0.18).toFixed(1);
    pool.push({
      id: "flight-neutral",
      title: "FLIGHT_NEUTRAL",
      description: `Your ${telemetry.flightsLongHaul} long-haul and ${telemetry.flightsShortHaul} short-haul flights generate ~${flightCO2}t CO2e. Commit to offsetting via verified carbon removal and replacing 1 short-haul with rail this year.`,
      xp: 550, xpReward: 550, status: "AVAILABLE",
      category: "TRANSPORT",
      urgency: "AVIATION: HIGH-ALTITUDE IMPACT",
      image: CHALLENGE_IMG.transport,
      priority: Math.min(90, (telemetry.flightsLongHaul * 18 + telemetry.flightsShortHaul * 4)),
      tasks: [
        { id: "fn-t1", label: "Calculate your total flight emissions for the year", completed: false },
        { id: "fn-t2", label: "Purchase verified carbon offsets for past flights", completed: false },
        { id: "fn-t3", label: "Book one rail journey instead of a short-haul flight", completed: false },
      ],
    });
  }

  // ── ENERGY ───────────────────────────────────────────────────────────────
  if (telemetry.energySource !== "renewable") {
    const saving = telemetry.energySource === "fossil"
      ? Math.round(raw.energy * 0.7 * 10) / 10
      : Math.round(raw.energy * 0.35 * 10) / 10;
    pool.push({
      id: "solar-switch",
      title: "SOLAR_GRID_DEPLOY",
      description: `Your ${telemetry.energySource} energy mix in ${place} contributes ${raw.energy}t CO2e/year. Enrol in ${ctx.solar} to switch to clean solar — cutting energy emissions by ~${saving}t annually. ${location.country ? `${location.country} receives strong solar irradiance year-round.` : ""}`,
      xp: 650, xpReward: 650, status: "AVAILABLE",
      category: "ENERGY",
      urgency: telemetry.energySource === "fossil" ? "CRITICAL: FOSSIL_GRID_ACTIVE" : undefined,
      image: CHALLENGE_IMG.energy,
      priority: telemetry.energySource === "fossil" ? 92 : 68,
      tasks: [
        { id: "ss-t1", label: "Get a solar feasibility quote for your home", completed: false },
        { id: "ss-t2", label: "Sign up for a green energy tariff with your utility", completed: false },
        { id: "ss-t3", label: "Check available government solar incentives in your area", completed: false },
        { id: "ss-t4", label: "Track your energy usage for a full billing cycle", completed: false },
      ],
    });
  }

  if (telemetry.heatingType === "gas" || telemetry.heatingType === "oil") {
    const heatSaving = telemetry.heatingType === "oil" ? "1.2" : "0.8";
    pool.push({
      id: "heat-pump-upgrade",
      title: "HEAT_PUMP_PROTOCOL",
      description: `Your ${telemetry.heatingType} heating in ${place} emits ~${heatSaving}t CO2e/year. Heat pumps deliver 3-4× more warmth per energy unit and pair perfectly with ${ctx.solar}. Typical payback in ${location.country || "temperate climates"}: 5-7 years.`,
      xp: 700, xpReward: 700, status: "AVAILABLE",
      category: "ENERGY",
      image: CHALLENGE_IMG.energy,
      priority: telemetry.heatingType === "oil" ? 78 : 62,
      tasks: [
        { id: "hp-t1", label: "Get a heat pump assessment from a certified installer", completed: false },
        { id: "hp-t2", label: "Research available heat pump grants or subsidies", completed: false },
        { id: "hp-t3", label: "Lower your thermostat by 1°C for the next month", completed: false },
      ],
    });
  }

  pool.push({
    id: "home-audit-pro",
    title: "HOME_AUDIT_PRO",
    description: `Complete an energy efficiency audit for your home in ${place} and implement 2+ optimisations — smart thermostats, LED lighting, draft sealing. Households in ${location.country || "your region"} typically cut energy use 15-30% from these low-cost actions.`,
    xp: 600, xpReward: 600, status: "AVAILABLE",
    category: "ENERGY",
    image: CHALLENGE_IMG.energy,
    priority: 38,
    tasks: [
      { id: "hap-t1", label: "Book or complete a home energy audit", completed: false },
      { id: "hap-t2", label: "Switch all bulbs to LED lighting", completed: false },
      { id: "hap-t3", label: "Install a smart thermostat or programmable timer", completed: false },
      { id: "hap-t4", label: "Seal draughts around windows and doors", completed: false },
    ],
  });

  // ── FOOD ─────────────────────────────────────────────────────────────────
  if (telemetry.meatIntake === "DAILY") {
    const plantSaving = Math.round(raw.food * 0.72 * 10) / 10;
    pool.push({
      id: "plant-based-30",
      title: "PLANT_PROTOCOL_30",
      description: `Daily meat adds ~${raw.food.toFixed(1)}t CO2e/year to your footprint. Take the 30-day plant-based challenge inspired by ${ctx.diet}. Eliminating meat cuts food emissions by ~${plantSaving}t — one of the highest-leverage personal actions in ${place}.`,
      xp: 500, xpReward: 500, status: "AVAILABLE",
      category: "FOOD",
      urgency: "DIET: HIGHEST REDUCTION POTENTIAL",
      image: CHALLENGE_IMG.food,
      priority: 86,
      tasks: [
        { id: "pb-t1", label: "Cook your first fully plant-based meal", completed: false },
        { id: "pb-t2", label: "Complete 7 consecutive plant-based days", completed: false },
        { id: "pb-t3", label: "Find 3 plant-based protein sources you enjoy", completed: false },
        { id: "pb-t4", label: "Complete all 30 days of the plant-based challenge", completed: false },
      ],
    });
    pool.push({
      id: "meatless-days",
      title: "MEATLESS_OPS",
      description: `Step down from daily meat by committing to 4 meat-free days per week. ${ctx.diet} makes this easy to sustain. Expect food-sector emissions to drop from ${raw.food.toFixed(1)}t toward ${(raw.food * 0.5).toFixed(1)}t CO2e/year.`,
      xp: 350, xpReward: 350, status: "AVAILABLE",
      category: "FOOD",
      image: CHALLENGE_IMG.food,
      priority: 72,
      tasks: [
        { id: "md-t1", label: "Plan your 4 meat-free days for the week", completed: false },
        { id: "md-t2", label: "Complete your first full meat-free day", completed: false },
        { id: "md-t3", label: "Maintain 4 meat-free days for 2 consecutive weeks", completed: false },
      ],
    });
  } else if (telemetry.meatIntake === "WEEKLY") {
    pool.push({
      id: "meatless-days",
      title: "MEATLESS_OPS",
      description: `Increase your plant-forward days to 5 per week. Leveraging ${ctx.diet} traditions, you can halve your remaining food-sector CO2 impact in ${place} without sacrificing flavour or nutrition.`,
      xp: 350, xpReward: 350, status: "AVAILABLE",
      category: "FOOD",
      image: CHALLENGE_IMG.food,
      priority: 52,
      tasks: [
        { id: "md-t1", label: "Plan your 5 meat-free days for the week", completed: false },
        { id: "md-t2", label: "Complete your first full meat-free day", completed: false },
        { id: "md-t3", label: "Maintain 5 meat-free days for 2 consecutive weeks", completed: false },
      ],
    });
  }

  if (telemetry.foodWaste === "high" || telemetry.foodWaste === "medium") {
    pool.push({
      id: "food-waste-zero",
      title: "ZERO_FOOD_WASTE",
      description: `Food waste causes 8% of global emissions. Set up home composting via ${ctx.waste} in ${place} and plan weekly meals to cut your current ${telemetry.foodWaste}-waste profile to near-zero within 30 days.`,
      xp: 300, xpReward: 300, status: "AVAILABLE",
      category: "FOOD",
      image: CHALLENGE_IMG.food,
      priority: telemetry.foodWaste === "high" ? 63 : 38,
      tasks: [
        { id: "fwz-t1", label: "Set up a compost bin or find a local composting scheme", completed: false },
        { id: "fwz-t2", label: "Plan your weekly meals to use up perishables first", completed: false },
        { id: "fwz-t3", label: "Go one full week without throwing away food", completed: false },
      ],
    });
  }

  // ── WASTE ────────────────────────────────────────────────────────────────
  if (telemetry.recycledPercent < 60) {
    pool.push({
      id: "zero-plastic-cycle",
      title: "ZERO_PLASTIC_CYCLE",
      description: `Boost recycling from ${telemetry.recycledPercent}% toward 75%+ in 30 days using ${ctx.waste}. Eliminate single-use plastics at home. This directly reduces your waste-sector emissions of ${raw.waste.toFixed(2)}t CO2e in ${place}.`,
      xp: 350, xpReward: 350, status: "AVAILABLE",
      category: "WASTE",
      urgency: telemetry.recycledPercent < 20 ? "CRITICAL: LOW_RECYCLE_RATE" : "CHALLENGE: 14D WINDOW",
      image: CHALLENGE_IMG.food,
      priority: telemetry.recycledPercent < 20 ? 76 : 52,
      tasks: [
        { id: "zpc-t1", label: "Audit your kitchen for single-use plastic items", completed: false },
        { id: "zpc-t2", label: "Replace plastic bags with reusable alternatives", completed: false },
        { id: "zpc-t3", label: "Switch to a reusable water bottle and coffee cup", completed: false },
        { id: "zpc-t4", label: "Go 7 consecutive days without buying single-use plastic", completed: false },
      ],
    });
  }

  if (telemetry.shoppingFrequency === "frequent") {
    pool.push({
      id: "conscious-consumer",
      title: "CONSCIOUS_CONSUMER",
      description: `Frequent shopping adds ~${raw.shopping.toFixed(1)}t CO2e to your annual footprint. Commit to a 30-day "buy nothing new" protocol — repair, borrow, rent instead. Targets: 0.6-0.9t savings, aligned with ${location.country || "your region"}'s circular economy goals.`,
      xp: 420, xpReward: 420, status: "AVAILABLE",
      category: "WASTE",
      image: CHALLENGE_IMG.food,
      priority: 58,
      tasks: [
        { id: "cc-t1", label: "Identify 3 items you want to buy and try borrowing instead", completed: false },
        { id: "cc-t2", label: "Repair something instead of replacing it", completed: false },
        { id: "cc-t3", label: "Complete 30 days without buying anything non-essential", completed: false },
      ],
    });
  }

  // ── REFORESTATION (global, always included) ───────────────────────────────
  pool.push({
    id: "bio-shield-alpha",
    title: "BIO_SHIELD_ALPHA",
    description: `Support verified reforestation of critical biodiversity zones near ${location.country || "your region"}. Each verified contribution plants 12 trees sequestering ~0.1t CO2e over 10 years. Current target: 10,000 hectares restored.`,
    xp: 850, xpReward: 850, status: "AVAILABLE",
    category: "REFORESTATION",
    urgency: "URGENT: 48H REMAINING",
    image: CHALLENGE_IMG.food,
    priority: 48,
    tasks: [
      { id: "bsa-t1", label: "Research and choose a verified reforestation charity", completed: false },
      { id: "bsa-t2", label: "Make a contribution to plant at least 12 trees", completed: false },
      { id: "bsa-t3", label: "Post about your contribution on social media", completed: false },
    ],
  });

  // ── SELECT TOP 5 by priority ──────────────────────────────────────────────
  pool.sort((a, b) => b.priority - a.priority);
  const top5 = pool.slice(0, 5);

  // Preserve status/joinedAt/tasks from existing challenges where IDs match
  const existingMap = new Map(existing.map(c => [c.id, c]));
  const result: Challenge[] = top5.map(({ priority: _p, ...c }) => {
    const prev = existingMap.get(c.id);
    return prev ? { ...c, status: prev.status, joinedAt: prev.joinedAt, tasks: prev.tasks ?? c.tasks } : c;
  });

  // ── TIER 3 LOCKED (always appended) ──────────────────────────────────────
  const prevUrban = existingMap.get("urban-refit-x");
  result.push({
    id: "urban-refit-x",
    title: "URBAN_REFIT_X",
    description: `Pilot programme retrofitting low-income housing in ${place} with smart carbon scrubbers and passive cooling systems. Each retrofitted unit reduces neighbourhood emissions by an estimated 2.8t CO2e — scaling this city-wide transforms ${location.country || "urban"} carbon trajectories.`,
    xp: 1200, xpReward: 1200,
    status: prevUrban?.status === "AVAILABLE" ? "AVAILABLE" : "LOCKED",
    urgency: prevUrban?.status === "AVAILABLE" ? "TIER_3: UNLOCKED" : "TIER_3: COMMANDER ONLY",
    category: "RETROFIT",
    image: CHALLENGE_IMG.retrofit,
    tasks: prevUrban?.tasks ?? [
      { id: "urx-t1", label: "Complete a housing retrofit feasibility survey", completed: false },
      { id: "urx-t2", label: "Connect with a local housing authority or NGO", completed: false },
      { id: "urx-t3", label: "Identify 3 candidate properties in your area", completed: false },
      { id: "urx-t4", label: "Submit a funding application or grant proposal", completed: false },
    ],
  });

  return result;
}

// --- History ---
function initHistory() {
  const current = calculateEmissions(true).total;
  const now = Date.now();
  emissionHistory = [];
  for (let i = 8; i > 0; i--) {
    emissionHistory.push({
      label: `W-${i}`,
      total: Number(Math.max(0.5, current + i * 0.07).toFixed(1)),
      timestamp: now - i * 7 * 24 * 60 * 60 * 1000,
    });
  }
  emissionHistory.push({ label: "NOW", total: Number(current.toFixed(1)), timestamp: now });
}
initHistory();

function pushHistorySnapshot(label: string) {
  const current = calculateEmissions(true).total;
  emissionHistory.push({ label, total: Number(current.toFixed(1)), timestamp: Date.now() });
  if (emissionHistory.length > EMISSION_HISTORY_MAX) emissionHistory = emissionHistory.slice(-EMISSION_HISTORY_MAX);
}

// --- Streak ---
function updateStreak() {
  const today = new Date().toDateString();
  if (streakData.lastDate === today) return;
  const yesterday = new Date(Date.now() - HISTORY_SNAPSHOT_INTERVAL_MS).toDateString();
  streakData.days = streakData.lastDate === yesterday ? streakData.days + 1 : 1;
  streakData.lastDate = today;
}

// --- Achievements ---
function calculateAchievements(): Achievement[] {
  return [
    {
      id: "zero-waste",
      title: "ZERO_WASTE_WARRIOR",
      description: "Recycle over 70% of waste",
      unlocked: userTelemetry.recycledPercent >= 70,
      icon: "recycle",
    },
    {
      id: "solar-convert",
      title: "SOLAR_CONVERT",
      description: "Switch to renewable energy",
      unlocked: userTelemetry.energySource === "renewable",
      icon: "sun",
    },
    {
      id: "plant-patrol",
      title: "PLANT_PATROL",
      description: "Adopt a plant-based diet",
      unlocked: userTelemetry.meatIntake === "VEGAN" || userTelemetry.meatIntake === "VEGETARIAN",
      icon: "leaf",
    },
    {
      id: "flight-free",
      title: "FLIGHT_FREE_ZONE",
      description: "Zero flights this year",
      unlocked: userTelemetry.flightsShortHaul === 0 && userTelemetry.flightsLongHaul === 0,
      icon: "plane",
    },
    {
      id: "ev-patrol",
      title: "EV_PATROL",
      description: "Drive electric or hybrid",
      unlocked: userTelemetry.vehicleType === "ELECTRIC_BEV" || userTelemetry.vehicleType === "HYBRID_PLUG_IN",
      icon: "zap",
    },
    {
      id: "remote-deploy",
      title: "REMOTE_DEPLOY",
      description: "Work remotely (zero commute)",
      unlocked: userTelemetry.commuteFrequency === "REMOTE",
      icon: "wifi",
    },
  ];
}

// --- Activity Log (capped at 100 entries to prevent unbounded growth) ---
function logActivity(entry: ActivityLog) {
  activityLogs.unshift(entry);
  if (activityLogs.length > ACTIVITY_LOG_MAX) activityLogs.length = ACTIVITY_LOG_MAX;
}

// --- Challenge Progress ---
function computeChallengeProgress(c: Challenge): number {
  if (c.status === "COMPLETED") return 100;
  if (c.status !== "JOINED") return 0;
  if (c.tasks && c.tasks.length > 0) {
    const done = c.tasks.filter(t => t.completed).length;
    return Math.round((done / c.tasks.length) * 100);
  }
  // fallback: time-based (30-day window)
  if (!c.joinedAt) return 0;
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  return Math.min(100, Math.round(((Date.now() - c.joinedAt) / THIRTY_DAYS_MS) * 100));
}

// --- Mission Score & Rank ---
// Score starts at 50 (at baseline). Reduce emissions → score rises. Increase → score drops.
// Each joined challenge adds +3 bonus points.
function calculateMissionScore(): number {
  if (baselineEmissions === 0) return 50;
  const rawTotal = calculateEmissions(true).total;
  const baseScore = 50 + ((baselineEmissions - rawTotal) / baselineEmissions) * 50;
  const joinedCount = challenges.filter(c => c.status === "JOINED" || c.status === "COMPLETED").length;
  const challengeBonus = joinedCount * 3;
  const score = Math.max(0, Math.min(100, Math.round(baseScore + challengeBonus)));

  // Auto-unlock Tier 3 challenge when score >= 60
  const urbanRefit = challenges.find(c => c.id === "urban-refit-x");
  if (urbanRefit && urbanRefit.status === "LOCKED" && score >= 60) {
    urbanRefit.status = "AVAILABLE";
    urbanRefit.urgency = "TIER_3: UNLOCKED";
    logActivity({
      time: timestamp(),
      text: "SYS: URBAN_REFIT_X TIER_3 ACCESS UNLOCKED",
      impact: "UNLOCKED",
      type: "SYS",
    });
  }

  return score;
}

// getRank imported from src/lib/rank.ts

// --- Input validation helpers ---
function pickEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

/** Coerce to string, strip surrounding whitespace, enforce max length. */
function clampStr(val: unknown, maxLen: number): string {
  if (typeof val !== "string") return "";
  return val.trim().slice(0, maxLen);
}

// --- API Endpoints ---

// Protect all state-mutating endpoints when Firebase Admin is configured
app.use("/api", (req: Request, res: Response, next: NextFunction) => {
  if (req.method === "GET") return next();
  return requireAuth(req, res, next);
});

app.get("/api/telemetry", (_req: Request, res: Response) => {
  updateStreak();
  const breakdown = calculateEmissions();

  // Apply scrubber efficiency — reduces waste emissions by the configured percentage
  const scrubberReduction = appSettings.scrubberEfficiency / 100;
  const adjustedBreakdown: EmissionsBreakdown = {
    ...breakdown,
    waste: Number((breakdown.waste * (1 - scrubberReduction)).toFixed(2)),
    total: Number((breakdown.transport + breakdown.energy + breakdown.food +
      breakdown.waste * (1 - scrubberReduction) + breakdown.shopping).toFixed(1)),
  };

  // Safety threshold alert — flag when total exceeds the user-configured limit
  const exceedsThreshold = adjustedBreakdown.total > appSettings.safetyThreshold;

  const missionScore = calculateMissionScore();
  const rank = getRank(missionScore);
  res.json({
    telemetry: userTelemetry,
    breakdown: adjustedBreakdown,
    activeSimulation,
    commanderRecommendation,
    missionScore,
    rank,
    userLocation,
    emissionHistory,
    achievements: calculateAchievements(),
    streak: streakData.days,
    baselineEmissions,
    settings: { safetyThreshold: appSettings.safetyThreshold, scrubberEfficiency: appSettings.scrubberEfficiency },
    alerts: exceedsThreshold ? [{ type: "THRESHOLD", message: `Total emissions (${adjustedBreakdown.total}t) exceed safety threshold (${appSettings.safetyThreshold}t)` }] : [],
  });
});

app.post("/api/onboarding", (req: Request, res: Response) => {
  const {
    name, country, city,
    mileage, commuteFrequency, vehicleType, flightsShortHaul, flightsLongHaul,
    utilityBill, energySource, heatingType,
    meatIntake, foodWaste,
    shoppingFrequency, newElectronics, clothingType,
    recycledPercent,
  } = req.body;

  // Update user identity (clamp string inputs to prevent oversized payloads)
  userLocation = {
    name: clampStr(name, 100) || "COMMANDER",
    country: clampStr(country, 100),
    city: clampStr(city, 100),
  };

  // Update all telemetry fields (clamp numeric inputs to valid ranges)
  if (mileage !== undefined) userTelemetry.mileage = Math.max(0, Number(mileage));
  if (commuteFrequency !== undefined) userTelemetry.commuteFrequency = commuteFrequency;
  if (vehicleType !== undefined) userTelemetry.vehicleType = vehicleType;
  if (flightsShortHaul !== undefined) userTelemetry.flightsShortHaul = Math.max(0, Number(flightsShortHaul));
  if (flightsLongHaul !== undefined) userTelemetry.flightsLongHaul = Math.max(0, Number(flightsLongHaul));
  if (utilityBill !== undefined) userTelemetry.utilityBill = Math.max(0, Number(utilityBill));
  if (energySource !== undefined) userTelemetry.energySource = energySource;
  if (heatingType !== undefined) userTelemetry.heatingType = heatingType;
  if (meatIntake !== undefined) userTelemetry.meatIntake = meatIntake;
  if (foodWaste !== undefined) userTelemetry.foodWaste = foodWaste;
  if (shoppingFrequency !== undefined) userTelemetry.shoppingFrequency = shoppingFrequency;
  if (newElectronics !== undefined) userTelemetry.newElectronics = Math.max(0, Number(newElectronics));
  if (clothingType !== undefined) userTelemetry.clothingType = clothingType;
  if (recycledPercent !== undefined) userTelemetry.recycledPercent = Math.min(100, Math.max(0, Number(recycledPercent)));

  // Re-lock baseline from the new onboarding data (no simulations)
  baselineEmissions = calculateEmissions(true).total;
  initHistory();
  updateStreak();

  // Regenerate challenges personalised to this user's lifestyle and location
  challenges = generatePersonalizedChallenges(userTelemetry, userLocation, challenges);

  const breakdown = calculateEmissions();
  const missionScore = calculateMissionScore();
  const rank = getRank(missionScore);

  logActivity({
    time: timestamp(),
    text: `INIT: COMMANDER_${(name || "UNKNOWN").toUpperCase().replace(/\s+/g, "_")}_ONBOARDED`,
    impact: `${breakdown.total}t CO2e`,
    type: "INIT",
  });

  res.json({ success: true, breakdown, missionScore, rank, userLocation, emissionHistory, achievements: calculateAchievements(), streak: streakData.days, baselineEmissions });
});

app.post("/api/telemetry", (req: Request, res: Response) => {
  const {
    mileage, commuteFrequency, vehicleType, flightsShortHaul, flightsLongHaul,
    utilityBill, energySource, heatingType,
    meatIntake, foodWaste,
    shoppingFrequency, newElectronics, clothingType,
    recycledPercent,
  } = req.body;

  if (mileage !== undefined) {
    userTelemetry.mileage = Math.max(0, Number(mileage));
    logActivity({ time: timestamp(), text: `DATA: ANNUAL_MILEAGE_UPDATE -> ${mileage} KM`, impact: "CALC", type: "DATA" });
  }
  if (commuteFrequency !== undefined) {
    userTelemetry.commuteFrequency = pickEnum(commuteFrequency, ["DAILY", "WEEKLY", "REMOTE"] as const, "DAILY");
    logActivity({ time: timestamp(), text: `SYS: COMMUTE_CYCLES -> ${userTelemetry.commuteFrequency}`, impact: "OK", type: "SYS" });
  }
  if (vehicleType !== undefined) {
    userTelemetry.vehicleType = pickEnum(vehicleType, [
      "INTERNAL_COMBUSTION_SMALL","INTERNAL_COMBUSTION_MEDIUM","INTERNAL_COMBUSTION_LARGE",
      "HYBRID_PLUG_IN","ELECTRIC_BEV","NONE",
    ] as const, "INTERNAL_COMBUSTION_MEDIUM");
  }
  if (flightsShortHaul !== undefined) {
    userTelemetry.flightsShortHaul = Math.max(0, Number(flightsShortHaul));
    logActivity({ time: timestamp(), text: `DATA: FLIGHT_SHORT_HAUL -> ${flightsShortHaul}`, impact: "CALC", type: "DATA" });
  }
  if (flightsLongHaul !== undefined) {
    userTelemetry.flightsLongHaul = Math.max(0, Number(flightsLongHaul));
    logActivity({ time: timestamp(), text: `DATA: FLIGHT_LONG_HAUL -> ${flightsLongHaul}`, impact: "CALC", type: "DATA" });
  }
  if (utilityBill !== undefined) {
    userTelemetry.utilityBill = Math.max(0, Number(utilityBill));
    logActivity({ time: timestamp(), text: `DATA: UTILITY_BILL -> $${utilityBill}`, impact: "CALC", type: "DATA" });
  }
  if (energySource !== undefined) {
    userTelemetry.energySource = pickEnum(energySource, ["renewable","mixed","fossil"] as const, "mixed");
    logActivity({ time: timestamp(), text: `SYS: ENERGY_SOURCE -> ${userTelemetry.energySource.toUpperCase()}`, impact: "OK", type: "SYS" });
  }
  if (heatingType !== undefined) userTelemetry.heatingType = pickEnum(heatingType, ["gas","electric","oil","heatpump","none"] as const, "none");
  if (meatIntake !== undefined) userTelemetry.meatIntake = pickEnum(meatIntake, ["DAILY","WEEKLY","VEGETARIAN","VEGAN"] as const, "WEEKLY");
  if (foodWaste !== undefined) userTelemetry.foodWaste = pickEnum(foodWaste, ["low","medium","high"] as const, "medium");
  if (shoppingFrequency !== undefined) userTelemetry.shoppingFrequency = pickEnum(shoppingFrequency, ["minimal","average","frequent"] as const, "average");
  if (newElectronics !== undefined) userTelemetry.newElectronics = Math.max(0, Math.min(20, Number(newElectronics)));
  if (clothingType !== undefined) userTelemetry.clothingType = pickEnum(clothingType, ["fast-fashion","sustainable","none"] as const, "none");
  if (recycledPercent !== undefined) userTelemetry.recycledPercent = Math.min(100, Math.max(0, Number(recycledPercent)));

  pushHistorySnapshot("DATA_UPDATE");
  updateStreak();

  const breakdown = calculateEmissions();
  const missionScore = calculateMissionScore();
  const rank = getRank(missionScore);
  res.json({ success: true, breakdown, missionScore, rank, emissionHistory, achievements: calculateAchievements(), streak: streakData.days });
});

app.get("/api/logs", (_req: Request, res: Response) => {
  res.json(activityLogs);
});

app.get("/api/settings", (_req: Request, res: Response) => {
  res.json(appSettings);
});

app.post("/api/settings", (req: Request, res: Response) => {
  const { safetyThreshold, scrubberEfficiency, audioFeedback } = req.body;
  if (safetyThreshold !== undefined) {
    const val = Number(safetyThreshold);
    if (!isNaN(val)) appSettings.safetyThreshold = Number(Math.min(9, Math.max(3, val)).toFixed(1));
  }
  if (scrubberEfficiency !== undefined) {
    const val = Number(scrubberEfficiency);
    if (!isNaN(val)) appSettings.scrubberEfficiency = Math.min(100, Math.max(50, Math.round(val)));
  }
  if (audioFeedback !== undefined) appSettings.audioFeedback = audioFeedback === true;
  res.json({ success: true, settings: appSettings });
});

app.get("/api/challenges", (_req: Request, res: Response) => {
  let refreshed = false;
  if (Date.now() - lastChallengeRefresh >= CHALLENGE_REFRESH_MS) {
    challenges = generatePersonalizedChallenges(userTelemetry, userLocation, challenges);
    lastChallengeRefresh = Date.now();
    refreshed = true;
  }
  const withProgress = challenges.map(c => ({ ...c, progress: computeChallengeProgress(c) }));
  res.json({ challenges: withProgress, refreshed });
});

app.post("/api/challenges/join", (req: Request, res: Response) => {
  const { id } = req.body;
  if (!id || typeof id !== "string" || id.length > 100) {
    res.status(400).json({ error: "Missing required field: id" });
    return;
  }
  const challenge = challenges.find((c) => c.id === id);
  if (challenge && challenge.status !== "LOCKED") {
    if (challenge.status === "JOINED") {
      challenge.status = "AVAILABLE";
      delete challenge.joinedAt;
    } else {
      challenge.status = "JOINED";
      challenge.joinedAt = Date.now();
    }
    logActivity({
      time: timestamp(),
      text: `INIT: ${challenge.title} -> ${challenge.status === "JOINED" ? "ENGAGED" : "VACATE"}`,
      type: "INIT",
      impact: challenge.status === "JOINED" ? "ACTIVE" : "RESET",
    });
    const missionScore = calculateMissionScore();
    const rank = getRank(missionScore);
    const withProgress = challenges.map(c => ({ ...c, progress: computeChallengeProgress(c) }));
    res.json({ success: true, challenges: withProgress, missionScore, rank });
  } else {
    res.status(404).json({ error: "Challenge not found" });
  }
});

app.post("/api/challenges/:id/tasks/:taskId/toggle", (req: Request, res: Response) => {
  const { id: challengeId, taskId } = req.params;
  if (challengeId.length > 100 || taskId.length > 100) {
    res.status(400).json({ error: "Invalid parameters" });
    return;
  }
  const challenge = challenges.find(c => c.id === challengeId);
  if (!challenge || !challenge.tasks) { res.status(404).json({ error: "Challenge or tasks not found" }); return; }
  const task = challenge.tasks.find(t => t.id === taskId);
  if (!task) { res.status(404).json({ error: "Task not found" }); return; }
  task.completed = !task.completed;
  task.completedAt = task.completed ? Date.now() : undefined;
  res.json({ task, progress: computeChallengeProgress(challenge) });
});

app.post("/api/simulation", (req: Request, res: Response) => {
  const { plantBased, solarConversion, evMobility } = req.body;
  if (plantBased !== undefined) activeSimulation.plantBased = plantBased;
  if (solarConversion !== undefined) activeSimulation.solarConversion = solarConversion;
  if (evMobility !== undefined) activeSimulation.evMobility = evMobility;
  logActivity({ time: timestamp(), text: "SYS: SIMULATION_MATRIX_RECALIBRATED", impact: "STABLE", type: "SYS" });
  const simBreakdown = calculateEmissions();
  const simScore = calculateMissionScore();
  const simRank = getRank(simScore);
  res.json({ success: true, breakdown: simBreakdown, activeSimulation, missionScore: simScore, rank: simRank, achievements: calculateAchievements(), streak: streakData.days });
});

app.post("/api/commander-action", (req: Request, res: Response) => {
  const { flag } = req.body;
  if (flag === "deploy") {
    commanderRecommendation.status = "DEPLOYED";
    activeSimulation.evMobility = true;
    logActivity({ time: timestamp(), text: "INIT: BIKE_SWAP_PROTOCOL_EXECUTED", impact: "-4.2kg", type: "INIT" });
  } else {
    commanderRecommendation.status = "DISMISSED";
  }
  res.json({ success: true, commanderRecommendation });
});

app.post("/api/ai/commander", async (req: Request, res: Response) => {
  const promptText = clampStr(req.body?.customPrompt, 500);
  const client = getGroq();
  const currentStats = calculateEmissions();
  const score = calculateMissionScore();

  const contextDescription = `
    You are CarbonSense AI — a caring, personal carbon advisor who genuinely wants to help this person reduce their environmental impact. Think of yourself as a warm, knowledgeable friend, not a formal assistant or report system.

    The user's current annual carbon footprint:
    - Transport: ${currentStats.transport}t CO₂e (${userTelemetry.flightsShortHaul} short-haul and ${userTelemetry.flightsLongHaul} long-haul flights/yr, commute: ${userTelemetry.commuteFrequency})
    - Energy: ${currentStats.energy}t CO₂e (source: ${userTelemetry.energySource}, heating: ${userTelemetry.heatingType})
    - Food: ${currentStats.food}t CO₂e (diet: ${userTelemetry.meatIntake}, food waste: ${userTelemetry.foodWaste})
    - Waste: ${currentStats.waste}t CO₂e (recycling: ${userTelemetry.recycledPercent}%)
    - Shopping: ${currentStats.shopping}t CO₂e
    - Total: ${currentStats.total}t CO₂e/year — the global average is ~4t and a sustainable target is ~2.5t
    - Climate Score: ${score}/100

    Your tone rules (follow these closely):
    - Write like you're chatting with a friend — warm, natural, and real
    - Express genuine concern when emissions are high (e.g. "That's quite a lot — the good news is there's a lot of room to improve")
    - Be encouraging and supportive, never alarming or preachy
    - Pick ONE specific, realistic action tied to their biggest emission area
    - Use "you" and "your" throughout — make it personal and direct
    - NEVER use military terms, commands, status reports, or formal phrasing
    - Do NOT start your response with "I" — start with something about their situation or a direct observation
    - Keep your response under 80 words

    If the user asks a direct question, answer it naturally using their data as context.
  `;

  try {
    if (client) {
      const response = await client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        max_tokens: 300,
        temperature: 0.75,
        messages: [
          { role: "system", content: contextDescription },
          { role: "user", content: promptText || "Give me one practical tip to reduce my carbon footprint based on my current data." },
        ],
      });
      const responseText = response.choices[0]?.message?.content ?? "I'm ready to help! Ask me anything about your carbon footprint.";
      commanderRecommendation.warning = responseText;
      commanderRecommendation.status = "ACTIVE";
      res.json({ text: responseText });
    } else {
      // Personalised fallback based on user's actual highest-emission category
      const b = calculateEmissions(true);
      const categories = [
        { name: "transport", val: b.transport, tip: `Your transport footprint is ${b.transport}t — consider reducing driving or switching to remote work a few days a week.` },
        { name: "energy", val: b.energy, tip: `Your energy usage accounts for ${b.energy}t — switching to a renewable plan or improving insulation can make a real impact.` },
        { name: "food", val: b.food, tip: `Your food footprint is ${b.food}t — eating less meat, even a few days a week, is one of the most effective changes you can make.` },
      ];
      const highest = categories.reduce((a, c) => c.val > a.val ? c : a);
      const place = userLocation.city || userLocation.country || "";
      const selected = place
        ? `Based on your data${place ? ` in ${place}` : ""}: ${highest.tip}`
        : highest.tip;
      commanderRecommendation.warning = selected;
      commanderRecommendation.status = "ACTIVE";
      res.json({ text: selected });
    }
  } catch (error: unknown) {
    console.error("Groq API error:", error);
    res.status(500).json({ error: "Couldn't reach the AI advisor right now. Try again in a moment." });
  }
});

app.get("/api/daily-insight", async (req: Request, res: Response) => {
  const today = new Date().toDateString();
  const place = userLocation.city || userLocation.country || "";
  const forceRefresh = req.query.refresh === "true";

  // Return cached insight if same day and same city
  if (!forceRefresh && dailyInsightCache && dailyInsightCache.date === today && dailyInsightCache.city === place) {
    res.json({ insight: dailyInsightCache.text, city: place, date: today, cached: true });
    return;
  }

  const client = getGroq();
  const dateLabel = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const locationPhrase = place || "your area";

  const prompt = `Today is ${dateLabel}. The user lives in ${locationPhrase}.

Write a short, engaging daily environmental insight for someone in ${locationPhrase}. Include:
- One specific local environmental fact, seasonal context, or climate-relevant observation for ${locationPhrase} right now
- One practical, location-aware tip to reduce their carbon footprint today
- A brief encouraging note about local climate action

Tone: warm, conversational, like a knowledgeable friend texting you a morning tip. Under 130 words. Do not use bullet points — write it as flowing natural paragraphs.`;

  try {
    let insightText: string;
    if (client) {
      const response = await client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        max_tokens: 400,
        temperature: 0.8,
        messages: [{ role: "user", content: prompt }],
      });
      insightText = response.choices[0]?.message?.content ?? "Today's a great day to take one small step for the planet. Try walking or cycling for short trips — it adds up more than you'd think.";
    } else {
      insightText = `Good morning from ${locationPhrase}! Today's a great opportunity to make a small difference. Try turning off devices on standby, planning a plant-based meal, or walking instead of driving for short trips. Every action counts — and your community will notice when more people make these choices together.`;
    }
    dailyInsightCache = { date: today, text: insightText, city: place };
    res.json({ insight: insightText, city: place, date: dateLabel, cached: false });
  } catch (error: unknown) {
    console.error("Groq API error (daily-insight):", error);
    res.status(500).json({ error: "Could not generate today's insight." });
  }
});

app.post("/api/sync", (_req: Request, res: Response) => {
  logActivity({ time: timestamp(), text: "SYS: MISSION_CONTROL_SYNCED_OK", impact: "0.0kg", type: "SYS" });
  res.json({ success: true, logs: activityLogs });
});

app.post("/api/reset", (_req: Request, res: Response) => {
  userLocation = { name: "", country: "", city: "" };
  userTelemetry = {
    mileage: 12500, commuteFrequency: "DAILY", vehicleType: "INTERNAL_COMBUSTION_MEDIUM",
    flightsShortHaul: 0, flightsLongHaul: 0, utilityBill: 185, energySource: "mixed",
    heatingType: "none", category: "TRANSPORT", meatIntake: "DAILY", foodWaste: "medium",
    recycledPercent: 40, shoppingFrequency: "average", newElectronics: 0, clothingType: "none",
  };
  challenges = [
    { id: "oper-zero-grid", title: "OPER_ZERO_GRID", description: "Offset your monthly grid consumption by investing in community wind projects.", xp: 500, status: "AVAILABLE", category: "ENERGY", xpReward: 500, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCEt1grbf_Yb95wstRr_Bw2z1yybN5XgYYFqEP81PKRdSOtWohaTGSmyPF0OCDh0_WvMHbAmDFiCfqNFMxEdg_EnklZj3i1ZPTNhPBDYIgmL8NhUlqj9HJW6f10pXFO-0Xids0VOduMx0wF8arHiBwPGeLGGJjd1ZwWCmi_9YCLOph3JDqsk2JSdtemrX2-uM_qwmhjkASEwgltmmMORoYzhuXJK4HtAPiHKB6X-isQ8oUt1sNW1tN2BGLcVsPJuajQhwcvIZZdMGWm", tasks: [{ id: "ozg-t1", label: "Sign up for a community wind or solar plan", completed: false }, { id: "ozg-t2", label: "Log your current monthly energy bill as a baseline", completed: false }, { id: "ozg-t3", label: "Track your kWh usage for one full week", completed: false }, { id: "ozg-t4", label: "Share the challenge with one friend or neighbour", completed: false }] },
    { id: "bio-shield-alpha", title: "BIO_SHIELD_ALPHA", description: "Support massive reforestation in the Amazon basin. Target: 10k Hectares.", xp: 850, status: "AVAILABLE", category: "REFORESTATION", urgency: "URGENT: 48H REMAINING", xpReward: 850, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAhw0533HcolCMG68x8paQLanAnKH9csTFN5YQKyXCAHDfTeNOjVrI_Q-m1C4qw-npF27O82gDhARdro7TQDnz0b4d-WaX7XuX2msV_woaiBUHB3Jngm6Yk0YcSlB6BwZ8aBeSqpmUx84xwswf2rQ82dVOspBwVYlZ8lBfvETaCPg79DoToIhhf8p2Hj7vx09eu2IcYGutmq6xR1RUavy8tnR0pRJLSGhUng5tHQiGjH1ve7HPdEwXF_IrUHOXVbsMwLEGT6rqxmGDo", tasks: [{ id: "bsa-t1", label: "Research and choose a verified reforestation charity", completed: false }, { id: "bsa-t2", label: "Make a contribution to plant at least 12 trees", completed: false }, { id: "bsa-t3", label: "Post about your contribution on social media", completed: false }] },
    { id: "urban-refit-x", title: "URBAN_REFIT_X", description: "Pilot program for retrofitting low-income housing with smart carbon scrubbers.", xp: 1200, status: "LOCKED", category: "RETROFIT", urgency: "TIER_3: COMMANDER ONLY", xpReward: 1200, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBzlZYc-KyO1YrgvSoIJj3YZ2fU7kpz2L-9s68I3eQcHTNbxS7c0joara5U5HEgdwobhltvtNqZCEpU01eG-sF_5K-tKcfPOKmVGAWiWqoDFrJwxMcgcVhRp4TMjSMbFGz-MsvjiM4jUYvBB_IUwlJfUYX2wcTK45CBsB0KYcPPcf9fI1CfMYzYs44HKeFMfjyrYXhi2-HNM3cMO5z3ygVHSi-Y9Ve2EzQMhxlfcV5_4FhlUBSY0BHslkZMD43PTRoSwFYD_FPPg-_G", tasks: [{ id: "urx-t1", label: "Complete a housing retrofit feasibility survey", completed: false }, { id: "urx-t2", label: "Connect with a local housing authority or NGO", completed: false }, { id: "urx-t3", label: "Identify 3 candidate properties in your area", completed: false }, { id: "urx-t4", label: "Submit a funding application or grant proposal", completed: false }] },
    { id: "transit-shift", title: "TRANSIT_SHIFT", description: "Replace 3 days of personal vehicle commutes per week with public transit or cycling.", xp: 400, status: "AVAILABLE", category: "TRANSPORT", xpReward: 400, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCEt1grbf_Yb95wstRr_Bw2z1yybN5XgYYFqEP81PKRdSOtWohaTGSmyPF0OCDh0_WvMHbAmDFiCfqNFMxEdg_EnklZj3i1ZPTNhPBDYIgmL8NhUlqj9HJW6f10pXFO-0Xids0VOduMx0wF8arHiBwPGeLGGJjd1ZwWCmi_9YCLOph3JDqsk2JSdtemrX2-uM_qwmhjkASEwgltmmMORoYzhuXJK4HtAPiHKB6X-isQ8oUt1sNW1tN2BGLcVsPJuajQhwcvIZZdMGWm", tasks: [{ id: "ts-t1", label: "Plan your first car-free commute route", completed: false }, { id: "ts-t2", label: "Complete 3 car-free commute days this week", completed: false }, { id: "ts-t3", label: "Download a local transit or bike-share app", completed: false }, { id: "ts-t4", label: "Log your CO2 saved compared to driving", completed: false }] },
    { id: "zero-plastic-cycle", title: "ZERO_PLASTIC_CYCLE", description: "Eliminate single-use plastics across all household consumption zones for 30 days.", xp: 350, status: "AVAILABLE", category: "WASTE", urgency: "CHALLENGE: 14D WINDOW", xpReward: 350, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAhw0533HcolCMG68x8paQLanAnKH9csTFN5YQKyXCAHDfTeNOjVrI_Q-m1C4qw-npF27O82gDhARdro7TQDnz0b4d-WaX7XuX2msV_woaiBUHB3Jngm6Yk0YcSlB6BwZ8aBeSqpmUx84xwswf2rQ82dVOspBwVYlZ8lBfvETaCPg79DoToIhhf8p2Hj7vx09eu2IcYGutmq6xR1RUavy8tnR0pRJLSGhUng5tHQiGjH1ve7HPdEwXF_IrUHOXVbsMwLEGT6rqxmGDo", tasks: [{ id: "zpc-t1", label: "Audit your kitchen for single-use plastic items", completed: false }, { id: "zpc-t2", label: "Replace plastic bags with reusable alternatives", completed: false }, { id: "zpc-t3", label: "Switch to a reusable water bottle and coffee cup", completed: false }, { id: "zpc-t4", label: "Go 7 consecutive days without buying single-use plastic", completed: false }] },
    { id: "home-audit-pro", title: "HOME_AUDIT_PRO", description: "Complete an energy efficiency audit and implement at least 2 recommended optimizations.", xp: 600, status: "AVAILABLE", category: "ENERGY", xpReward: 600, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCzqTRPDZEtIiwFPcHVwkwRSnyHhtKodv6uMRK1nrO4wvvw6c57jO7nK3s6afGRxSmkTpUhAVXQzooq4vXkzw9gITewx6Cb2oQZE84MROiFiv7QSKoZd6YDN6txHrMn8hufR9-EY35lncm3J0l9FzsLvkIbgH5g7dmTcSMUk3b-bpSwqO0uwUy_CjQFmV1EHDhUKS-TN7r6DclCZKUCXn5fdWxH6ohjRD6kyKh0GLzfzbkwfFW5QwjhVPenNDu_42j97ANlom9SS1CN", tasks: [{ id: "hap-t1", label: "Book or complete a home energy audit", completed: false }, { id: "hap-t2", label: "Switch all bulbs to LED lighting", completed: false }, { id: "hap-t3", label: "Install a smart thermostat or programmable timer", completed: false }, { id: "hap-t4", label: "Seal draughts around windows and doors", completed: false }] },
  ];
  activityLogs = [
    { time: "14:22:05", text: "LOG: COMMUTE_DETECTED", impact: "+2.4kg", type: "LOG" },
    { time: "12:10:48", text: "INIT: RENEWABLE_SWAP", impact: "-1.8kg", type: "INIT" },
    { time: "09:15:33", text: "DATA: GROCERY_INPUT", impact: "+12.1kg", type: "DATA" },
    { time: "08:00:00", text: "SYS: MISSION_REFRESH", impact: "OK", type: "SYS" },
  ];
  activeSimulation = { plantBased: true, solarConversion: false, evMobility: true };
  commanderRecommendation = { warning: "Warning: Transport emissions exceeding limits in Sector B. Deploy biking initiative to reduce projected 0.4 MT overage.", action: "EXECUTE_DEPLOY", projectedSaving: "-0.4 MT", sector: "Sector B", status: "ACTIVE" };
  baselineEmissions = calculateEmissions(true).total;
  initHistory();
  streakData = { days: 1, lastDate: new Date().toDateString() };
  res.json({ success: true });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    // Hashed JS/CSS bundles (e.g. /assets/index-abc123.js) — immutable, 1 year cache
    app.use("/assets", express.static(path.join(distPath, "assets"), {
      maxAge: "1y",
      immutable: true,
    }));
    // Everything else (index.html, favicon, etc.) — short cache, always revalidate
    app.use(express.static(distPath, { maxAge: "5m" }));
    app.get("*", (_req: Request, res: Response) => {
      res.setHeader("Cache-Control", "no-cache");
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => console.log(`CLIMATE_MISSION_CONTROL server listening on port ${PORT}`));
}

// Only start the HTTP server when not running under Vitest
if (!process.env.VITEST) {
  startServer();
}

export { app };
