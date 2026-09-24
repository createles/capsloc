import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const TARGET_TABLES = ['loc_string_refs', 'loc_string_audits', 'attachments', 'messages', 'channel_members', 'channels', 'loc_strings', 'glossary_terms', 'users'];

async function purgeDatabase(): Promise<void> {
  console.log('Inspecting database schema for safe purge...');

  // 1. Query information_schema to discover which tables actually exist
  const existingRows = await prisma.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
  `;

  const existingTableNames = existingRows.map((r) => r.table_name).filter((name) => TARGET_TABLES.includes(name));

  if (existingTableNames.length === 0) {
    console.log('ℹ️  No tables exist yet. Schema must be initialized before seeding.');
    return;
  }

  // 2. Atomically TRUNCATE existing tables in a single statement with CASCADE
  const quotedTables = existingTableNames.map((name) => `"${name}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${quotedTables} RESTART IDENTITY CASCADE;`);
  console.log(`✅ Purged ${existingTableNames.length} tables via atomic TRUNCATE CASCADE.`);
}

async function main(): Promise<void> {
  await purgeDatabase();

  console.log('Seeding Capcom localization datasets...');

  // hardcode the default password hash for "Password123!" salted with bcrypt and 10 rounds of hashing
  // for seed purposes
  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

  // ===================================
  // SEEDING OUR DUMMY USERS FOR TESTING
  // ===================================
  const dante = await prisma.user.upsert({
    where: { email: 'dante@capcom.local' },
    update: { passwordHash: defaultPasswordHash, customStatus: 'In Chapter 1 script triage' },
    create: {
      username: 'dante_translator',
      email: 'dante@capcom.local',
      passwordHash: defaultPasswordHash,
      displayName: 'Dante (Lead JA->EN Translator)',
      locRole: 'TRANSLATOR',
      primaryLocale: 'ja-JP',
      targetLocales: ['en-US'],
      status: 'online',
      customStatus: 'In Chapter 1 script triage',
    },
  });

  const jill = await prisma.user.upsert({
    where: { email: 'jill@capcom.local' },
    update: { passwordHash: defaultPasswordHash, customStatus: 'Verifying German HUD layouts' },
    create: {
      username: 'jill_lqa',
      email: 'jill@capcom.local',
      passwordHash: defaultPasswordHash,
      displayName: 'Jill Valentine (LQA Specialist)',
      locRole: 'LQA_TESTER',
      primaryLocale: 'en-US',
      targetLocales: ['en-US', 'de-DE'],
      status: 'online',
      customStatus: 'Verifying German HUD layouts',
    },
  });

  const leon = await prisma.user.upsert({
    where: { email: 'leon@capcom.local' },
    update: { passwordHash: defaultPasswordHash, customStatus: 'Refactoring RE ENGINE text containers' },
    create: {
      username: 'leon_dev',
      email: 'leon@capcom.local',
      passwordHash: defaultPasswordHash,
      displayName: 'Leon S. Kennedy (Solutions Dev)',
      locRole: 'SOLUTIONS_DEV',
      primaryLocale: 'en-US',
      targetLocales: ['global'],
      status: 'online',
      customStatus: 'Refactoring RE ENGINE text containers',
    },
  });

  const ada = await prisma.user.upsert({
    where: { email: 'ada@capcom.local' },
    update: { passwordHash: defaultPasswordHash, customStatus: 'Sprint deadline: September 20' },
    create: {
      username: 'ada_pm',
      email: 'ada@capcom.local',
      passwordHash: defaultPasswordHash,
      displayName: 'Ada Wong (Localization PM)',
      locRole: 'LOC_PM',
      primaryLocale: 'en-US',
      targetLocales: ['ja-JP', 'en-US', 'zh-CN'],
      status: 'online',
      customStatus: 'Sprint deadline: September 20',
    },
  });

  const nero = await prisma.user.upsert({
    where: { email: 'nero@capcom.local' },
    update: { passwordHash: defaultPasswordHash, customStatus: 'Reviewing cutscene 04 lip-sync' },
    create: {
      username: 'nero_audio',
      email: 'nero@capcom.local',
      passwordHash: defaultPasswordHash,
      displayName: 'Nero (Audio & Lip-Sync)',
      locRole: 'AUDIO_SPECIALIST',
      primaryLocale: 'en-US',
      targetLocales: ['en-US', 'ja-JP'],
      status: 'online',
      customStatus: 'Reviewing cutscene 04 lip-sync',
    },
  });

  const chris = await prisma.user.upsert({
    where: { email: 'chris@capcom.local' },
    update: { passwordHash: defaultPasswordHash, customStatus: 'BSAA Operations / Triage' },
    create: {
      username: 'chris_producer',
      email: 'chris@capcom.local',
      passwordHash: defaultPasswordHash,
      displayName: 'Chris Redfield (Senior Producer)',
      locRole: 'LOC_PM',
      primaryLocale: 'en-US',
      targetLocales: ['global'],
      status: 'online',
      customStatus: 'BSAA Operations / Triage',
    },
  });

  const claire = await prisma.user.upsert({
    where: { email: 'claire@capcom.local' },
    update: { passwordHash: defaultPasswordHash, customStatus: 'Translating MH Wilds quest text' },
    create: {
      username: 'claire_translator',
      email: 'claire@capcom.local',
      passwordHash: defaultPasswordHash,
      displayName: 'Claire Redfield (EFIGS Translator)',
      locRole: 'TRANSLATOR',
      primaryLocale: 'en-US',
      targetLocales: ['de-DE', 'fr-FR'],
      status: 'away',
      customStatus: 'Translating MH Wilds quest text',
    },
  });

  const carlos = await prisma.user.upsert({
    where: { email: 'carlos@capcom.local' },
    update: { passwordHash: defaultPasswordHash, customStatus: 'Testing PS5 & Steam Deck builds' },
    create: {
      username: 'carlos_lqa',
      email: 'carlos@capcom.local',
      passwordHash: defaultPasswordHash,
      displayName: 'Carlos Oliveira (Console LQA)',
      locRole: 'LQA_TESTER',
      primaryLocale: 'es-ES',
      targetLocales: ['es-ES', 'pt-BR'],
      status: 'in_sprint',
      customStatus: 'Testing PS5 & Steam Deck builds',
    },
  });

  const chunli = await prisma.user.upsert({
    where: { email: 'chunli@capcom.local' },
    update: { passwordHash: defaultPasswordHash, customStatus: 'Coordinating CJK font matrices' },
    create: {
      username: 'chunli_coord',
      email: 'chunli@capcom.local',
      passwordHash: defaultPasswordHash,
      displayName: 'Chun-Li (Script Coordinator)',
      locRole: 'GENERAL_USER',
      primaryLocale: 'zh-CN',
      targetLocales: ['zh-CN', 'ja-JP'],
      status: 'offline',
      customStatus: 'Coordinating CJK font matrices',
    },
  });

  // ===================================
  // SEEDING DUMMY CHANNELS FOR TESTING
  // ===================================
  const mhChannel = await prisma.channel.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {
      status: 'Sprint: Polish cutscene & HUD text for TGS demo',
      projectTag: 'MH-WILDS',
      localeTag: 'GLOBAL',
    },
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'loc-mh-wilds',
      description: 'Monster Hunter Wilds main localization coordination channel',
      status: 'Sprint: Polish cutscene & HUD text for TGS demo',
      type: 'PUBLIC_PROJECT',
      projectTag: 'MH-WILDS',
      localeTag: 'GLOBAL',
      createdById: leon.id,
    },
  });

  const reChannel = await prisma.channel.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {
      name: 'loc-re-requiem',
      description: 'Resident Evil Requiem dialogue & lore verification',
      status: 'Voice-over recording lock in progress',
      projectTag: 'RE-REQUIEM',
      localeTag: 'JA->EN',
    },
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'loc-re-requiem',
      description: 'Resident Evil Requiem dialogue & lore verification',
      status: 'Voice-over recording lock in progress',
      type: 'PUBLIC_PROJECT',
      projectTag: 'RE-REQUIEM',
      localeTag: 'JA->EN',
      createdById: ada.id,
    },
  });

  const pragChannel = await prisma.channel.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {
      name: 'loc-pragmata',
      description: 'Restricted LQA & telemetry triage for PRAGMATA lunar builds',
      status: 'NDA / Production build access only',
      projectTag: 'PRAGMATA',
      localeTag: 'GLOBAL',
    },
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      name: 'loc-pragmata',
      description: 'Restricted LQA & telemetry triage for PRAGMATA lunar builds',
      status: 'NDA / Production build access only',
      type: 'PRIVATE_LOCALE',
      projectTag: 'PRAGMATA',
      localeTag: 'GLOBAL',
      createdById: chris.id,
    },
  });

  // Direct Message Channels (Multi-Persona Ecosystem)
  const dm1 = await prisma.channel.upsert({
    where: { id: '00000000-0000-0000-0000-000000000011' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000011',
      name: null,
      description: null,
      status: null,
      type: 'DIRECT_MESSAGE',
      projectTag: null,
      localeTag: null,
      createdById: jill.id,
    },
  });

  const dm2 = await prisma.channel.upsert({
    where: { id: '00000000-0000-0000-0000-000000000012' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000012',
      name: null,
      description: null,
      status: null,
      type: 'DIRECT_MESSAGE',
      projectTag: null,
      localeTag: null,
      createdById: ada.id,
    },
  });

  const dm3 = await prisma.channel.upsert({
    where: { id: '00000000-0000-0000-0000-000000000013' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000013',
      name: null,
      description: null,
      status: null,
      type: 'DIRECT_MESSAGE',
      projectTag: null,
      localeTag: null,
      createdById: carlos.id,
    },
  });

  const dm4 = await prisma.channel.upsert({
    where: { id: '00000000-0000-0000-0000-000000000014' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000014',
      name: null,
      description: null,
      status: null,
      type: 'DIRECT_MESSAGE',
      projectTag: null,
      localeTag: null,
      createdById: chris.id,
    },
  });

  const dm5 = await prisma.channel.upsert({
    where: { id: '00000000-0000-0000-0000-000000000015' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000015',
      name: null,
      description: null,
      status: null,
      type: 'DIRECT_MESSAGE',
      projectTag: null,
      localeTag: null,
      createdById: ada.id,
    },
  });

  // ===================================
  // SEEDING CHANNEL MEMBERSHIPS
  // ===================================
  // 1. Monster Hunter Channel Members (All studio personas)
  const mhMembers = [
    { user: dante, role: 'admin' },
    { user: jill, role: 'member' },
    { user: leon, role: 'member' },
    { user: ada, role: 'member' },
    { user: claire, role: 'member' },
    { user: carlos, role: 'member' },
    { user: chunli, role: 'member' },
    { user: nero, role: 'member' },
    { user: chris, role: 'member' },
  ];
  for (const m of mhMembers) {
    await prisma.channelMember.upsert({
      where: { channelId_userId: { channelId: mhChannel.id, userId: m.user.id } },
      update: { role: m.role },
      create: { channelId: mhChannel.id, userId: m.user.id, role: m.role },
    });
  }

  // 2. Resident Evil Channel Members
  const reMembers = [
    { user: ada, role: 'admin' },
    { user: jill, role: 'member' },
    { user: dante, role: 'member' },
    { user: leon, role: 'member' },
    { user: nero, role: 'member' },
    { user: chris, role: 'member' },
    { user: carlos, role: 'member' },
  ];
  for (const m of reMembers) {
    await prisma.channelMember.upsert({
      where: { channelId_userId: { channelId: reChannel.id, userId: m.user.id } },
      update: { role: m.role },
      create: { channelId: reChannel.id, userId: m.user.id, role: m.role },
    });
  }

  // 3. PRAGMATA Restricted Channel Members (Excludes Dante to showcase private invite flow)
  const pragMembers = [
    { user: chris, role: 'admin' },
    { user: jill, role: 'member' },
    { user: leon, role: 'member' },
    { user: carlos, role: 'member' },
    { user: chunli, role: 'member' },
  ];
  for (const m of pragMembers) {
    await prisma.channelMember.upsert({
      where: { channelId_userId: { channelId: pragChannel.id, userId: m.user.id } },
      update: { role: m.role },
      create: { channelId: pragChannel.id, userId: m.user.id, role: m.role },
    });
  }

  // 4. Direct Message Memberships
  const dmPairs = [
    { channel: dm1, users: [jill, dante] },
    { channel: dm2, users: [dante, ada] },
    { channel: dm3, users: [jill, carlos] },
    { channel: dm4, users: [leon, chris] },
    { channel: dm5, users: [leon, ada] },
  ];
  for (const pair of dmPairs) {
    for (const u of pair.users) {
      await prisma.channelMember.upsert({
        where: { channelId_userId: { channelId: pair.channel.id, userId: u.id } },
        update: { role: 'member' },
        create: { channelId: pair.channel.id, userId: u.id, role: 'member' },
      });
    }
  }

  // ===================================
  // SEEDING LOCALIZATION STRINGS & DIALOGUE
  // ===================================
  const seedStrings = [
    // 1. Monster Hunter Wilds
    {
      stringKey: 'LOC-MH-001',
      projectTag: 'MH-WILDS',
      sourceText: '「調査隊の皆さん、準備はよろしいですか？\n禁足地への道中、激しい砂嵐が予想されます。環境生物の動きに注意し、導蟲の反応を見失わないようにしてください。\n一狩りいこうぜ！」',
      targetLocale: 'en-US',
      targetText: '"Members of the Research Commission, are you fully equipped?\nA fierce sandstorm is forecasted on our expedition route into the Forbidden Lands. Keep a vigilant eye on local endemic life, and do not lose sight of your Scoutflies\' trail.\nLet\'s hunt!"',
      charLimit: 280,
      contextNotes: '[SPEAKER]: Alma (Guild Receptionist)\n[SCENE]: Chapter 1 briefing cinematic before departure from base camp.\n[AUDIO]: Dynamic lip-sync enabled. Cadence must match the Japanese voice track within a 0.5s tolerance.\n[LORE]: "Scoutflies" (導蟲) is a canonical term; do not localize as "tracker bugs".',
      status: 'APPROVED' as const,
    },
    {
      stringKey: 'LOC-MH-002',
      projectTag: 'MH-WILDS',
      sourceText: '「いい鉄が入ったよ！この竜骨と組み合わせれば、どんな甲殻も両断できる大剣が打てる。\n素材を集めてきてくれれば、すぐに取り掛かるよ！」',
      targetLocale: 'en-US',
      targetText: '"Top-grade ore just arrived! Combine this with Wyvern bones, and I can forge a Great Sword capable of severing any carapace.\nBring me the materials, and I\'ll fire up the furnace immediately!"',
      charLimit: 240,
      contextNotes: '[SPEAKER]: Gemma (Master Smithy)\n[VOICE]: Energetic, warm, tomboyish inflection.\n[SUBTITLE]: Displays above forge interaction menu.',
      status: 'IN_REVIEW' as const,
    },
    {
      stringKey: 'LOC-MH-003',
      projectTag: 'MH-WILDS',
      sourceText: '「大型モンスターの討伐または捕獲に失敗しました。キャンプに戻り、装備とアイテムを再編成して再挑戦してください。」',
      targetLocale: 'de-DE',
      targetText: '"Die Jagd ist fehlgeschlagen! Das Großmonster konnte weder erfolgreich erlegt noch gefangen genommen werden. Bitte kehren Sie unverzüglich in das Basislager zurück, um Ihre Ausrüstung sowie Jagdobjekte neu zu organisieren und die Quest erneut zu starten."',
      charLimit: 190,
      contextNotes: '[CATEGORY]: Quest Completion HUD Dialogue Box\n[UI CONSTRAINT]: Quest failure notification banner is hard-capped to 190 characters to avoid clipping into the mini-map frame.\n[LQA BUG]: German compound nouns ("Großmonster", "unverzüglich") expand 34% beyond UI boundary ceiling (255 / 190 chars).\n[SHOWCASE STATUS]: Strictly kept in LQA_FLAGGED state to demonstrate the industrial hazard cross-hatch gauge.',
      status: 'LQA_FLAGGED' as const,
    },
    {
      stringKey: 'LOC-MH-004',
      projectTag: 'MH-WILDS',
      sourceText: '「セクレトを呼びますか？\nセクレトに騎乗中は自動で目的地へ移動しながら、アイテムの使用や武器の研磨が可能です。」',
      targetLocale: 'en-US',
      targetText: '"Summon your Seikret?\nWhile mounted on your Seikret, you will automatically navigate toward your objective while retaining the ability to consume items or sharpen your weapon."',
      charLimit: 220,
      contextNotes: '[TUTORIAL]: HUD tutorial modal appearing on first mount.\n[SYSTEM]: "Seikret" (セクレト) is canonical mount name.',
      status: 'APPROVED' as const,
    },
    {
      stringKey: 'STR_ITEM_DEMONDRUG',
      projectTag: 'MH-WILDS',
      sourceText: '鬼神薬：飲むと体内に力がみなぎり、攻撃力が上昇する。一度効果を得ると、力尽きるまでその効果は継続する。\n※鬼神薬グレートの調合素材としても使用可能。',
      targetLocale: 'en-US',
      targetText: 'Demondrug: Increases attack power by stimulating internal vigor. Once consumed, the effect persists until fainting or quest completion.\n*Can also be used as a crafting catalyst for Mega Demondrug.',
      charLimit: 220,
      contextNotes: '[CATEGORY]: In-game item pouch & supply box tooltip.\n[UI CONSTRAINT]: Item description window is locked to 3 lines in standard 1080p HUD; maintain concise sentence structure.\n[TRADEOFF]: Preserved legacy term "Demondrug" consistent since Monster Hunter (2004).',
      status: 'APPROVED' as const,
    },
    {
      stringKey: 'STR_ITEM_HERBAL_MEDICINE',
      projectTag: 'MH-WILDS',
      sourceText: '漢方薬：毒を解毒し、体力をわずかに回復する携帯薬。解毒薬よりも素早く摂取できる。',
      targetLocale: 'en-US',
      targetText: 'Herbal Medicine: Cures poison status while slightly restoring health. Can be ingested significantly faster than standard Antidote.',
      charLimit: 160,
      contextNotes: '[ITEM]: Quick-use consumable potion in field pouch.\n[CANON]: "Herbal Medicine" established in legacy MH titles.',
      status: 'APPROVED' as const,
    },
    {
      stringKey: 'STR_HUD_FOCUS_MODE',
      projectTag: 'MH-WILDS',
      sourceText: '集中モード：照準を合わせた方向に攻撃やガードを行う。モンスターの傷口や弱点を狙いやすくなる。',
      targetLocale: 'en-US',
      targetText: 'Focus Mode: Directs attacks and guards toward your targeting reticle. Highlights monster wounds and anatomical weak points.',
      charLimit: 170,
      contextNotes: '[HUD]: Combat system tutorial prompt.\n[CORE MECHANIC]: Wilds signature combat mechanic.',
      status: 'APPROVED' as const,
    },

    // 2. Resident Evil Requiem
    {
      stringKey: 'LOC-REQ-001',
      projectTag: 'RE-REQUIEM',
      sourceText: '【通信：シェリー・バーキン】\n「レオン、聞こえる\？何度も連絡しようとしたのよ。\n現場の警官と連絡が途絶えた。慎重に進んでくれ。」',
      targetLocale: 'en-US',
      targetText: '"[COMM LINK: Sherry Birkin]\nLeon, do you copy? I\'ve been trying to reach you.\nI lost contact with the cop in the scene. Please proceed carefully."',
      charLimit: 260,
      contextNotes: '[COMMS]: Sherry Birkin transmission to Leon S. Kennedy during Chapter 1.\n[AUDIO]: Low-pass radio filter applied.\n[CANON]: "Sherry Birkin" DSO Special Operations Agent.',
      status: 'APPROVED' as const,
    },
    {
      stringKey: 'LOC-REQ-002',
      projectTag: 'RE-REQUIEM',
      sourceText: '"[緊急警報：プロトコル・オメガ発動]\nセクター4におけるクラスIV有機生命体兵器の封じ込めプロトコルが完全に破綻しました。\n全施設職員は、ただちに指定された避難経路から退避してください。\n緊急隔壁は3分後に閉鎖されます。"',
      targetLocale: 'en-US',
      targetText: '"[EMERGENCY ALERT: Protocol Omega Triggered]\nContainment protocol for Class-IV Bio-Organic specimens in Sector 4 has catastrophically failed.\nAll facility staff must evacuate immediately via the designated exits.\nEmergency Shutters will be engaged in 3 minutes."',
      charLimit: 340,
      contextNotes: '[SYSTEM]: Announcement made over the PA system.\n[LQA BUG]: Line 3 text clips beneath lower viewport on 21:9 ultra-wide displays.\n[ATTACHMENT]: re_care_center_overflow.png.',
      status: 'LQA_FLAGGED' as const,
    },
    {
      stringKey: 'LOC-REQ-003',
      projectTag: 'RE-REQUIEM',
      sourceText: '研究主任の手記（血痕が付着している）：\n「被験体Ωの細胞変異が想定速度を上回っている。\n適合抗体を投与したが拒絶反応が止まらない。\nあの怪物はもう……人間の言葉を理解していない。」',
      targetLocale: 'en-US',
      targetText: '"Chief Researcher\'s Bloodstained Log:\nSubject Omega\'s cellular mutation has exceeded projected models.\nAdministered the matching antibody, but violent rejection persists.\nThat monstrosity no longer... comprehends human speech."',
      charLimit: 250,
      contextNotes: '[LORE DOCUMENT]: Found on lab examination table.\n[TONE]: Frantic desperation as infection spreads through the research bunker.',
      status: 'IN_REVIEW' as const,
    },
    {
      stringKey: 'STR_ITEM_GREEN_HERB',
      projectTag: 'RE-REQUIEM',
      sourceText: '体力をわずかに回復する緑色のハーブ。組み合わせることで回復量が大きく上がる。',
      targetLocale: 'en-US',
      targetText: 'A green herb that will restore a small amount of health. Can be combined to enhance their effects.',
      charLimit: 140,
      contextNotes: '[INVENTORY]: Signature Resident Evil recovery item.\n[CANON]: Canonical item name since Resident Evil (1996).',
      status: 'APPROVED' as const,
    },
    {
      stringKey: 'STR_ITEM_INJECTOR',
      projectTag: 'RE-REQUIEM',
      sourceText: '神経中和インジェクター：ウイルスの進行を一時的に抑制し、運動機能を回復させる即効性注射器。',
      targetLocale: 'en-US',
      targetText: 'Neural Injector: Rapid-action auto-injector that temporarily suppresses viral progression and restores fine motor reflexes.',
      charLimit: 170,
      contextNotes: '[INVENTORY]: Specialized key item for managing infection levels.',
      status: 'APPROVED' as const,
    },

    // 3. Pragmata
    {
      stringKey: 'LOC-PRAG-001',
      projectTag: 'PRAGMATA',
      sourceText: '【同期率98.4%】\n「ヒュー、聞こえますか？シールドのハッキングが終わりました！\nもう一度銃を使って！」',
      targetLocale: 'en-US',
      targetText: '"[UPLINK BROADCAST: Sync Ratio 98.4%]\nHugh, can you hear me? I\'ve hacked into it\'s shields.\nTry using your gun again!"',
      charLimit: 260,
      contextNotes: '[CINEMATIC]: Android is closely approaching Hugh, Diana provides assistance.\n[VOICE]: Diana (synthetic/human hybrid tone, shouting with urgency).',
      status: 'IN_REVIEW' as const,
    },
    {
      stringKey: 'LOC-PRAG-002',
      projectTag: 'PRAGMATA',
      sourceText: '【バイザースーツ通信】\n「ダイアナ、シールド整合性の低下を確認した。\n重力アンカーを展開して足場を固定する。衝撃に備えろ！」',
      targetLocale: 'en-US',
      targetText: '"[EXO-SUIT HUD COMMS]\nDiana, confirming shield integrity decay.\nDeploying gravitational anchor to stabilize ground contact. Brace for kinetic shock!"',
      charLimit: 220,
      contextNotes: '[IN-GAME HUD]: Main protagonist Hugh talking through helmet radio.',
      status: 'DRAFT' as const,
    },
    {
      stringKey: 'STR_ITEM_PULSE_CANNON',
      projectTag: 'PRAGMATA',
      sourceText: 'パルスカノン：圧縮重力波を射出する高密度運動エネルギー兵装。\n装甲目標の姿勢を崩し、一時的な重力歪曲フィールドを生成する。',
      targetLocale: 'en-US',
      targetText: 'Pulse Cannon: High-density kinetic armament discharging compressed gravimetric waves.\nStaggers armored chassis targets and deploys a temporary localized gravitational distortion field.',
      charLimit: 240,
      contextNotes: '[WEAPON LOADOUT]: Heavy auxiliary secondary weapon.\n[TERMINOLOGY]: "Gravimetric waves" (重力波) is verified system terminology.',
      status: 'APPROVED' as const,
    },
    {
      stringKey: 'STR_ITEM_GRAV_ANCHOR',
      projectTag: 'PRAGMATA',
      sourceText: '重力アンカー：低重力環境下で術者の慣性質量を一時的に増大させ、ノックバックを防ぐ推進ユニット。',
      targetLocale: 'en-US',
      targetText: 'Grav Anchor: Thruster counter-measure unit that artificially increases inertial mass in low-gravity environments, preventing knockback.',
      charLimit: 210,
      contextNotes: '[EQUIPMENT]: Mobility tech for lunar surface navigation.',
      status: 'APPROVED' as const,
    },
  ];

  for (const str of seedStrings) {
    await prisma.locString.upsert({
      where: { stringKey: str.stringKey },
      update: {
        projectTag: str.projectTag,
        sourceText: str.sourceText,
        targetLocale: str.targetLocale,
        targetText: str.targetText,
        charLimit: str.charLimit,
        contextNotes: str.contextNotes,
        status: str.status,
      },
      create: str,
    });
  }

  // ===================================
  // SEEDING SIMULATED CONVERSATIONAL STREAMS & ATTACHMENTS
  // ===================================
  const locMap = new Map<string, string>();
  const allStrings = await prisma.locString.findMany();
  for (const s of allStrings) {
    locMap.set(s.stringKey, s.id);
  }

  // 1. Audit Trail for LOC-MH-003 (Monster Hunter Wilds German text overflow)
  // Kept strictly LQA_FLAGGED as live showcase for the hazard cross-hatch gauge!
  const mh003Id = locMap.get('LOC-MH-003');
  if (mh003Id) {
    await prisma.locStringAudit.upsert({
      where: { id: '00000000-0000-0000-0000-000000000101' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000101',
        locStringId: mh003Id,
        userId: jill.id,
        oldStatus: 'IN_REVIEW',
        newStatus: 'LQA_FLAGGED',
        createdAt: new Date(Date.now() - 3600000 * 2), // 2 hours ago
      },
    });
  }

  // 2. Audit Trail for LOC-REQ-002 (Resident Evil Requiem lockdown emergency alert)
  const req002Id = locMap.get('LOC-REQ-002');
  if (req002Id) {
    await prisma.locStringAudit.upsert({
      where: { id: '00000000-0000-0000-0000-000000000104' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000104',
        locStringId: req002Id,
        userId: nero.id,
        oldStatus: 'DRAFT',
        newStatus: 'IN_REVIEW',
        createdAt: new Date(Date.now() - 3600000 * 2),
      },
    });

    await prisma.locStringAudit.upsert({
      where: { id: '00000000-0000-0000-0000-000000000105' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000105',
        locStringId: req002Id,
        userId: leon.id,
        oldStatus: 'IN_REVIEW',
        newStatus: 'LQA_FLAGGED',
        createdAt: new Date(Date.now() - 3600000 * 1),
      },
    });
  }

  // 3. Audit Trail for LOC-PRAG-001 (Pragmata Diana uplink broadcast)
  const prag001Id = locMap.get('LOC-PRAG-001');
  if (prag001Id) {
    await prisma.locStringAudit.upsert({
      where: { id: '00000000-0000-0000-0000-000000000106' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000106',
        locStringId: prag001Id,
        userId: carlos.id,
        oldStatus: 'DRAFT',
        newStatus: 'IN_REVIEW',
        createdAt: new Date(Date.now() - 3600000 * 1.5),
      },
    });
  }

  // Helper to seed a message, its attachment, and its locStringRefs
  interface SeedMessageSpec {
    id: string;
    channelId: string;
    senderId: string;
    content: string;
    hoursAgo: number;
    attachment?: {
      id: string;
      fileName: string;
      fileUrl: string;
      fileType: 'SCREENSHOT_BUG' | 'IMAGE';
      fileSize: number;
      localeTag: string;
    };
    stringKeys?: string[];
  }

  const messagesToSeed: SeedMessageSpec[] = [
    // --- Channel 1: loc-mh-wilds ---
    {
      id: '00000000-0000-0000-0000-000000000201',
      channelId: mhChannel.id,
      senderId: jill.id,
      content: 'Welcome to the Monster Hunter Wilds sprint channel! All teams please review the Chapter 1 departure briefing in #LOC-MH-001. Ensure canonical terms like Scoutflies (導蟲) match the glossary.',
      hoursAgo: 3.5,
      stringKeys: ['LOC-MH-001', 'STR_HUD_FOCUS_MODE'],
    },
    {
      id: '00000000-0000-0000-0000-000000000202',
      channelId: mhChannel.id,
      senderId: dante.id,
      content: "Reviewed #LOC-MH-001. The audio cadence aligns with Japanese voice lines within 0.3s tolerance. Also checked Gemma's smithy dialogue in #LOC-MH-002 and the item tooltip for $STR_ITEM_DEMONDRUG.",
      hoursAgo: 3.0,
      stringKeys: ['LOC-MH-001', 'LOC-MH-002', 'STR_ITEM_DEMONDRUG'],
    },
    {
      id: '00000000-0000-0000-0000-000000000203',
      channelId: mhChannel.id,
      senderId: claire.id,
      content: 'Seikret mount tutorial #LOC-MH-004 is localized for EFIGS. Also confirmed $STR_ITEM_HERBAL_MEDICINE fits within item menu description box.',
      hoursAgo: 2.5,
      stringKeys: ['LOC-MH-004', 'STR_ITEM_HERBAL_MEDICINE'],
    },
    {
      id: '00000000-0000-0000-0000-000000000204',
      channelId: mhChannel.id,
      senderId: jill.id,
      content: 'Discovered text overflow in #LOC-MH-003! The German quest failure dialogue banner exceeds the 190-character HUD ceiling by 65 characters. Truncating severely on 1080p and Steam Deck builds. Flagging for dev triage.',
      hoursAgo: 1.8,
      attachment: {
        id: '00000000-0000-0000-0000-000000000301',
        fileName: 'mh_wilds_de_overflow.png',
        fileUrl: '/uploads/demo/mh_wilds_de_overflow.png',
        fileType: 'SCREENSHOT_BUG',
        fileSize: 482104,
        localeTag: 'UI-OVERFLOW',
      },
      stringKeys: ['LOC-MH-003'],
    },
    {
      id: '00000000-0000-0000-0000-000000000205',
      channelId: mhChannel.id,
      senderId: leon.id,
      content: '> @Jill Valentine (LQA Specialist): Discovered text overflow in #LOC-MH-003! The German quest failure dialogue banner exceeds the 190-character HUD ceiling...\nConfirmed on RE ENGINE font bounds. The dialog frame hard-clips at 190 chars. Keeping #LOC-MH-003 flagged until translators provide a compressed string. @claire_translator @dante_translator',
      hoursAgo: 1.0,
      stringKeys: ['LOC-MH-003'],
    },

    // --- Channel 2: loc-re-requiem ---
    {
      id: '00000000-0000-0000-0000-000000000211',
      channelId: reChannel.id,
      senderId: ada.id,
      content: "Opening Resident Evil Requiem script & terminology triage channel. Please verify tactical items like $STR_ITEM_GREEN_HERB and $STR_ITEM_INJECTOR before tomorrow's build cut.",
      hoursAgo: 4.0,
      stringKeys: ['STR_ITEM_GREEN_HERB', 'STR_ITEM_INJECTOR'],
    },
    {
      id: '00000000-0000-0000-0000-000000000212',
      channelId: reChannel.id,
      senderId: dante.id,
      content: "Sherry Birkin's Chapter 1 comm link insertion #LOC-REQ-001 is verified against the Japanese audio stems. Lip-sync matches well.",
      hoursAgo: 3.2,
      stringKeys: ['LOC-REQ-001'],
    },
    {
      id: '00000000-0000-0000-0000-000000000213',
      channelId: reChannel.id,
      senderId: nero.id,
      content: 'Cutscene 04 facility lockdown PA alert #LOC-REQ-002 has line-break clipping on wide aspect ratio monitors. Line 3 drops below the visible boundary.',
      hoursAgo: 2.0,
      attachment: {
        id: '00000000-0000-0000-0000-000000000302',
        fileName: 're_care_center_overflow.png',
        fileUrl: '/uploads/demo/re_care_center_overflow.png',
        fileType: 'SCREENSHOT_BUG',
        fileSize: 521940,
        localeTag: 'LINE-BREAK',
      },
      stringKeys: ['LOC-REQ-002'],
    },
    {
      id: '00000000-0000-0000-0000-000000000214',
      channelId: reChannel.id,
      senderId: leon.id,
      content: "> @Nero (Audio & Lip-Sync): Cutscene 04 facility lockdown PA alert #LOC-REQ-002 has line-break clipping on wide aspect ratio monitors...\nI'll adjust the subtitle container padding in the engine build. Setting #LOC-REQ-002 to LQA_FLAGGED for now.",
      hoursAgo: 1.1,
      stringKeys: ['LOC-REQ-002'],
    },
    {
      id: '00000000-0000-0000-0000-000000000215',
      channelId: reChannel.id,
      senderId: carlos.id,
      content: 'Also checked lab document #LOC-REQ-003 on PS5 dev kits. Text renders cleanly across Spanish and Portuguese builds.',
      hoursAgo: 0.4,
      stringKeys: ['LOC-REQ-003'],
    },

    // --- Channel 3: loc-pragmata ---
    {
      id: '00000000-0000-0000-0000-000000000221',
      channelId: pragChannel.id,
      senderId: chris.id,
      content: 'Confidential PRAGMATA localization channel. Access restricted to authorized team members. Reviewing lunar telemetry dialogue and item constants like $STR_ITEM_PULSE_CANNON.',
      hoursAgo: 3.0,
      stringKeys: ['STR_ITEM_PULSE_CANNON'],
    },
    {
      id: '00000000-0000-0000-0000-000000000222',
      channelId: pragChannel.id,
      senderId: carlos.id,
      content: "Ran telemetry checks on PS5 dev kits. Diana's uplink dialogue #LOC-PRAG-001 currently has raw Japanese Kanji showing in the English HUD ($STR_ITEM_GRAV_ANCHOR is displaying properly). Attached capture.",
      hoursAgo: 1.5,
      attachment: {
        id: '00000000-0000-0000-0000-000000000303',
        fileName: 'pragmata_untranslated_hud.png',
        fileUrl: '/uploads/demo/pragmata_untranslated_hud.png',
        fileType: 'SCREENSHOT_BUG',
        fileSize: 614020,
        localeTag: 'UNTRANSLATED',
      },
      stringKeys: ['LOC-PRAG-001', 'STR_ITEM_GRAV_ANCHOR'],
    },
    {
      id: '00000000-0000-0000-0000-000000000223',
      channelId: pragChannel.id,
      senderId: leon.id,
      content: "> @Carlos Oliveira (Console LQA): Ran telemetry checks on PS5 dev kits. Diana's uplink dialogue #LOC-PRAG-001 currently has raw Japanese Kanji...\nInvestigating the font fallback atlas for PRAGMATA. Looks like the CJK glyph table leaked into the English string pack. Checking #LOC-PRAG-002 as well.",
      hoursAgo: 0.6,
      stringKeys: ['LOC-PRAG-001', 'LOC-PRAG-002'],
    },

    // --- Channel 4: Direct Message (dm1: Jill & Dante) ---
    {
      id: '00000000-0000-0000-0000-000000000231',
      channelId: dm1.id,
      senderId: jill.id,
      content: 'Hey @dante_translator, do you have a quick second to review the Japanese source for $STR_ITEM_DEMONDRUG? Wanted to make sure our Spanish team uses the canonical translation.',
      hoursAgo: 0.8,
      stringKeys: ['STR_ITEM_DEMONDRUG'],
    },
    {
      id: '00000000-0000-0000-0000-000000000232',
      channelId: dm1.id,
      senderId: dante.id,
      content: "> @Jill Valentine (LQA Specialist): Hey @dante_translator, do you have a quick second to review the Japanese source for $STR_ITEM_DEMONDRUG?...\nHey Jill! Absolutely. The Japanese term is 鬼神薬 (Kishinyaku), and the canonical English is Demondrug. The Spanish team should use 'Droga demoníaca' as established in MH World.",
      hoursAgo: 0.5,
      stringKeys: ['STR_ITEM_DEMONDRUG'],
    },
    {
      id: '00000000-0000-0000-0000-000000000233',
      channelId: dm1.id,
      senderId: jill.id,
      content: 'Awesome, thanks Dante! Updated the ticket and marked the glossary note. See you in the sprint review!',
      hoursAgo: 0.2,
    },

    // --- Channel 5: Direct Message (dm2: Dante & Ada) ---
    {
      id: '00000000-0000-0000-0000-000000000241',
      channelId: dm2.id,
      senderId: ada.id,
      content: "Dante, what's our ETA on the Chapter 1 narrative strings for Monster Hunter? Production is locking the voice recording schedule.",
      hoursAgo: 2.0,
    },
    {
      id: '00000000-0000-0000-0000-000000000242',
      channelId: dm2.id,
      senderId: dante.id,
      content: 'Just wrapped up #LOC-MH-001 and #LOC-MH-002. Voice director approved the cadence. EFIGS team is doing their pass now.',
      hoursAgo: 1.2,
      stringKeys: ['LOC-MH-001', 'LOC-MH-002'],
    },
    {
      id: '00000000-0000-0000-0000-000000000243',
      channelId: dm2.id,
      senderId: ada.id,
      content: 'Excellent work. Let me know as soon as the German team finishes reviewing the quest failure banner.',
      hoursAgo: 0.7,
    },

    // --- Channel 6: Direct Message (dm3: Jill & Carlos) ---
    {
      id: '00000000-0000-0000-0000-000000000251',
      channelId: dm3.id,
      senderId: carlos.id,
      content: 'Hey Jill, did you catch that HUD clipping issue on the Steam Deck 800p resolution?',
      hoursAgo: 1.8,
    },
    {
      id: '00000000-0000-0000-0000-000000000252',
      channelId: dm3.id,
      senderId: jill.id,
      content: 'Yeah, flagged it in #loc-mh-wilds! German string #LOC-MH-003 is overflowing by 65 characters. Leon is checking container margins.',
      hoursAgo: 1.1,
      stringKeys: ['LOC-MH-003'],
    },
    {
      id: '00000000-0000-0000-0000-000000000253',
      channelId: dm3.id,
      senderId: carlos.id,
      content: "Got it, I'll test the European release builds on PS5 as soon as dev pushes the hotfix.",
      hoursAgo: 0.3,
    },

    // --- Channel 7: Direct Message (dm4: Leon & Chris) ---
    {
      id: '00000000-0000-0000-0000-000000000261',
      channelId: dm4.id,
      senderId: chris.id,
      content: 'Leon, how is the dynamic font texture atlas holding up with the new CJK character sets?',
      hoursAgo: 2.5,
    },
    {
      id: '00000000-0000-0000-0000-000000000262',
      channelId: dm4.id,
      senderId: leon.id,
      content: 'Font memory budget is within 16MB for 4K textures. Just tracking down that fallback issue Carlos reported in #LOC-PRAG-001.',
      hoursAgo: 1.6,
      stringKeys: ['LOC-PRAG-001'],
    },
    {
      id: '00000000-0000-0000-0000-000000000263',
      channelId: dm4.id,
      senderId: chris.id,
      content: 'Keep me posted. We have the executive milestone presentation on Friday.',
      hoursAgo: 0.8,
    },

    // --- Channel 8: Direct Message (dm5: Leon & Ada) ---
    {
      id: '00000000-0000-0000-0000-000000000271',
      channelId: dm5.id,
      senderId: ada.id,
      content: 'Leon, will the subtitle container resizing require a client rebuild or can we hot-patch it via the localization manifest?',
      hoursAgo: 1.9,
    },
    {
      id: '00000000-0000-0000-0000-000000000272',
      channelId: dm5.id,
      senderId: leon.id,
      content: "It's handled dynamically by our text layout engine. Once the string charLimit is respected in CapsLoc, the in-game UI automatically recalculates.",
      hoursAgo: 1.0,
    },
    {
      id: '00000000-0000-0000-0000-000000000273',
      channelId: dm5.id,
      senderId: ada.id,
      content: 'Perfect. That saves us a 3-hour deployment cycle.',
      hoursAgo: 0.4,
    },
  ];

  for (const m of messagesToSeed) {
    const msg = await prisma.message.upsert({
      where: { id: m.id },
      update: {
        content: m.content,
        createdAt: new Date(Date.now() - 3600000 * m.hoursAgo),
      },
      create: {
        id: m.id,
        channelId: m.channelId,
        senderId: m.senderId,
        content: m.content,
        createdAt: new Date(Date.now() - 3600000 * m.hoursAgo),
      },
    });

    if (m.attachment) {
      await prisma.attachment.upsert({
        where: { id: m.attachment.id },
        update: {
          messageId: msg.id,
          fileName: m.attachment.fileName,
          fileUrl: m.attachment.fileUrl,
          fileType: m.attachment.fileType,
          fileSize: m.attachment.fileSize,
          localeTag: m.attachment.localeTag,
        },
        create: {
          id: m.attachment.id,
          messageId: msg.id,
          fileName: m.attachment.fileName,
          fileUrl: m.attachment.fileUrl,
          fileType: m.attachment.fileType,
          fileSize: m.attachment.fileSize,
          localeTag: m.attachment.localeTag,
          createdAt: msg.createdAt,
        },
      });
    }

    if (m.stringKeys && m.stringKeys.length > 0) {
      for (const k of m.stringKeys) {
        const sId = locMap.get(k);
        if (sId) {
          await prisma.locStringRef.upsert({
            where: {
              messageId_locStringId: {
                messageId: msg.id,
                locStringId: sId,
              },
            },
            update: {},
            create: {
              messageId: msg.id,
              locStringId: sId,
            },
          });
        }
      }
    }
  }

  // Update lastReadAt for demo personas to simulate realistic unread counters:
  // - Dante unread in reChannel (5h ago) and dm1 (20m ago)
  await prisma.channelMember.update({
    where: { channelId_userId: { channelId: reChannel.id, userId: dante.id } },
    data: { lastReadAt: new Date(Date.now() - 3600000 * 5) },
  });
  await prisma.channelMember.update({
    where: { channelId_userId: { channelId: dm1.id, userId: dante.id } },
    data: { lastReadAt: new Date(Date.now() - 60000 * 20) },
  });

  // - Jill unread in dm3 (Carlos's message 18 mins ago)
  await prisma.channelMember.update({
    where: { channelId_userId: { channelId: dm3.id, userId: jill.id } },
    data: { lastReadAt: new Date(Date.now() - 60000 * 25) },
  });

  // - Leon unread in dm4 (Chris's message 48 mins ago) and dm5 (Ada's message 24 mins ago)
  await prisma.channelMember.update({
    where: { channelId_userId: { channelId: dm4.id, userId: leon.id } },
    data: { lastReadAt: new Date(Date.now() - 3600000 * 1.2) },
  });
  await prisma.channelMember.update({
    where: { channelId_userId: { channelId: dm5.id, userId: leon.id } },
    data: { lastReadAt: new Date(Date.now() - 60000 * 30) },
  });

  // ===================================
  // SEEDING CANONICAL GLOSSARY TERMS ACROSS CAPCOM UNIVERSES
  // ===================================
  const glossaryEntries = [
    // Monster Hunter Wilds
    {
      termKey: 'DEMONDRUG',
      category: 'Item',
      sourceJa: '鬼神薬',
      targetEn: 'Demondrug',
      projectTag: 'MH-WILDS',
      notes: 'Canonical franchise term since Monster Hunter (2004). Never translate as "Demon Potion" or "Devil Elixir". When consumed in-game, triggers the hunter\'s flex/roar vocalization animation. Synergizes with Might Seed crafting recipes.',
    },
    {
      termKey: 'HERBAL_MEDICINE',
      category: 'Item',
      sourceJa: '漢方薬',
      targetEn: 'Herbal Medicine',
      projectTag: 'MH-WILDS',
      notes: 'Quick-use potion combining Antidote and Blue Mushroom. Faster consumption animation than standard Antidote.',
    },
    {
      termKey: 'RATHALOS',
      category: 'Monster',
      sourceJa: 'リオレウス',
      targetEn: 'Rathalos',
      projectTag: 'MH-WILDS',
      notes: 'King of the Skies (空の王者). Flying Wyvern apex predator of the Ancient Forest. Retain uniform Latinization across all EFIGS localization targets.',
    },
    {
      termKey: 'PALICO',
      category: 'Character',
      sourceJa: 'オトモアイルー',
      targetEn: 'Palico',
      projectTag: 'MH-WILDS',
      notes: 'Felyne companion warrior. Portmanteau of "Pal" and "Calico". Plural is "Palicoes". In English localization, dialogue must feature cat puns (e.g., "paws-itively", "purr-fect").',
    },
    {
      termKey: 'SCOUTFLIES',
      category: 'System',
      sourceJa: '導蟲',
      targetEn: 'Scoutflies',
      projectTag: 'MH-WILDS',
      notes: 'Bioluminescent insects stored in a hip cage used for tracking footprints, scent marks, and gathering nodes. Always capitalize as a proper system noun.',
    },
    {
      termKey: 'SEIKRET',
      category: 'Creature',
      sourceJa: 'セクレト',
      targetEn: 'Seikret',
      projectTag: 'MH-WILDS',
      notes: 'Agile bipedal avian mount native to the Forbidden Lands. Features automated autopilot navigation and a secondary weapon holster.',
    },
    {
      termKey: 'FOCUS_MODE',
      category: 'System',
      sourceJa: '集中モード',
      targetEn: 'Focus Mode',
      projectTag: 'MH-WILDS',
      notes: 'Monster Hunter Wilds signature combat mechanic allowing precise crosshair aiming for attacks and guards to wound monster parts.',
    },

    // Resident Evil Requiem
    {
      termKey: 'T_VIRUS',
      category: 'Lore',
      sourceJa: 'T-ウィルス',
      targetEn: 'T-Virus',
      projectTag: 'RE-REQUIEM',
      notes: 'Progenitor-derived Tyrant Virus engineered by Umbrella Pharmaceuticals. Always hyphenated as "T-Virus" (never "TVirus" or "t-virus").',
    },
    {
      termKey: 'HERB_COCKTAIL',
      category: 'Item',
      sourceJa: '調合ハーブ (緑+赤)',
      targetEn: 'Mixed Herb (G+R)',
      projectTag: 'RE-REQUIEM',
      notes: 'Medical compound synthesized by grinding Green and Red herbs. Standardized notation: use single-letter abbreviations in inventory HUD ("G+R", "G+G+G", "G+R+B").',
    },
    {
      termKey: 'FIRST_AID_SPRAY',
      category: 'Item',
      sourceJa: '救急スプレー',
      targetEn: 'First Aid Spray',
      projectTag: 'RE-REQUIEM',
      notes: 'Aerosol restorative agent restoring vitality to 100%. Canonical staple since Resident Evil (1996). Do not localize as "Emergency Spray".',
    },
    {
      termKey: 'BSAA',
      category: 'Faction',
      sourceJa: 'BSAA',
      targetEn: 'Bioterrorism Security Assessment Alliance (BSAA)',
      projectTag: 'RE-REQUIEM',
      notes: 'UN-sanctioned counter-bioterrorism advisory council and paramilitary deployment force co-founded by Chris Redfield and Jill Valentine.',
    },
    {
      termKey: 'BIOHAZARD_OMEGA',
      category: 'Protocol',
      sourceJa: 'バイオハザード・オメガ',
      targetEn: 'Protocol Omega',
      projectTag: 'RE-REQUIEM',
      notes: 'Maximum-tier facility emergency lockdown requiring automated thermal decontamination and airtight subterranean isolation.',
    },
    {
      termKey: 'CONTAINMENT_CELL',
      category: 'Environment',
      sourceJa: '隔離区画',
      targetEn: 'Containment Cell',
      projectTag: 'RE-REQUIEM',
      notes: 'Reinforced ballistic glass enclosures housing Tier-IV viral mutation specimens.',
    },

    // Pragmata
    {
      termKey: 'DIANA',
      category: 'Character',
      sourceJa: 'ディアナ',
      targetEn: 'Diana',
      projectTag: 'PRAGMATA',
      notes: 'Artificial companion android possessing psionic-matter manipulation capabilities. Tone in EN script: naive curiosity blended with precise technological cadence.',
    },
    {
      termKey: 'LUNAR_SHELTER',
      category: 'Environment',
      sourceJa: '月面シェルター',
      targetEn: 'Lunar Shelter',
      projectTag: 'PRAGMATA',
      notes: 'Sub-surface biosphere stations erected during the Cataclysm era. Use "Lunar Shelter" rather than "Moon Base" to reflect civilian refugee origin.',
    },
    {
      termKey: 'PULSE_CANNON',
      category: 'Weapon',
      sourceJa: 'パルスカノン',
      targetEn: 'Pulse Cannon',
      projectTag: 'PRAGMATA',
      notes: 'Kinetic repulsion firearm utilizing compressed gravimetric charges. System UI display name is strictly "PULSE CANNON".',
    },
    {
      termKey: 'GRAV_ANCHOR',
      category: 'Equipment',
      sourceJa: '重力アンカー',
      targetEn: 'Grav Anchor',
      projectTag: 'PRAGMATA',
      notes: 'Exo-suit thruster stabilization unit countering inertial recoil in zero-gravity and lunar surface environments.',
    },
    {
      termKey: 'CATACLYSM_SHIELD',
      category: 'System',
      sourceJa: '大気シールド',
      targetEn: 'Atmospheric Shield',
      projectTag: 'PRAGMATA',
      notes: 'Energy barrier preserving artificial pressure envelopes above lunar stations. Catastrophic rupture triggers immediate biohazard alerts.',
    },
  ];

  for (const entry of glossaryEntries) {
    await prisma.glossaryTerm.upsert({
      where: { termKey: entry.termKey },
      update: {
        category: entry.category,
        sourceJa: entry.sourceJa,
        targetEn: entry.targetEn,
        projectTag: entry.projectTag,
        notes: entry.notes,
      },
      create: entry,
    });
  }

  console.log('✅ Capcom localization datasets seeded successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
