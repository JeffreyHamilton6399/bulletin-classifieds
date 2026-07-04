import { PrismaClient } from '@prisma/client'
import { existsSync, readdirSync } from 'fs'
import path from 'path'

const REGIONS = [
  { name: 'San Francisco', slug: 'sfbay', state: 'CA', lat: 37.7749, lng: -122.4194, radiusKm: 20 },
  { name: 'New York City', slug: 'nyc', state: 'NY', lat: 40.7128, lng: -74.006, radiusKm: 25 },
  { name: 'Austin', slug: 'austin', state: 'TX', lat: 30.2672, lng: -97.7431, radiusKm: 30 },
  { name: 'Portland', slug: 'portland', state: 'OR', lat: 45.5152, lng: -122.6784, radiusKm: 25 },
  { name: 'Chicago', slug: 'chicago', state: 'IL', lat: 41.8781, lng: -87.6298, radiusKm: 30 },
  { name: 'Seattle', slug: 'seattle', state: 'WA', lat: 47.6062, lng: -122.3321, radiusKm: 25 },
  { name: 'Denver', slug: 'denver', state: 'CO', lat: 39.7392, lng: -104.9903, radiusKm: 30 },
  { name: 'Boston', slug: 'boston', state: 'MA', lat: 42.3601, lng: -71.0589, radiusKm: 25 },
]

const CATEGORIES: { name: string; slug: string; icon: string; subs: { name: string; slug: string }[] }[] = [
  {
    name: 'For Sale', slug: 'for-sale', icon: 'Tag',
    subs: [
      { name: 'Electronics', slug: 'ele' },
      { name: 'Furniture', slug: 'fua' },
      { name: 'Clothing', slug: 'clo' },
      { name: 'Cars+Trucks', slug: 'auto' },
      { name: 'Music & Instruments', slug: 'mus' },
      { name: 'Sporting', slug: 'spo' },
      { name: 'Tools', slug: 'tls' },
      { name: 'Free', slug: 'zip' },
      { name: 'Garage Sale', slug: 'gar' },
    ],
  },
  {
    name: 'Housing', slug: 'housing', icon: 'Home',
    subs: [
      { name: 'Apartments / Rent', slug: 'apa' },
      { name: 'Rooms / Shared', slug: 'roo' },
      { name: 'Houses / Sale', slug: 'rea' },
      { name: 'Sublets / Temp', slug: 'sub' },
      { name: 'Vacation Rentals', slug: 'vac' },
    ],
  },
  {
    name: 'Jobs', slug: 'jobs', icon: 'Briefcase',
    subs: [
      { name: 'Software / Tech', slug: 'sof' },
      { name: 'Creative / Design', slug: 'med' },
      { name: 'Education', slug: 'edu' },
      { name: 'Restaurant / Food', slug: 'fbh' },
      { name: 'General Labor', slug: 'lab' },
      { name: 'Part-time', slug: 'pt' },
    ],
  },
  {
    name: 'Services', slug: 'services', icon: 'Wrench',
    subs: [
      { name: 'Computer / IT', slug: 'cps' },
      { name: 'Household / Cleaning', slug: 'hss' },
      { name: 'Automotive', slug: 'aos' },
      { name: 'Lessons & Tutoring', slug: 'lss' },
      { name: 'Moving / Hauling', slug: 'mvs' },
    ],
  },
  {
    name: 'Community', slug: 'community', icon: 'Users',
    subs: [
      { name: 'Events', slug: 'eve' },
      { name: 'Activities', slug: 'act' },
      { name: 'Lost & Found', slug: 'laf' },
      { name: 'Musicians', slug: 'muc' },
      { name: 'Volunteers', slug: 'vol' },
      { name: 'Pets', slug: 'pet' },
    ],
  },
  {
    name: 'Gigs', slug: 'gigs', icon: 'Hand',
    subs: [
      { name: 'Computer', slug: 'cpg' },
      { name: 'Creative', slug: 'crg' },
      { name: 'Crew', slug: 'cwg' },
      { name: 'Domestic', slug: 'dmg' },
      { name: 'Labor', slug: 'lbg' },
      { name: 'Writing', slug: 'wrg' },
    ],
  },
  {
    name: 'Discussion', slug: 'discussion', icon: 'MessageSquare',
    subs: [
      { name: 'Politics', slug: 'pol' },
      { name: 'Local News', slug: 'new' },
      { name: 'Advice', slug: 'adv' },
      { name: 'Rants & Raves', slug: 'rnr' },
      { name: 'Religion', slug: 'rel' },
    ],
  },
]

function jitter(base: number, amt: number) {
  return base + (Math.random() - 0.5) * amt
}

async function main(prisma: PrismaClient) {
  console.log('Seeding regions...')
  for (let i = 0; i < REGIONS.length; i++) {
    const r = REGIONS[i]
    await prisma.region.upsert({
      where: { slug: r.slug },
      update: { name: r.name, state: r.state, lat: r.lat, lng: r.lng, radiusKm: r.radiusKm },
      create: { ...r },
    })
  }
  const regions = await prisma.region.findMany()

  console.log('Seeding categories...')
  let order = 0
  for (const cat of CATEGORIES) {
    const parent = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, icon: cat.icon, sortOrder: order, parentId: null },
      create: { name: cat.name, slug: cat.slug, icon: cat.icon, sortOrder: order, parentId: null },
    })
    order++
    let subOrder = 0
    for (const sub of cat.subs) {
      await prisma.category.upsert({
        where: { slug: sub.slug },
        update: { name: sub.name, parentId: parent.id, sortOrder: subOrder },
        create: { name: sub.name, slug: sub.slug, parentId: parent.id, sortOrder: subOrder },
      })
      subOrder++
    }
  }
  const allCats = await prisma.category.findMany({ include: { parent: true } })

  // gather available seed images
  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  const seedImages = existsSync(uploadDir)
    ? readdirSync(uploadDir).filter((f) => f.startsWith('seed-')).map((f) => `/uploads/${f}`)
    : []

  console.log(`Found ${seedImages.length} seed images`)

  // wipe existing listings (but keep regions/categories)
  await prisma.flag.deleteMany()
  await prisma.message.deleteMany()
  await prisma.image.deleteMany()
  await prisma.listing.deleteMany()

  // ---- Listing content ----
  type Seed = {
    title: string
    desc: string
    price: number | null
    priceLabel?: string
    catSlug: string
    regionSlug: string
    loc: string
    email: string
    name?: string
    phone?: string
    showPhone?: boolean
    imgs?: string[]
    daysAgo: number
  }

  const EMAILS = [
    'morgan.h@example.com', 'k.delacroix@example.com', 'sam.rivers@example.com',
    'natalie.w@example.com', 'j.okafor@example.com', 'priya.m@example.com',
    'theo.b@example.com', 'g.lenoir@example.com', 'a.russo@example.com',
    'd.chen@example.com', 'e.saltzman@example.com', 'marcus.t@example.com',
  ]

  const img = (n: string) => seedImages.find((s) => s.includes(`seed-${n}`)) || seedImages[0] || null

  const seeds: Seed[] = [
    {
      title: 'Moog Grandmother analog synthesizer — barely used',
      desc: 'Selling my Moog Grandmother. Bought new 2 years ago, played lightly in a smoke-free home studio. All patch points work perfectly, knobs are clean. Comes with original power supply and a handful of patch cables. Selling because I upgraded to a modular rig. Local pickup preferred, can ship at buyer\'s expense.',
      price: 720, priceLabel: 'obo', catSlug: 'mus', regionSlug: 'sfbay', loc: 'Mission District, SF',
      email: EMAILS[0], name: 'Morgan', imgs: [img('synth')!].filter(Boolean), daysAgo: 1,
    },
    {
      title: 'Bright studio — Mission District, utilities included',
      desc: 'Top-floor studio in a quiet building. South-facing window gets afternoon light all year. Kitchen has gas range, full-size fridge. Shared laundry in basement. Walk to BART in 8 minutes, Dolores Park in 12. No pets, no smoking. First + last + deposit. Available March 1st.',
      price: 2100, catSlug: 'apa', regionSlug: 'sfbay', loc: 'Mission District, SF',
      email: EMAILS[1], name: 'K. Delacroix', imgs: [img('apartment')!].filter(Boolean), daysAgo: 2,
    },
    {
      title: 'Trek Marlin 7 mountain bike, 2023, medium frame',
      desc: '2023 Trek Marlin 7, medium frame (29"). Ridden maybe 30 times on local trails. Recently tuned — new chain, fresh brake pads, tubeless setup. A couple of cosmetic scuffs on the frame but mechanically perfect. Great starter trail bike.',
      price: 540, catSlug: 'spo', regionSlug: 'austin', loc: 'East Austin',
      email: EMAILS[2], name: 'Sam Rivers', phone: '512-555-0142', showPhone: true,
      imgs: [img('bike')!].filter(Boolean), daysAgo: 3,
    },
    {
      title: 'Set of 4 mid-century teak dining chairs',
      desc: 'Four Danish-style teak dining chairs, believed to be 1960s. Solid frames, one chair has a small repair to the spline (shown in last photo). Original cushions have been reupholstered in a charcoal wool blend. Comfortable and sturdy. Selling as a set only.',
      price: 380, priceLabel: 'firm', catSlug: 'fua', regionSlug: 'portland', loc: 'SE Portland',
      email: EMAILS[3], name: 'Natalie', imgs: [img('chair')!].filter(Boolean), daysAgo: 4,
    },
    {
      title: 'Records — 200+ LPs, jazz/soul/rock, must take all',
      desc: 'Downsizing my collection. About 220 LPs, mostly VG+ or better. Heavy on jazz (Coltrane, Davis, Hancock), 70s soul, and classic rock. Some rarities mixed in. Not selling individually — looking for someone to take the whole lot. Bring a vehicle, they\'re heavy.',
      price: 650, catSlug: 'mus', regionSlug: 'chicago', loc: 'Logan Square',
      email: EMAILS[4], name: 'J. Okafor', imgs: [img('vinyl')!].filter(Boolean), daysAgo: 5,
    },
    {
      title: 'Found: golden retriever near Washington Park',
      desc: 'Found a friendly golden retriender (male, no collar, very sweet) wandering near Washington Park this morning around 9am. He\'s safe with me now — has water and food. If this sounds like yours, please reach out with a description to confirm. I\'ll hold him until we figure this out.',
      price: null, catSlug: 'laf', regionSlug: 'portland', loc: 'Washington Park area',
      email: EMAILS[5], name: 'Priya', imgs: [img('dog')!].filter(Boolean), daysAgo: 1,
    },
    {
      title: 'Vintage leather satchel, full-grain, beautifully worn',
      desc: 'Hand-stitched full-grain leather messenger bag, probably 1980s. No brand label but clearly well-made. Patina is gorgeous — it\'s been loved. One interior pocket needs re-stitching (minor). Brass hardware has a nice tarnish. Measures about 16" x 11" x 5".',
      price: 95, catSlug: 'clo', regionSlug: 'nyc', loc: 'Brooklyn — Greenpoint',
      email: EMAILS[6], name: 'Theo', imgs: [img('bag')!].filter(Boolean), daysAgo: 6,
    },
    {
      title: 'Adjustable standing desk (electric), maple top',
      desc: 'Electric sit-stand desk, 48" x 30" bamboo top on an aluminum frame. Memory presets, quiet motor. Used in a home office for about 18 months. Works perfectly. Selling because I\'m moving abroad. Pickup only — it disassembles into two manageable pieces. Assembly instructions included.',
      price: 280, catSlug: 'fua', regionSlug: 'seattle', loc: 'Capitol Hill',
      email: EMAILS[7], name: 'G. Lenoir', imgs: [img('desk')!].filter(Boolean), daysAgo: 2,
    },
    {
      title: 'Large monstera deliciosa in terracotta — well established',
      desc: 'Beautiful mature monstera, about 4 feet tall with fenestrated leaves. Potted in a 14" terracotta planter. Thrives in bright indirect light. I\'m moving and can\'t take it. Comes with a moss pole. Free to a good home — just pick it up this weekend.',
      price: 0, priceLabel: 'free', catSlug: 'zip', regionSlug: 'denver', loc: 'RiNo neighborhood',
      email: EMAILS[8], name: 'A. Russo', imgs: [img('plant')!].filter(Boolean), daysAgo: 1,
    },
    {
      title: 'Pentax K1000 35mm film camera + 50mm lens',
      desc: 'Classic Pentax K1000 SLR with the SMC Pentax-A 50mm f/2 lens. Fully mechanical, light meter works. Recently CLA\'d (cleaned/lubed/adjusted) by a local tech. Includes original strap and a fresh roll of Portra 400. Perfect for a film beginner or a student. Glass is clean, no fungus.',
      price: 180, priceLabel: 'obo', catSlug: 'ele', regionSlug: 'boston', loc: 'Cambridge',
      email: EMAILS[9], name: 'D. Chen', imgs: [img('camera')!].filter(Boolean), daysAgo: 7,
    },
    {
      title: '2009 Honda Civic LX — silver, 112k miles, runs great',
      desc: 'Selling my daily driver. 2009 Civic LX sedan, silver, 112,xxx miles. Regular oil changes, recent tires and brakes, clean title. AC blows cold. Minor dings consistent with age. Commuter car its whole life — mostly highway miles. Smog done, ready to register. $4,200 firm.',
      price: 4200, priceLabel: 'firm', catSlug: 'auto', regionSlug: 'austin', loc: 'Round Rock',
      email: EMAILS[10], name: 'Marcus T.', phone: '512-555-0199', showPhone: true,
      imgs: [img('car')!].filter(Boolean), daysAgo: 8,
    },
    {
      title: 'Martin DX1AE acoustic guitar with hard case',
      desc: 'Martin DX1AE dreadnought, solid spruce top with HPL back/sides. Warm, punchy tone — sounds bigger than it looks. Setup is low and comfortable. Includes a fitted hardshell case and a strap. One tiny finish ding on the lower bout (photographed). Great gig or couch guitar.',
      price: 460, catSlug: 'mus', regionSlug: 'nyc', loc: 'Astoria, Queens',
      email: EMAILS[11], name: 'E. Saltzman', imgs: [img('guitar')!].filter(Boolean), daysAgo: 4,
    },
    {
      title: 'Frontend Engineer (React/TypeScript) — remote-friendly',
      desc: 'Small product team (12 people) looking for a senior frontend engineer. We build internal tooling for a logistics company. Stack: React, TypeScript, Node, Postgres. You\'d own a meaningful chunk of the UI. Remote OK but NYC/Boston preferred for quarterly offsites. Competitive salary, real equity, sane hours.',
      price: null, priceLabel: '', catSlug: 'sof', regionSlug: 'nyc', loc: 'Remote (NYC preferred)',
      email: 'hiring@northboundtool.example.com', name: 'Northbound', daysAgo: 2,
    },
    {
      title: 'Need help moving a piano — this Saturday',
      desc: 'Looking for 2 strong people to help move an upright piano from a first-floor apartment to a house about 3 miles away. Should take 2-3 hours. I have a truck and a dolly, just need the muscle and care. $40/hr each, cash. Saturday morning, weather permitting.',
      price: 40, priceLabel: '/hr', catSlug: 'lbg', regionSlug: 'chicago', loc: 'Wicker Park → Bucktown',
      email: EMAILS[2], name: 'Sam', daysAgo: 1,
    },
    {
      title: 'Free weekly meditation sit — Wednesday evenings',
      desc: 'Informal meditation group that\'s been meeting for about 4 years. We sit for 30 minutes, walk for 10, then have tea and chat. All traditions welcome, beginners especially. Free (donations to cover the space welcome but never expected). Wednesdays 7pm at the community center.',
      price: null, catSlug: 'eve', regionSlug: 'portland', loc: 'St. Johns Community Center',
      email: EMAILS[5], name: 'Priya M.', daysAgo: 9,
    },
    {
      title: 'Math tutor — high school through calc, evenings/weekends',
      desc: 'Former high school math teacher offering one-on-one tutoring. Algebra through AP Calculus, plus SAT/ACT math prep. Patient, good with students who\'ve had bad experiences with math. $45/hr, in-person (your place or a library) or video. First session half-price to see if it\'s a fit.',
      price: 45, priceLabel: '/hr', catSlug: 'lss', regionSlug: 'boston', loc: 'Somerville / Cambridge',
      email: EMAILS[9], name: 'D. Chen', phone: '617-555-0188', showPhone: true, daysAgo: 5,
    },
    {
      title: 'Weekend brunch cook — farm-to-table spot, JP',
      desc: 'Small farm-to-table restaurant in Jamaica Plain looking for a weekend brunch cook. 2-3 shifts/week, 7am-3pm. Must have line experience and be comfortable with a changing menu. We butcher in-house, bake our own bread, and source from local farms. $22/hr + tips. Send a short note and your availability.',
      price: 22, priceLabel: '/hr', catSlug: 'fbh', regionSlug: 'boston', loc: 'Jamaica Plain',
      email: 'kitchen@bramblekitchen.example.com', name: 'Bramble Kitchen', daysAgo: 3,
    },
  ]

  console.log(`Creating ${seeds.length} listings...`)
  for (const s of seeds) {
    const cat = allCats.find((c) => c.slug === s.catSlug)
    const region = regions.find((r) => r.slug === s.regionSlug)
    if (!cat || !region) {
      console.warn(`Skip: cat=${s.catSlug} region=${s.regionSlug}`)
      continue
    }
    const createdAt = new Date(Date.now() - s.daysAgo * 86400000 - Math.random() * 86400000)
    const expiresAt = new Date(createdAt.getTime() + 30 * 86400000)
    await prisma.listing.create({
      data: {
        title: s.title,
        description: s.desc,
        price: s.price === null ? null : Math.round(s.price * 100),
        priceLabel: s.priceLabel || null,
        locationName: s.loc,
        lat: jitter(region.lat, region.radiusKm * 0.02),
        lng: jitter(region.lng, region.radiusKm * 0.02),
        regionId: region.id,
        categoryId: cat.id,
        contactEmail: s.email,
        contactName: s.name || null,
        contactPhone: s.phone || null,
        showPhone: s.showPhone || false,
        status: 'ACTIVE',
        createdAt,
        renewedAt: createdAt,
        expiresAt,
        images: (s.imgs && s.imgs.length > 0)
          ? { create: s.imgs.filter(Boolean).map((url, i) => ({ url, position: i })) }
          : undefined,
      },
    })
  }

  const count = await prisma.listing.count()
  console.log(`Done. ${count} listings in DB.`)
}

/** Reusable seed runner — used by the CLI script and the serverless boot path. */
export async function runSeed(prisma: PrismaClient) {
  return main(prisma)
}

// When run directly as a script
const isDirect = (() => {
  try {
    return process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)
  } catch {
    return false
  }
})()

if (isDirect) {
  const prisma = new PrismaClient()
  runSeed(prisma)
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
