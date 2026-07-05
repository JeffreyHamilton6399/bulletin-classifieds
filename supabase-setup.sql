
-- ═══════════════════════════════════════════════════════════
-- Bulletin — Schema + Seed (paste into Supabase SQL Editor)
-- ═══════════════════════════════════════════════════════════

-- Enums
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'EXPIRED', 'REMOVED', 'DRAFT');
CREATE TYPE "FlagReason" AS ENUM ('PROHIBITED', 'MISCATEGORIZED', 'SPAM', 'SCAM', 'DUPLICATE', 'OTHER');

-- Tables
CREATE TABLE IF NOT EXISTS "Region" (
    "id" TEXT NOT NULL, "name" TEXT NOT NULL, "slug" TEXT NOT NULL,
    "state" TEXT NOT NULL, "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL, "radiusKm" DOUBLE PRECISION NOT NULL DEFAULT 25,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "Category" (
    "id" TEXT NOT NULL, "name" TEXT NOT NULL, "slug" TEXT NOT NULL,
    "parentId" TEXT, "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "icon" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL, "email" TEXT NOT NULL, "name" TEXT,
    "passwordHash" TEXT, "bio" TEXT, "avatarColor" TEXT NOT NULL DEFAULT 'oxblood',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "Listing" (
    "id" TEXT NOT NULL, "title" TEXT NOT NULL, "description" TEXT NOT NULL,
    "price" INTEGER, "priceLabel" TEXT, "currency" TEXT NOT NULL DEFAULT 'USD',
    "locationName" TEXT NOT NULL, "lat" DOUBLE PRECISION, "lng" DOUBLE PRECISION,
    "userId" TEXT, "contactEmail" TEXT NOT NULL, "contactName" TEXT,
    "contactPhone" TEXT, "showPhone" BOOLEAN NOT NULL DEFAULT false,
    "editToken" TEXT NOT NULL, "regionId" TEXT NOT NULL, "categoryId" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "renewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "Image" (
    "id" TEXT NOT NULL, "listingId" TEXT NOT NULL, "url" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0, "width" INTEGER, "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "Message" (
    "id" TEXT NOT NULL, "listingId" TEXT NOT NULL, "fromEmail" TEXT NOT NULL,
    "fromName" TEXT, "body" TEXT NOT NULL, "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "Flag" (
    "id" TEXT NOT NULL, "listingId" TEXT NOT NULL, "reason" "FlagReason" NOT NULL,
    "ipHash" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Flag_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "Region_slug_key" ON "Region"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "Category_slug_key" ON "Category"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "Listing_editToken_key" ON "Listing"("editToken");
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE INDEX IF NOT EXISTS "Flag_listingId_idx" ON "Flag"("listingId");

-- Foreign keys
ALTER TABLE "Category" DROP CONSTRAINT IF EXISTS "Category_parentId_fkey";
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Listing" DROP CONSTRAINT IF EXISTS "Listing_userId_fkey";
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Listing" DROP CONSTRAINT IF EXISTS "Listing_regionId_fkey";
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Listing" DROP CONSTRAINT IF EXISTS "Listing_categoryId_fkey";
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Image" DROP CONSTRAINT IF EXISTS "Image_listingId_fkey";
ALTER TABLE "Image" ADD CONSTRAINT "Image_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Message" DROP CONSTRAINT IF EXISTS "Message_listingId_fkey";
ALTER TABLE "Message" ADD CONSTRAINT "Message_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Flag" DROP CONSTRAINT IF EXISTS "Flag_listingId_fkey";
ALTER TABLE "Flag" ADD CONSTRAINT "Flag_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ═══════════════════════════════════════════════════════════
-- Seed data
-- ═══════════════════════════════════════════════════════════

-- Regions

-- Categories
INSERT INTO "Category" ("id","name","slug","icon","sortOrder","parentId") VALUES ('cat_for_sale','For Sale','for-sale','Tag',0,NULL) ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","sortOrder","parentId") VALUES ('sub_ele','Electronics','ele',0,'cat_for_sale') ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","sortOrder","parentId") VALUES ('sub_fua','Furniture','fua',1,'cat_for_sale') ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","sortOrder","parentId") VALUES ('sub_clo','Clothing','clo',2,'cat_for_sale') ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","sortOrder","parentId") VALUES ('sub_auto','Cars+Trucks','auto',3,'cat_for_sale') ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","sortOrder","parentId") VALUES ('sub_mus','Music & Instruments','mus',4,'cat_for_sale') ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","sortOrder","parentId") VALUES ('sub_spo','Sporting','spo',5,'cat_for_sale') ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","sortOrder","parentId") VALUES ('sub_tls','Tools','tls',6,'cat_for_sale') ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","sortOrder","parentId") VALUES ('sub_zip','Free','zip',7,'cat_for_sale') ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","sortOrder","parentId") VALUES ('sub_gar','Garage Sale','gar',8,'cat_for_sale') ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","icon","sortOrder","parentId") VALUES ('cat_housing','Housing','housing','Home',1,NULL) ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","sortOrder","parentId") VALUES ('sub_apa','Apartments / Rent','apa',0,'cat_housing') ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","sortOrder","parentId") VALUES ('sub_roo','Rooms / Shared','roo',1,'cat_housing') ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","sortOrder","parentId") VALUES ('sub_rea','Houses / Sale','rea',2,'cat_housing') ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","sortOrder","parentId") VALUES ('sub_sub','Sublets / Temp','sub',3,'cat_housing') ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","sortOrder","parentId") VALUES ('sub_vac','Vacation Rentals','vac',4,'cat_housing') ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","icon","sortOrder","parentId") VALUES ('cat_jobs','Jobs','jobs','Briefcase',2,NULL) ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","sortOrder","parentId") VALUES ('sub_sof','Software / Tech','sof',0,'cat_jobs') ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","sortOrder","parentId") VALUES ('sub_med','Creative / Design','med',1,'cat_jobs') ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","sortOrder","parentId") VALUES ('sub_edu','Education','edu',2,'cat_jobs') ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","sortOrder","parentId") VALUES ('sub_fbh','Restaurant / Food','fbh',3,'cat_jobs') ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","sortOrder","parentId") VALUES ('sub_lab','General Labor','lab',4,'cat_jobs') ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","sortOrder","parentId") VALUES ('sub_pt','Part-time','pt',5,'cat_jobs') ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","icon","sortOrder","parentId") VALUES ('cat_services','Services','services','Wrench',3,NULL) ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","sortOrder","parentId") VALUES ('sub_cps','Computer / IT','cps',0,'cat_services') ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","sortOrder","parentId") VALUES ('sub_hss','Household / Cleaning','hss',1,'cat_services') ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","sortOrder","parentId") VALUES ('sub_aos','Automotive','aos',2,'cat_services') ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","sortOrder","parentId") VALUES ('sub_lss','Lessons & Tutoring','lss',3,'cat_services') ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","sortOrder","parentId") VALUES ('sub_mvs','Moving / Hauling','mvs',4,'cat_services') ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","icon","sortOrder","parentId") VALUES ('cat_community','Community','community','Users',4,NULL) ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","sortOrder","parentId") VALUES ('sub_eve','Events','eve',0,'cat_community') ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","sortOrder","parentId") VALUES ('sub_act','Activities','act',1,'cat_community') ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","sortOrder","parentId") VALUES ('sub_laf','Lost & Found','laf',2,'cat_community') ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","sortOrder","parentId") VALUES ('sub_muc','Musicians','muc',3,'cat_community') ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","sortOrder","parentId") VALUES ('sub_vol','Volunteers','vol',4,'cat_community') ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","sortOrder","parentId") VALUES ('sub_pet','Pets','pet',5,'cat_community') ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","icon","sortOrder","parentId") VALUES ('cat_gigs','Gigs','gigs','Hand',5,NULL) ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","sortOrder","parentId") VALUES ('sub_cpg','Computer','cpg',0,'cat_gigs') ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","sortOrder","parentId") VALUES ('sub_crg','Creative','crg',1,'cat_gigs') ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","sortOrder","parentId") VALUES ('sub_cwg','Crew','cwg',2,'cat_gigs') ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","sortOrder","parentId") VALUES ('sub_dmg','Domestic','dmg',3,'cat_gigs') ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","sortOrder","parentId") VALUES ('sub_lbg','Labor','lbg',4,'cat_gigs') ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","sortOrder","parentId") VALUES ('sub_wrg','Writing','wrg',5,'cat_gigs') ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","icon","sortOrder","parentId") VALUES ('cat_discussion','Discussion','discussion','MessageSquare',6,NULL) ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","sortOrder","parentId") VALUES ('sub_pol','Politics','pol',0,'cat_discussion') ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","sortOrder","parentId") VALUES ('sub_new','Local News','new',1,'cat_discussion') ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","sortOrder","parentId") VALUES ('sub_adv','Advice','adv',2,'cat_discussion') ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","sortOrder","parentId") VALUES ('sub_rnr','Rants & Raves','rnr',3,'cat_discussion') ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Category" ("id","name","slug","sortOrder","parentId") VALUES ('sub_rel','Religion','rel',4,'cat_discussion') ON CONFLICT ("slug") DO NOTHING;

-- Listings
INSERT INTO "Listing" ("id","title","description","price","priceLabel","locationName","lat","lng","contactEmail","contactName","contactPhone","showPhone","editToken","regionId","categoryId","status","expiresAt","renewedAt","createdAt","updatedAt") VALUES ('lst_001','Moog Grandmother analog synthesizer — barely used','Selling my Moog Grandmother. Bought new 2 years ago, played lightly in a smoke-free home studio. All patch points work perfectly, knobs are clean. Comes with original power supply and a handful of patch cables. Selling because I upgraded to a modular rig. Local pickup preferred, can ship at buyer''s expense.',72000,'obo','Mission District, SF',37.81085929152028,-122.37472615531148,'morgan.h@example.com','Morgan',NULL,false,'tok_lst_001_08xabg9jnk6m','reg_san_francisco','sub_mus','ACTIVE','2026-08-01T20:28:38.436Z','2026-07-02T20:28:38.436Z','2026-07-02T20:28:38.436Z','2026-07-02T20:28:38.436Z');
INSERT INTO "Image" ("id","listingId","url","position") VALUES ('img_lst_001_0','lst_001','/uploads/seed-synth.png',0);
INSERT INTO "Listing" ("id","title","description","price","priceLabel","locationName","lat","lng","contactEmail","contactName","contactPhone","showPhone","editToken","regionId","categoryId","status","expiresAt","renewedAt","createdAt","updatedAt") VALUES ('lst_002','Bright studio — Mission District, utilities included','Top-floor studio in a quiet building. South-facing window gets afternoon light all year. Kitchen has gas range, full-size fridge. Shared laundry in basement. Walk to BART in 8 minutes, Dolores Park in 12. No pets, no smoking. First + last + deposit. Available March 1st.',210000,NULL,'Mission District, SF',37.844464222709,-122.5829189689643,'k.delacroix@example.com','K. Delacroix',NULL,false,'tok_lst_002_xb3xc40ec6b','reg_san_francisco','sub_apa','ACTIVE','2026-08-01T18:46:36.313Z','2026-07-02T18:46:36.313Z','2026-07-02T18:46:36.313Z','2026-07-02T18:46:36.313Z');
INSERT INTO "Image" ("id","listingId","url","position") VALUES ('img_lst_002_0','lst_002','/uploads/seed-apartment.png',0);
INSERT INTO "Listing" ("id","title","description","price","priceLabel","locationName","lat","lng","contactEmail","contactName","contactPhone","showPhone","editToken","regionId","categoryId","status","expiresAt","renewedAt","createdAt","updatedAt") VALUES ('lst_003','Trek Marlin 7 mountain bike, 2023, medium frame','2023 Trek Marlin 7, medium frame (29"). Ridden maybe 30 times on local trails. Recently tuned — new chain, fresh brake pads, tubeless setup. A couple of cosmetic scuffs on the frame but mechanically perfect. Great starter trail bike.',54000,NULL,'East Austin',30.384334091131805,-97.93366581556054,'sam.rivers@example.com','Sam Rivers','512-555-0142',true,'tok_lst_003_lfhecoekoig','reg_austin','sub_spo','ACTIVE','2026-07-31T05:50:44.809Z','2026-07-01T05:50:44.809Z','2026-07-01T05:50:44.809Z','2026-07-01T05:50:44.809Z');
INSERT INTO "Image" ("id","listingId","url","position") VALUES ('img_lst_003_0','lst_003','/uploads/seed-bike.png',0);
INSERT INTO "Listing" ("id","title","description","price","priceLabel","locationName","lat","lng","contactEmail","contactName","contactPhone","showPhone","editToken","regionId","categoryId","status","expiresAt","renewedAt","createdAt","updatedAt") VALUES ('lst_004','Set of 4 mid-century teak dining chairs','Four Danish-style teak dining chairs, believed to be 1960s. Solid frames, one chair has a small repair to the spline (shown in last photo). Original cushions have been reupholstered in a charcoal wool blend. Comfortable and sturdy. Selling as a set only.',38000,'firm','SE Portland',45.678495150445876,-122.91698557824924,'natalie.w@example.com','Natalie',NULL,false,'tok_lst_004_6xxxuwi16xl','reg_portland','sub_fua','ACTIVE','2026-07-30T14:28:09.871Z','2026-06-30T14:28:09.871Z','2026-06-30T14:28:09.871Z','2026-06-30T14:28:09.871Z');
INSERT INTO "Image" ("id","listingId","url","position") VALUES ('img_lst_004_0','lst_004','/uploads/seed-chair.png',0);
INSERT INTO "Listing" ("id","title","description","price","priceLabel","locationName","lat","lng","contactEmail","contactName","contactPhone","showPhone","editToken","regionId","categoryId","status","expiresAt","renewedAt","createdAt","updatedAt") VALUES ('lst_005','Records — 200+ LPs, jazz/soul/rock, must take all','Downsizing my collection. About 220 LPs, mostly VG+ or better. Heavy on jazz (Coltrane, Davis, Hancock), 70s soul, and classic rock. Some rarities mixed in. Not selling individually — looking for someone to take the whole lot. Bring a vehicle, they''re heavy.',65000,NULL,'Logan Square',41.98737116534357,-87.60799679045839,'j.okafor@example.com','J. Okafor',NULL,false,'tok_lst_005_epe1x0n6r4p','reg_chicago','sub_mus','ACTIVE','2026-07-29T11:09:47.637Z','2026-06-29T11:09:47.637Z','2026-06-29T11:09:47.637Z','2026-06-29T11:09:47.637Z');
INSERT INTO "Image" ("id","listingId","url","position") VALUES ('img_lst_005_0','lst_005','/uploads/seed-vinyl.png',0);
INSERT INTO "Listing" ("id","title","description","price","priceLabel","locationName","lat","lng","contactEmail","contactName","contactPhone","showPhone","editToken","regionId","categoryId","status","expiresAt","renewedAt","createdAt","updatedAt") VALUES ('lst_006','Found: golden retriever near Washington Park','Found a friendly golden retriever (male, no collar, very sweet) wandering near Washington Park this morning around 9am. He''s safe with me now — has water and food. If this sounds like yours, please reach out with a description to confirm.',NULL,NULL,'Washington Park area',45.294520358106354,-122.58873015347163,'priya.m@example.com','Priya',NULL,false,'tok_lst_006_m0ee7od14t','reg_portland','sub_laf','ACTIVE','2026-08-02T11:53:03.646Z','2026-07-03T11:53:03.646Z','2026-07-03T11:53:03.646Z','2026-07-03T11:53:03.646Z');
INSERT INTO "Image" ("id","listingId","url","position") VALUES ('img_lst_006_0','lst_006','/uploads/seed-dog.png',0);
INSERT INTO "Listing" ("id","title","description","price","priceLabel","locationName","lat","lng","contactEmail","contactName","contactPhone","showPhone","editToken","regionId","categoryId","status","expiresAt","renewedAt","createdAt","updatedAt") VALUES ('lst_007','Vintage leather satchel, full-grain, beautifully worn','Hand-stitched full-grain leather messenger bag, probably 1980s. No brand label but clearly well-made. Patina is gorgeous — it''s been loved. One interior pocket needs re-stitching (minor). Brass hardware has a nice tarnish. Measures about 16" x 11" x 5".',9500,NULL,'Brooklyn — Greenpoint',40.90876443829183,-74.13073831956095,'theo.b@example.com','Theo',NULL,false,'tok_lst_007_no5sdb1flqf','reg_new_york_city','sub_clo','ACTIVE','2026-07-28T11:33:21.129Z','2026-06-28T11:33:21.129Z','2026-06-28T11:33:21.129Z','2026-06-28T11:33:21.129Z');
INSERT INTO "Image" ("id","listingId","url","position") VALUES ('img_lst_007_0','lst_007','/uploads/seed-bag.png',0);
INSERT INTO "Listing" ("id","title","description","price","priceLabel","locationName","lat","lng","contactEmail","contactName","contactPhone","showPhone","editToken","regionId","categoryId","status","expiresAt","renewedAt","createdAt","updatedAt") VALUES ('lst_008','Adjustable standing desk (electric), maple top','Electric sit-stand desk, 48" x 30" bamboo top on an aluminum frame. Memory presets, quiet motor. Used in a home office for about 18 months. Works perfectly. Selling because I''m moving abroad. Pickup only — it disassembles into two manageable pieces.',28000,NULL,'Capitol Hill',47.700752219446095,-122.36990813567012,'g.lenoir@example.com','G. Lenoir',NULL,false,'tok_lst_008_qvllxa0s0h','reg_seattle','sub_fua','ACTIVE','2026-08-01T01:53:40.335Z','2026-07-02T01:53:40.335Z','2026-07-02T01:53:40.335Z','2026-07-02T01:53:40.335Z');
INSERT INTO "Image" ("id","listingId","url","position") VALUES ('img_lst_008_0','lst_008','/uploads/seed-desk.png',0);
INSERT INTO "Listing" ("id","title","description","price","priceLabel","locationName","lat","lng","contactEmail","contactName","contactPhone","showPhone","editToken","regionId","categoryId","status","expiresAt","renewedAt","createdAt","updatedAt") VALUES ('lst_009','Large monstera deliciosa in terracotta — well established','Beautiful mature monstera, about 4 feet tall with fenestrated leaves. Potted in a 14" terracotta planter. Thrives in bright indirect light. I''m moving and can''t take it. Comes with a moss pole. Free to a good home — just pick it up this weekend.',0,'free','RiNo neighborhood',39.784558164664766,-105.17385918501802,'a.russo@example.com','A. Russo',NULL,false,'tok_lst_009_gtvw1anvjxt','reg_denver','sub_zip','ACTIVE','2026-08-02T04:41:44.973Z','2026-07-03T04:41:44.973Z','2026-07-03T04:41:44.973Z','2026-07-03T04:41:44.973Z');
INSERT INTO "Image" ("id","listingId","url","position") VALUES ('img_lst_009_0','lst_009','/uploads/seed-plant.png',0);
INSERT INTO "Listing" ("id","title","description","price","priceLabel","locationName","lat","lng","contactEmail","contactName","contactPhone","showPhone","editToken","regionId","categoryId","status","expiresAt","renewedAt","createdAt","updatedAt") VALUES ('lst_010','Pentax K1000 35mm film camera + 50mm lens','Classic Pentax K1000 SLR with the SMC Pentax-A 50mm f/2 lens. Fully mechanical, light meter works. Recently CLA''d (cleaned/lubed/adjusted) by a local tech. Includes original strap and a fresh roll of Portra 400. Perfect for a film beginner or a student.',18000,'obo','Cambridge',42.17757467087458,-71.13819415868633,'d.chen@example.com','D. Chen',NULL,false,'tok_lst_010_u980d1bkv9r','reg_boston','sub_ele','ACTIVE','2026-07-27T02:12:37.704Z','2026-06-27T02:12:37.704Z','2026-06-27T02:12:37.704Z','2026-06-27T02:12:37.704Z');
INSERT INTO "Image" ("id","listingId","url","position") VALUES ('img_lst_010_0','lst_010','/uploads/seed-camera.png',0);
INSERT INTO "Listing" ("id","title","description","price","priceLabel","locationName","lat","lng","contactEmail","contactName","contactPhone","showPhone","editToken","regionId","categoryId","status","expiresAt","renewedAt","createdAt","updatedAt") VALUES ('lst_011','2009 Honda Civic LX — silver, 112k miles, runs great','Selling my daily driver. 2009 Civic LX sedan, silver, 112,xxx miles. Regular oil changes, recent tires and brakes, clean title. AC blows cold. Minor dings consistent with age. Commuter car its whole life. Smog done, ready to register.',420000,'firm','Round Rock',30.47873001054056,-97.59469740734374,'e.saltzman@example.com','Marcus T.','512-555-0199',true,'tok_lst_011_zd9iux5m5qq','reg_austin','sub_auto','ACTIVE','2026-07-26T03:12:14.270Z','2026-06-26T03:12:14.270Z','2026-06-26T03:12:14.270Z','2026-06-26T03:12:14.270Z');
INSERT INTO "Image" ("id","listingId","url","position") VALUES ('img_lst_011_0','lst_011','/uploads/seed-car.png',0);
INSERT INTO "Listing" ("id","title","description","price","priceLabel","locationName","lat","lng","contactEmail","contactName","contactPhone","showPhone","editToken","regionId","categoryId","status","expiresAt","renewedAt","createdAt","updatedAt") VALUES ('lst_012','Martin DX1AE acoustic guitar with hard case','Martin DX1AE dreadnought, solid spruce top with HPL back/sides. Warm, punchy tone. Setup is low and comfortable. Includes a fitted hardshell case and a strap. One tiny finish ding on the lower bout. Great gig or couch guitar.',46000,NULL,'Astoria, Queens',40.92315168314108,-73.86173285170022,'marcus.t@example.com','E. Saltzman',NULL,false,'tok_lst_012_hs8djbya1q9','reg_new_york_city','sub_mus','ACTIVE','2026-07-30T04:06:07.868Z','2026-06-30T04:06:07.868Z','2026-06-30T04:06:07.868Z','2026-06-30T04:06:07.868Z');
INSERT INTO "Image" ("id","listingId","url","position") VALUES ('img_lst_012_0','lst_012','/uploads/seed-guitar.png',0);
INSERT INTO "Listing" ("id","title","description","price","priceLabel","locationName","lat","lng","contactEmail","contactName","contactPhone","showPhone","editToken","regionId","categoryId","status","expiresAt","renewedAt","createdAt","updatedAt") VALUES ('lst_013','Frontend Engineer (React/TypeScript) — remote-friendly','Small product team (12 people) looking for a senior frontend engineer. We build internal tooling for a logistics company. Stack: React, TypeScript, Node, Postgres. You''d own a meaningful chunk of the UI. Remote OK but NYC/Boston preferred for quarterly offsites.',NULL,NULL,'Remote (NYC preferred)',40.70838970683343,-73.82733489765386,'hiring@northboundtool.example.com','Northbound',NULL,false,'tok_lst_013_1g68to8ylug','reg_new_york_city','sub_sof','ACTIVE','2026-08-01T05:27:35.484Z','2026-07-02T05:27:35.484Z','2026-07-02T05:27:35.484Z','2026-07-02T05:27:35.484Z');
INSERT INTO "Listing" ("id","title","description","price","priceLabel","locationName","lat","lng","contactEmail","contactName","contactPhone","showPhone","editToken","regionId","categoryId","status","expiresAt","renewedAt","createdAt","updatedAt") VALUES ('lst_014','Need help moving a piano — this Saturday','Looking for 2 strong people to help move an upright piano from a first-floor apartment to a house about 3 miles away. Should take 2-3 hours. I have a truck and a dolly, just need the muscle and care. $40/hr each, cash. Saturday morning.',40,'/hr','Wicker Park → Bucktown',42.16282339495647,-87.37071344304395,'sam.rivers@example.com','Sam',NULL,false,'tok_lst_014_jigjov9okn','reg_chicago','sub_lbg','ACTIVE','2026-08-02T14:09:22.754Z','2026-07-03T14:09:22.754Z','2026-07-03T14:09:22.754Z','2026-07-03T14:09:22.754Z');
INSERT INTO "Listing" ("id","title","description","price","priceLabel","locationName","lat","lng","contactEmail","contactName","contactPhone","showPhone","editToken","regionId","categoryId","status","expiresAt","renewedAt","createdAt","updatedAt") VALUES ('lst_015','Free weekly meditation sit — Wednesday evenings','Informal meditation group that''s been meeting for about 4 years. We sit for 30 minutes, walk for 10, then have tea and chat. All traditions welcome, beginners especially. Free (donations to cover the space welcome but never expected). Wednesdays 7pm at the community center.',NULL,NULL,'St. Johns Community Center',45.31113275462786,-122.81234054679223,'priya.m@example.com','Priya M.',NULL,false,'tok_lst_015_wbexy82vrt','reg_portland','sub_eve','ACTIVE','2026-07-25T14:21:17.787Z','2026-06-25T14:21:17.787Z','2026-06-25T14:21:17.787Z','2026-06-25T14:21:17.787Z');
INSERT INTO "Listing" ("id","title","description","price","priceLabel","locationName","lat","lng","contactEmail","contactName","contactPhone","showPhone","editToken","regionId","categoryId","status","expiresAt","renewedAt","createdAt","updatedAt") VALUES ('lst_016','Math tutor — high school through calc, evenings/weekends','Former high school math teacher offering one-on-one tutoring. Algebra through AP Calculus, plus SAT/ACT math prep. Patient, good with students who''ve had bad experiences with math. $45/hr, in-person or video. First session half-price.',45,'/hr','Somerville / Cambridge',42.12613555670531,-70.9389970716955,'d.chen@example.com','D. Chen','617-555-0188',true,'tok_lst_016_pgsd5avglr','reg_boston','sub_lss','ACTIVE','2026-07-29T14:48:19.667Z','2026-06-29T14:48:19.667Z','2026-06-29T14:48:19.667Z','2026-06-29T14:48:19.667Z');
INSERT INTO "Listing" ("id","title","description","price","priceLabel","locationName","lat","lng","contactEmail","contactName","contactPhone","showPhone","editToken","regionId","categoryId","status","expiresAt","renewedAt","createdAt","updatedAt") VALUES ('lst_017','Weekend brunch cook — farm-to-table spot, JP','Small farm-to-table restaurant in Jamaica Plain looking for a weekend brunch cook. 2-3 shifts/week, 7am-3pm. Must have line experience. We butcher in-house, bake our own bread, and source from local farms. $22/hr + tips.',22,'/hr','Jamaica Plain',42.52880058889456,-71.01151163492966,'kitchen@bramblekitchen.example.com','Bramble Kitchen',NULL,false,'tok_lst_017_uz5n9bxzm','reg_boston','sub_fbh','ACTIVE','2026-07-31T11:51:11.927Z','2026-07-01T11:51:11.927Z','2026-07-01T11:51:11.927Z','2026-07-01T11:51:11.927Z');

-- Done. Your database is ready.
-- Add/update regions (run after supabase-setup.sql)

INSERT INTO "Region" ("id","name","slug","state","lat","lng","radiusKm") VALUES ('reg_san_francisco','San Francisco','san-francisco','CA',37.7749,-122.4194,20) ON CONFLICT ("slug") DO UPDATE SET "name"=EXCLUDED."name","state"=EXCLUDED."state","lat"=EXCLUDED."lat","lng"=EXCLUDED."lng","radiusKm"=EXCLUDED."radiusKm";
INSERT INTO "Region" ("id","name","slug","state","lat","lng","radiusKm") VALUES ('reg_new_york_city','New York City','new-york-city','NY',40.7128,-74.006,25) ON CONFLICT ("slug") DO UPDATE SET "name"=EXCLUDED."name","state"=EXCLUDED."state","lat"=EXCLUDED."lat","lng"=EXCLUDED."lng","radiusKm"=EXCLUDED."radiusKm";
INSERT INTO "Region" ("id","name","slug","state","lat","lng","radiusKm") VALUES ('reg_los_angeles','Los Angeles','los-angeles','CA',34.0522,-118.2437,30) ON CONFLICT ("slug") DO UPDATE SET "name"=EXCLUDED."name","state"=EXCLUDED."state","lat"=EXCLUDED."lat","lng"=EXCLUDED."lng","radiusKm"=EXCLUDED."radiusKm";
INSERT INTO "Region" ("id","name","slug","state","lat","lng","radiusKm") VALUES ('reg_chicago','Chicago','chicago','IL',41.8781,-87.6298,30) ON CONFLICT ("slug") DO UPDATE SET "name"=EXCLUDED."name","state"=EXCLUDED."state","lat"=EXCLUDED."lat","lng"=EXCLUDED."lng","radiusKm"=EXCLUDED."radiusKm";
INSERT INTO "Region" ("id","name","slug","state","lat","lng","radiusKm") VALUES ('reg_houston','Houston','houston','TX',29.7604,-95.3698,35) ON CONFLICT ("slug") DO UPDATE SET "name"=EXCLUDED."name","state"=EXCLUDED."state","lat"=EXCLUDED."lat","lng"=EXCLUDED."lng","radiusKm"=EXCLUDED."radiusKm";
INSERT INTO "Region" ("id","name","slug","state","lat","lng","radiusKm") VALUES ('reg_phoenix','Phoenix','phoenix','AZ',33.4484,-112.074,35) ON CONFLICT ("slug") DO UPDATE SET "name"=EXCLUDED."name","state"=EXCLUDED."state","lat"=EXCLUDED."lat","lng"=EXCLUDED."lng","radiusKm"=EXCLUDED."radiusKm";
INSERT INTO "Region" ("id","name","slug","state","lat","lng","radiusKm") VALUES ('reg_philadelphia','Philadelphia','philadelphia','PA',39.9526,-75.1652,25) ON CONFLICT ("slug") DO UPDATE SET "name"=EXCLUDED."name","state"=EXCLUDED."state","lat"=EXCLUDED."lat","lng"=EXCLUDED."lng","radiusKm"=EXCLUDED."radiusKm";
INSERT INTO "Region" ("id","name","slug","state","lat","lng","radiusKm") VALUES ('reg_san_antonio','San Antonio','san-antonio','TX',29.4241,-98.4936,30) ON CONFLICT ("slug") DO UPDATE SET "name"=EXCLUDED."name","state"=EXCLUDED."state","lat"=EXCLUDED."lat","lng"=EXCLUDED."lng","radiusKm"=EXCLUDED."radiusKm";
INSERT INTO "Region" ("id","name","slug","state","lat","lng","radiusKm") VALUES ('reg_san_diego','San Diego','san-diego','CA',32.7157,-117.1611,30) ON CONFLICT ("slug") DO UPDATE SET "name"=EXCLUDED."name","state"=EXCLUDED."state","lat"=EXCLUDED."lat","lng"=EXCLUDED."lng","radiusKm"=EXCLUDED."radiusKm";
INSERT INTO "Region" ("id","name","slug","state","lat","lng","radiusKm") VALUES ('reg_dallas','Dallas','dallas','TX',32.7767,-96.797,35) ON CONFLICT ("slug") DO UPDATE SET "name"=EXCLUDED."name","state"=EXCLUDED."state","lat"=EXCLUDED."lat","lng"=EXCLUDED."lng","radiusKm"=EXCLUDED."radiusKm";
INSERT INTO "Region" ("id","name","slug","state","lat","lng","radiusKm") VALUES ('reg_austin','Austin','austin','TX',30.2672,-97.7431,30) ON CONFLICT ("slug") DO UPDATE SET "name"=EXCLUDED."name","state"=EXCLUDED."state","lat"=EXCLUDED."lat","lng"=EXCLUDED."lng","radiusKm"=EXCLUDED."radiusKm";
INSERT INTO "Region" ("id","name","slug","state","lat","lng","radiusKm") VALUES ('reg_jacksonville','Jacksonville','jacksonville','FL',30.3322,-81.6557,35) ON CONFLICT ("slug") DO UPDATE SET "name"=EXCLUDED."name","state"=EXCLUDED."state","lat"=EXCLUDED."lat","lng"=EXCLUDED."lng","radiusKm"=EXCLUDED."radiusKm";
INSERT INTO "Region" ("id","name","slug","state","lat","lng","radiusKm") VALUES ('reg_fort_worth','Fort Worth','fort-worth','TX',32.7555,-97.3308,30) ON CONFLICT ("slug") DO UPDATE SET "name"=EXCLUDED."name","state"=EXCLUDED."state","lat"=EXCLUDED."lat","lng"=EXCLUDED."lng","radiusKm"=EXCLUDED."radiusKm";
INSERT INTO "Region" ("id","name","slug","state","lat","lng","radiusKm") VALUES ('reg_columbus','Columbus','columbus','OH',39.9612,-82.9988,30) ON CONFLICT ("slug") DO UPDATE SET "name"=EXCLUDED."name","state"=EXCLUDED."state","lat"=EXCLUDED."lat","lng"=EXCLUDED."lng","radiusKm"=EXCLUDED."radiusKm";
INSERT INTO "Region" ("id","name","slug","state","lat","lng","radiusKm") VALUES ('reg_charlotte','Charlotte','charlotte','NC',35.2271,-80.8431,30) ON CONFLICT ("slug") DO UPDATE SET "name"=EXCLUDED."name","state"=EXCLUDED."state","lat"=EXCLUDED."lat","lng"=EXCLUDED."lng","radiusKm"=EXCLUDED."radiusKm";
INSERT INTO "Region" ("id","name","slug","state","lat","lng","radiusKm") VALUES ('reg_indianapolis','Indianapolis','indianapolis','IN',39.7684,-86.1581,30) ON CONFLICT ("slug") DO UPDATE SET "name"=EXCLUDED."name","state"=EXCLUDED."state","lat"=EXCLUDED."lat","lng"=EXCLUDED."lng","radiusKm"=EXCLUDED."radiusKm";
INSERT INTO "Region" ("id","name","slug","state","lat","lng","radiusKm") VALUES ('reg_san_jose','San Jose','san-jose','CA',37.3382,-121.8863,20) ON CONFLICT ("slug") DO UPDATE SET "name"=EXCLUDED."name","state"=EXCLUDED."state","lat"=EXCLUDED."lat","lng"=EXCLUDED."lng","radiusKm"=EXCLUDED."radiusKm";
INSERT INTO "Region" ("id","name","slug","state","lat","lng","radiusKm") VALUES ('reg_denver','Denver','denver','CO',39.7392,-104.9903,30) ON CONFLICT ("slug") DO UPDATE SET "name"=EXCLUDED."name","state"=EXCLUDED."state","lat"=EXCLUDED."lat","lng"=EXCLUDED."lng","radiusKm"=EXCLUDED."radiusKm";
INSERT INTO "Region" ("id","name","slug","state","lat","lng","radiusKm") VALUES ('reg_seattle','Seattle','seattle','WA',47.6062,-122.3321,25) ON CONFLICT ("slug") DO UPDATE SET "name"=EXCLUDED."name","state"=EXCLUDED."state","lat"=EXCLUDED."lat","lng"=EXCLUDED."lng","radiusKm"=EXCLUDED."radiusKm";
INSERT INTO "Region" ("id","name","slug","state","lat","lng","radiusKm") VALUES ('reg_boston','Boston','boston','MA',42.3601,-71.0589,25) ON CONFLICT ("slug") DO UPDATE SET "name"=EXCLUDED."name","state"=EXCLUDED."state","lat"=EXCLUDED."lat","lng"=EXCLUDED."lng","radiusKm"=EXCLUDED."radiusKm";
INSERT INTO "Region" ("id","name","slug","state","lat","lng","radiusKm") VALUES ('reg_portland','Portland','portland','OR',45.5152,-122.6784,25) ON CONFLICT ("slug") DO UPDATE SET "name"=EXCLUDED."name","state"=EXCLUDED."state","lat"=EXCLUDED."lat","lng"=EXCLUDED."lng","radiusKm"=EXCLUDED."radiusKm";
INSERT INTO "Region" ("id","name","slug","state","lat","lng","radiusKm") VALUES ('reg_nashville','Nashville','nashville','TN',36.1627,-86.7816,30) ON CONFLICT ("slug") DO UPDATE SET "name"=EXCLUDED."name","state"=EXCLUDED."state","lat"=EXCLUDED."lat","lng"=EXCLUDED."lng","radiusKm"=EXCLUDED."radiusKm";
INSERT INTO "Region" ("id","name","slug","state","lat","lng","radiusKm") VALUES ('reg_las_vegas','Las Vegas','las-vegas','NV',36.1699,-115.1398,30) ON CONFLICT ("slug") DO UPDATE SET "name"=EXCLUDED."name","state"=EXCLUDED."state","lat"=EXCLUDED."lat","lng"=EXCLUDED."lng","radiusKm"=EXCLUDED."radiusKm";
INSERT INTO "Region" ("id","name","slug","state","lat","lng","radiusKm") VALUES ('reg_atlanta','Atlanta','atlanta','GA',33.749,-84.388,30) ON CONFLICT ("slug") DO UPDATE SET "name"=EXCLUDED."name","state"=EXCLUDED."state","lat"=EXCLUDED."lat","lng"=EXCLUDED."lng","radiusKm"=EXCLUDED."radiusKm";
INSERT INTO "Region" ("id","name","slug","state","lat","lng","radiusKm") VALUES ('reg_miami','Miami','miami','FL',25.7617,-80.1918,25) ON CONFLICT ("slug") DO UPDATE SET "name"=EXCLUDED."name","state"=EXCLUDED."state","lat"=EXCLUDED."lat","lng"=EXCLUDED."lng","radiusKm"=EXCLUDED."radiusKm";
INSERT INTO "Region" ("id","name","slug","state","lat","lng","radiusKm") VALUES ('reg_minneapolis','Minneapolis','minneapolis','MN',44.9778,-93.265,30) ON CONFLICT ("slug") DO UPDATE SET "name"=EXCLUDED."name","state"=EXCLUDED."state","lat"=EXCLUDED."lat","lng"=EXCLUDED."lng","radiusKm"=EXCLUDED."radiusKm";
INSERT INTO "Region" ("id","name","slug","state","lat","lng","radiusKm") VALUES ('reg_tampa','Tampa','tampa','FL',27.9506,-82.4572,30) ON CONFLICT ("slug") DO UPDATE SET "name"=EXCLUDED."name","state"=EXCLUDED."state","lat"=EXCLUDED."lat","lng"=EXCLUDED."lng","radiusKm"=EXCLUDED."radiusKm";
INSERT INTO "Region" ("id","name","slug","state","lat","lng","radiusKm") VALUES ('reg_new_orleans','New Orleans','new-orleans','LA',29.9511,-90.0715,25) ON CONFLICT ("slug") DO UPDATE SET "name"=EXCLUDED."name","state"=EXCLUDED."state","lat"=EXCLUDED."lat","lng"=EXCLUDED."lng","radiusKm"=EXCLUDED."radiusKm";
INSERT INTO "Region" ("id","name","slug","state","lat","lng","radiusKm") VALUES ('reg_pittsburgh','Pittsburgh','pittsburgh','PA',40.4406,-79.9959,25) ON CONFLICT ("slug") DO UPDATE SET "name"=EXCLUDED."name","state"=EXCLUDED."state","lat"=EXCLUDED."lat","lng"=EXCLUDED."lng","radiusKm"=EXCLUDED."radiusKm";
INSERT INTO "Region" ("id","name","slug","state","lat","lng","radiusKm") VALUES ('reg_sacramento','Sacramento','sacramento','CA',38.5816,-121.4944,25) ON CONFLICT ("slug") DO UPDATE SET "name"=EXCLUDED."name","state"=EXCLUDED."state","lat"=EXCLUDED."lat","lng"=EXCLUDED."lng","radiusKm"=EXCLUDED."radiusKm";

-- Done. 30 regions total.
