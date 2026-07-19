import {
  hero,
  para,
  numberedCard,
  featureRow,
  offerBlock,
  pullQuote,
  ctaBlock,
} from "./campaign-template";

// ============================================================
// Weekly campaign library
// Two tracks, rotated in order: each recipient gets the next
// email in their track that they haven't received yet (tracked
// in campaign_sends). When a recipient finishes their track,
// they're skipped until new emails are added here.
//
// Mix is ~3:1 value-to-promo on purpose — tips and trust keep
// opens high; offers convert. Keys are permanent identifiers:
// never reuse a key for different content.
// ============================================================

export type CampaignEmail = {
  key: string;
  subject: string;
  preheader: string;
  body: (siteUrl: string) => string;
};

// ------------------------------------------------------------
// PROSPECT TRACK — subscribed but never booked. Goal: first clean.
// ------------------------------------------------------------
export const PROSPECT_TRACK: CampaignEmail[] = [
  {
    key: "p01-five-things",
    subject: "5 things NYC cleaners wish you knew",
    preheader: "Lessons from 500+ Manhattan apartments — including the one about your sponge.",
    body: (siteUrl) => `
      ${hero(
        "From the field",
        "Five things our cleaners wish every New Yorker knew",
        "Our team has cleaned more than five hundred Manhattan apartments — pre-war walk-ups, glassy high-rises, and everything between. Ask them what they'd tell their own friends, and you get the same five answers every time.",
      )}
      ${numberedCard(1, "Clutter costs you clean.", "A cleaner can't wipe a counter buried under mail. Ten minutes of picking up before any clean — ours or yours — converts directly into more actual cleaning. It's the highest-leverage ten minutes in this email.")}
      ${numberedCard(2, "Steam heat is a dust machine.", "That clanking radiator circulates fine dust all winter. Wipe radiator tops weekly from November through March and you'll notice it on every other surface too — especially electronics and bookshelves.")}
      ${numberedCard(3, "Your sponge is the dirtiest thing you own.", "Warm, damp, and full of food residue — a kitchen sponge grows bacteria faster than almost anything in your apartment. Two weeks, then it goes. No exceptions, no microwave tricks.")}
      ${numberedCard(4, "Grout darkens slowly, then suddenly.", "Bathroom grout doesn't look worse week to week, until one day it's gray and no amount of scrubbing brings it back. A monthly once-over with a soft brush costs five minutes and saves a renovation-grade cleanup.")}
      ${numberedCard(5, "Street-facing sills need weekly love.", "If your windows face an avenue, your sills are collecting a fine black soot you can't see accumulating. A damp cloth once a week keeps it from bonding to the paint — pre-war windowsills especially.")}
      ${para("Or skip the list entirely. A Manhattan Mint clean covers all of it — flat rate, supplies included, starting at $175 for a studio or one-bedroom.")}
      ${ctaBlock(`${siteUrl}/quote/`, "Get my quote", "60-second booking · usually available within 24 hours")}`,
  },
  {
    key: "p02-offer-mint25",
    subject: "Your $25 off is still waiting",
    preheader: "MINT25 takes $25 off your first clean — studios from $150, guaranteed.",
    body: (siteUrl) => `
      ${hero(
        "Welcome offer",
        "Twenty-five dollars says you'll love coming home",
        "You signed up for our list a little while back, which means one thing: some part of you is tired of spending your one free evening scrubbing a bathroom. Your code is still good — here it is again.",
      )}
      ${offerBlock("MINT25", "Your code", "$25 off your first clean · studios & 1BRs from $150")}
      ${para("Here's exactly what that gets you: a background-checked, insured professional; eco-friendly supplies they bring themselves; every room vacuumed and dusted; kitchen degreased; bathrooms sanitized top to bottom; floors mopped; and a photo summary in your inbox when it's done — even if you're not home.")}
      ${para("Your card isn't charged until <em>after</em> the clean, and every visit carries our 100% satisfaction guarantee: anything not right, we come back and fix it. No questions, no forms, no hassle.")}
      ${ctaBlock(`${siteUrl}/quote/`, "Claim $25 off", "Enter MINT25 in the coupon field at checkout")}`,
  },
  {
    key: "p03-social-proof",
    subject: "Why 500+ Manhattan apartments trust us",
    preheader: "Every Google review five stars — here's what's behind that.",
    body: (siteUrl) => `
      ${hero(
        "Why Manhattan Mint",
        "Five stars isn't an accident. It's a checklist.",
        "Anyone can promise a great clean. We built a company around making it repeatable — five hundred apartments in, our Google rating is still a perfect 5.0. This is the system behind it.",
      )}
      ${featureRow("Vetted before they ever see your door.", "Every cleaner is background-checked, insured, and trained to our standard before their first booking. We work exclusively in Manhattan, so our team knows co-op rules, doormen, service elevators, and tight pre-war layouts cold.")}
      ${featureRow("A COI for your building, handled.", "If your building requires a certificate of insurance, we provide it — most managements have ours on file already. No back-and-forth between you, us, and your super.")}
      ${featureRow("Proof, not promises.", "You get a photo summary after every single visit. Working late? Traveling? You'll know exactly what your apartment looks like before you walk in.")}
      ${featureRow("Charged after, never before.", "Your card is authorized at booking and charged only after the clean is done. If anything isn't right, we fix it first.")}
      ${pullQuote("The first service I've used that treats a studio apartment with the same seriousness as a townhouse.")}
      ${ctaBlock(`${siteUrl}/quote/`, "Book my first clean", "Flat rates from $175 · same-week availability")}`,
  },
  {
    key: "p04-deep-vs-standard",
    subject: "Deep clean or standard — which does your place need?",
    preheader: "The 30-second baseboard test, and what each clean actually covers.",
    body: (siteUrl) => `
      ${hero(
        "The honest guide",
        "Deep clean or standard? Run the baseboard test.",
        "It's the question we get most, and there's a 30-second way to answer it yourself: run a finger along a baseboard, then look behind the toilet. Be honest about what you find.",
      )}
      ${numberedCard(1, "Mostly fine? Book a standard clean.", "A standard clean is maintenance done properly: every room vacuumed and dusted, kitchen surfaces degreased, stovetop scrubbed, bathrooms sanitized, floors mopped, mirrors, trash, entryway. It keeps a healthy apartment healthy.")}
      ${numberedCard(2, "Gray finger? It's been 3+ months? Deep clean first.", "The deep clean (+$75) is the reset button: baseboards, radiators, light fixtures, inside the microwave, door frames, the buildup a standard pass isn't priced to chase. One deep clean, then standard cleans hold the line from there.")}
      ${numberedCard(3, "Either way, it's one flat rate.", "No à la carte surprises, no upsell at the door, all supplies included. You'll know the exact price before you book — a 1BR standard is $175, deep is $250, done.")}
      ${para("Still not sure which you need? Reply with a photo of your kitchen and we'll tell you straight — including if the answer is the cheaper one.")}
      ${ctaBlock(`${siteUrl}/quote/`, "Get my quote", "Standard, deep, or move-in/out — priced upfront")}`,
  },
  {
    key: "p05-how-it-works",
    subject: "Booked in 60 seconds, clean by the weekend",
    preheader: "No phone calls, no estimates, no strangers-with-a-mop roulette.",
    body: (siteUrl) => `
      ${hero(
        "How it works",
        "From “we should really get a cleaner” to done, in three steps",
        "Most cleaning services make you call, wait for a quote, negotiate a window, and hope. We removed every one of those steps — here's the entire process.",
      )}
      ${numberedCard(1, "Book online in about a minute.", "Pick your apartment size, service type, and date. The price is flat and shown before you pay anything. Instant confirmation — no phone tag, no “someone will contact you.”")}
      ${numberedCard(2, "We arrive ready.", "A background-checked cleaner, eco-friendly supplies in hand, your building's access rules already sorted — doorman, key, or code. You don't even need to be home.")}
      ${numberedCard(3, "You come home to mint.", "Photo summary sent when the clean is done. Card charged only after. If anything's off, we make it right — that's the guarantee.")}
      ${para("Earliest availability is usually within 24 hours, and same-week is almost always doable — even for deep cleans.")}
      ${ctaBlock(`${siteUrl}/quote/`, "Check availability", "Studios from $175 · 2BR $225 · 3BR $275")}`,
  },
  {
    key: "p06-offer-mint20",
    subject: "20% off — the bigger the place, the bigger the save",
    preheader: "MINT20 takes 20% off any clean — $45 off a 2BR, $55 off a 3BR.",
    body: (siteUrl) => `
      ${hero(
        "For the bigger places",
        "Twenty percent off, and it scales with your square footage",
        "Flat-dollar coupons are fine for studios. If you've got a real amount of apartment, percentage is the better math — so here's twenty percent off the whole ticket.",
      )}
      ${offerBlock("MINT20", "Your code", "20% off any clean — including deep cleans and move-in/move-out")}
      ${featureRow("2 bedroom:", "$225 becomes $180 — a $45 save.")}
      ${featureRow("3 bedroom:", "$275 becomes $220 — a $55 save.")}
      ${featureRow("3BR deep clean:", "$350 becomes $280 — a $70 save, on the clean that needs it most.")}
      ${para("Same deal as always underneath: background-checked and insured cleaner, all supplies included, photo summary after, card charged only when the work is done, 100% satisfaction guarantee.")}
      ${ctaBlock(`${siteUrl}/quote/`, "Use MINT20", "Enter it in the coupon field — the price updates instantly")}`,
  },
  {
    key: "p07-how-often",
    subject: "How often should a NYC apartment be cleaned?",
    preheader: "The honest answer depends on three things — pets, windows, and your stove.",
    body: (siteUrl) => `
      ${hero(
        "The honest guide",
        "How often does a New York apartment actually need cleaning?",
        "The internet says “it depends.” Useless. After five hundred Manhattan apartments, we can be more specific: it depends on exactly three things — pets, street-facing windows, and how much you cook.",
      )}
      ${numberedCard(1, "Every two weeks is the sweet spot.", "For most 1–2 bedroom apartments, bi-weekly is where the math works: dust never gets a foothold, bathrooms never tip past “quick wipe” territory, and each visit stays fast and thorough.")}
      ${numberedCard(2, "Weekly, if you check two of the three boxes.", "Shedding pet plus daily cooking? Avenue-facing windows plus a dog? Weekly keeps you ahead of it instead of chasing it.")}
      ${numberedCard(3, "Monthly works for the tidy and the travelling.", "Home four nights a week, no pets, takeout more than stove? Monthly professional cleans with light upkeep between is a perfectly respectable rhythm.")}
      ${para("Here's the part that surprises people: recurring plans make the frequent option <em>cheaper</em>. Weekly saves 30% per clean, bi-weekly 25%, monthly 15% — a bi-weekly 1BR works out to about $131 instead of $175, with the same cleaner each visit whenever possible.")}
      ${ctaBlock(`${siteUrl}/quote/`, "See recurring rates", "Pick a frequency at checkout — the discount applies automatically")}`,
  },
  {
    key: "p08-guarantee",
    subject: "Still thinking it over? Here's our promise.",
    preheader: "Letting someone into your home is a big deal. Here's how we earn it.",
    body: (siteUrl) => `
      ${hero(
        "Our promise",
        "The risk is on us, not you",
        "Trying a cleaning service means letting a stranger into your home. We don't take that lightly, and we've structured the entire company so that every ounce of risk sits on our side of the table.",
      )}
      ${featureRow("Background-checked, insured, trained.", "Nobody cleans for Manhattan Mint until they've passed a background check and been trained to our standard. Full liability coverage on every single visit.")}
      ${featureRow("Charged only after the clean.", "Your card is saved at booking but nothing is charged until the work is done. You will never pay for a clean you haven't received.")}
      ${featureRow("Photo summary, every visit.", "You see the results in your inbox before you see them in person.")}
      ${featureRow("100% satisfaction guarantee.", "Anything not right, we return and fix it. No interrogation, no fine print.")}
      ${para("And because you've been on this list a while, your welcome code still works:")}
      ${offerBlock("MINT25", "Still yours", "$25 off your first clean")}
      ${ctaBlock(`${siteUrl}/quote/`, "Book with $25 off", "60-second booking · same-week availability")}`,
  },
];

// ------------------------------------------------------------
// CUSTOMER TRACK — has booked before. Goal: rebook, recurring,
// referrals, reviews.
// ------------------------------------------------------------
export const CUSTOMER_TRACK: CampaignEmail[] = [
  {
    key: "c01-between-cleans",
    subject: "Keeping your place mint between cleans",
    preheader: "The 10-minute weekly reset our own cleaners use at home.",
    body: (siteUrl) => `
      ${hero(
        "For our customers",
        "The ten-minute reset our cleaners use in their own homes",
        "You've seen what your place looks like after a Manhattan Mint visit. The secret to keeping it feeling that way isn't more cleaning — it's ten specific minutes, once a week. This is the exact routine our own team uses.",
      )}
      ${numberedCard(1, "Kitchen — four minutes.", "Clear the counters completely (that's most of it, honestly), one wipe-down with whatever spray you like, rinse and dry the sink. A dry sink reads as clean even when nothing else is.")}
      ${numberedCard(2, "Bathroom — three minutes.", "Squeegee or towel-wipe the shower glass while you're still in there, then wipe the sink and faucet. Water spots are 80% of what makes a bathroom look tired.")}
      ${numberedCard(3, "Everywhere — three minutes.", "One lap around the apartment with a basket. Anything that isn't where it lives goes in the basket; empty the basket at the end. Do not stop to organize — that's a different day.")}
      ${para("Do this weekly and your professional cleans stop being about recovery and start being about the deep stuff — which is exactly where you want your money going.")}
      ${ctaBlock(`${siteUrl}/quote/`, "Book my next clean", "Your details are already on file — takes about a minute")}`,
  },
  {
    key: "c02-recurring",
    subject: "Never think about cleaning again (and save up to 30%)",
    preheader: "Recurring plans: weekly saves 30%, bi-weekly 25%, monthly 15%.",
    body: (siteUrl) => `
      ${hero(
        "Worth the math",
        "The subscription that pays you to stop thinking about it",
        "You already know what a Manhattan Mint clean looks like. A recurring plan means it just stays that way — no rebooking, no remembering, and a permanently lower price for the exact same clean.",
      )}
      ${featureRow("Weekly — save 30%.", "For homes with pets, kids, or serious cooking. Your 1BR drops from $175 to about $123 per clean.")}
      ${featureRow("Bi-weekly — save 25%.", "Our most popular plan by a wide margin. About $131 per clean for a 1BR, and dust never gets a foothold.")}
      ${featureRow("Monthly — save 15%.", "The tidy-household rhythm. About $149 per clean, professional-grade reset included.")}
      ${para("Same standard, same photo summary after every visit, and the same cleaner each time whenever scheduling allows — they learn your apartment, your products, your building's quirks. You can pause or cancel any time by replying to any email.")}
      ${ctaBlock(`${siteUrl}/quote/`, "Start a recurring plan", "Pick a frequency at checkout — the discount applies automatically")}`,
  },
  {
    key: "c03-referral",
    subject: "Know someone who could use a mint apartment?",
    preheader: "Give a friend $25 off their first clean — code MINT25.",
    body: (siteUrl) => `
      ${hero(
        "Share the mint",
        "Your group chat has at least one person who needs this",
        "Most of our new customers don't come from ads. They come from someone like you mentioning us to a friend, a neighbor across the hall, or the group chat after somebody complains about their weekend disappearing into chores.",
      )}
      ${para("If someone you know could use their Saturdays back, send them our way with this:")}
      ${offerBlock("MINT25", "For your people", "$25 off their first clean · manhattanmintnyc.com")}
      ${para("Forward this email, drop the code in the chat, or just tell them the name. They get a background-checked, insured cleaner and a guaranteed result; you get the credit for the recommendation — and the moral high ground next time chores come up.")}
      ${ctaBlock(`${siteUrl}/quote/`, "Or book your own next clean", "Same-week availability, as always")}`,
  },
  {
    key: "c04-seasonal-deep",
    subject: "The once-a-season deep clean, explained",
    preheader: "What quarterly deep cleans catch that regular cleaning can't.",
    body: (siteUrl) => `
      ${hero(
        "Seasonal maintenance",
        "Once a season, go deep",
        "Regular cleaning keeps an apartment pleasant. But New York apartments accumulate a second, slower layer of grime that standard visits aren't priced to chase — and four times a year is exactly how often it needs evicting.",
      )}
      ${featureRow("Radiator dust and vent buildup.", "Steam season blows fine dust everywhere; AC season pulls it back through the vents. Twice-yearly minimum, quarterly ideally.")}
      ${featureRow("Window-sill soot.", "Street-facing sills collect a fine black film that bonds to paint if it sits more than a season.")}
      ${featureRow("Oven, microwave interior, fixtures.", "The greasy film that migrates from every sauté session onto everything within six feet of the stove — including the tops of your cabinets.")}
      ${featureRow("Grout and baseboard shadowing.", "The slow-motion darkening you stop noticing because you see it every day. Guests notice.")}
      ${para("The deep clean is +$75 on your flat rate, and if your last one was more than three months ago, this is your nudge — your regular cleans work better on a reset apartment, and the brand-new feeling lasts for days.")}
      ${ctaBlock(`${siteUrl}/quote/`, "Book a deep clean", "Pick “Deep clean” as your service type at checkout")}`,
  },
  {
    key: "c05-review",
    subject: "Got 60 seconds? It genuinely helps.",
    preheader: "A quick Google review helps your neighbors find us.",
    body: (siteUrl) => `
      ${hero(
        "A small favor",
        "Sixty seconds of your time, if we've earned it",
        "We're a small Manhattan company. No ad budget moves the needle like one honest sentence from a real customer — it's how your neighbors decide whether to trust us with their keys.",
      )}
      ${para("If your cleans have been what they should be, a quick Google review — even two sentences about what stood out — genuinely changes our month. It takes about a minute, and we read every single one.")}
      ${ctaBlock("https://g.page/r/CeslAughOLhZEBM/review", "Leave a review", "Opens Google — takes about 60 seconds")}
      ${para("And the flip side matters just as much: if anything about a clean <em>wasn't</em> five stars, don't put it in a review — put it in a reply to this email. It comes straight to us and we'll make it right, usually within a day.")}`,
  },
  {
    key: "c06-movein-moveout",
    subject: "Moving? Don't clean your old place yourself.",
    preheader: "The move-out clean that gets security deposits back.",
    body: (siteUrl) => `
      ${hero(
        "For moving day",
        "The last thing you should do in your old apartment is clean it",
        "Moving in New York is a contact sport. After the boxes, the stairs, the truck double-parked on a street-cleaning day — the final boss is cleaning an empty apartment to security-deposit standard. Don't.",
      )}
      ${featureRow("Built for empty apartments.", "Our move-in/move-out clean (+$100) covers what landlords and brokers actually inspect: inside cabinets and closets, inside the fridge and oven, baseboards, fixtures — the checklist your deposit depends on.")}
      ${featureRow("Moving in? Book it for the day before.", "Have it done before your boxes arrive and you'll start genuinely fresh — the previous tenant's history stays with the previous tenant.")}
      ${featureRow("Not moving? Forward this.", "Someone in your life just signed a lease. This email is worth a security deposit to them.")}
      ${ctaBlock(`${siteUrl}/quote/`, "Book a move clean", "Choose “Move-in / Move-out” as your service type")}`,
  },
  {
    key: "c07-rebook",
    subject: "Time for a refresh?",
    preheader: "Same-week availability — and your details are already on file.",
    body: (siteUrl) => `
      ${hero(
        "A gentle nudge",
        "Your apartment misses us",
        "It's been a while since your last Manhattan Mint visit. No guilt — life gets full. But somewhere around now is when the difference between “fine” and “mint” starts announcing itself, usually in the bathroom first.",
      )}
      ${para("The good news: your details are already on file, so rebooking takes about a minute. We usually have availability within 24 hours, and same-week is nearly always doable.")}
      ${para("Flat rates, all supplies included, photo summary when it's done, card charged only after the clean. Exactly as you remember it.")}
      ${ctaBlock(`${siteUrl}/quote/`, "Book my clean", "Usually available within 24 hours")}`,
  },
  {
    key: "c08-pets-plants",
    subject: "Pets, plants, and cleaning products — what's safe",
    preheader: "How we clean around the other residents of your apartment.",
    body: (siteUrl) => `
      ${hero(
        "The other residents",
        "Cleaning around pets and plants, done right",
        "Between our customers' apartments, we've cleaned around every species New York allows and several it technically doesn't. A few things worth knowing about how cleaning products and the other residents of your home get along.",
      )}
      ${numberedCard(1, "Cats read citrus as a threat.", "Most citrus-scented cleaners are genuinely unpleasant for cats — some are mildly toxic. We use eco-friendly, pet-safe products by default, which is one reason your cat merely disapproves of us rather than filing a complaint.")}
      ${numberedCard(2, "Dogs and mop water don't mix.", "Keep water bowls and food off the floor until it's fully dry — about twenty minutes. Most dogs will absolutely drink mop water given the chance. We've watched them try.")}
      ${numberedCard(3, "Plant leaves are surfaces too.", "Dust blocks the light your plants photosynthesize with. A monthly wipe with a damp cloth — support each leaf from below — and your fiddle-leaf fig stops sulking.")}
      ${para("Have a pet we should know about? Add them to your booking notes — how they greet strangers, where they like to hide — and your cleaner will plan around them. We keep notes.")}
      ${ctaBlock(`${siteUrl}/quote/`, "Book my next clean", "Pet notes welcome — we read all of them")}`,
  },
];
