import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
    console.log("Seeding Capcom localization datasets...");

    // hardcode the default password hash for "Password123!" salted with bcrypt and 10 rounds of hashing
    // for seed purposes
    const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

    // ===================================
    // SEEDING OUR DUMMY USERS FOR TESTING 
    // ===================================
    const dante = await prisma.user.upsert({
        where: { email: 'dante@capcom.local' },
        update: { passwordHash: defaultPasswordHash },
        create: {
            username: 'dante_translator',
            email: 'dante@capcom.local',
            passwordHash: defaultPasswordHash,
            displayName: 'Dante (Lead JA->EN Translator)',
            locRole: 'TRANSLATOR',
            primaryLocale: 'ja-JP',
            targetLocales: ['en-US'],
            status: 'online',
        },
    });

    const jill = await prisma.user.upsert({
        where: { email: 'jill@capcom.local' },
        update: { passwordHash: defaultPasswordHash },
        create: {
            username: 'jill_lqa',
            email: 'jill@capcom.local',
            passwordHash: defaultPasswordHash,
            displayName: 'Jill Valentine (LQA Specialist)',
            locRole: 'LQA_TESTER',
            primaryLocale: 'en-US',
            targetLocales: ['en-US', 'de-DE'],
            status: 'online',
        },
    });

    const leon = await prisma.user.upsert({
        where: { email: 'leon@capcom.local' },
        update: { passwordHash: defaultPasswordHash },
        create: {
            username: 'leon_dev',
            email: 'leon@capcom.local',
            passwordHash: defaultPasswordHash,
            displayName: 'Leon S. Kennedy (Solutions Dev)',
            locRole: 'SOLUTIONS_DEV',
            primaryLocale: 'en-US',
            targetLocales: ['global'],
            status: 'online',
        },
    });

    // =================================== 
    // SEEDING DUMMY CHANNELS FOR TESTING 
    // ===================================
    const mhChannel = await prisma.channel.upsert({
        where: { id: '00000000-0000-0000-0000-000000000001' },
        update: {
            status: 'Last 2 weeks until 9/20/26 deadline',
        },
        create: {
            id: '00000000-0000-0000-0000-000000000001',
            name: 'loc-mh-wilds',
            description: 'Monster Hunter Wilds main localization coordination channel',
            status: 'Last 2 weeks until 9/20/26 deadline',
            type: 'PUBLIC_PROJECT',
            projectTag: 'MH-WILDS',
            localeTag: 'GLOBAL',
            createdById: leon.id,
        },
    });

    // =================================== 
    // SEEDING DUMMY CHANNEL MEMBERSHIPS FOR TESTING 
    // ===================================
    await prisma.channelMember.upsert({
        where: { channelId_userId: { channelId: mhChannel.id, userId: dante.id } }, // composite unique key for [channelId, userId]
        update: {
            role: 'admin',
        },
        create: {
            channelId: mhChannel.id,
            userId: dante.id,
            role: 'admin',
        },
    });

    await prisma.channelMember.upsert({
        where: { channelId_userId: { channelId: mhChannel.id, userId: jill.id } },
        update: {},
        create: {
            channelId: mhChannel.id,
            userId: jill.id,
            role: 'member',
        },
    });

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
            stringKey: 'LOC-MH-002',
            projectTag: 'MH-WILDS',
            sourceText: '「いい鉄が入ったよ！この竜骨と組み合わせれば、どんな甲殻も両断できる大剣が打てる。\n素材を集めてきてくれれば、すぐに取り掛かるよ！」',
            targetLocale: 'en-US',
            targetText: '"Top-grade ore just arrived! Combine this with Wyvern bones, and I can forge a Great Sword capable of severing any carapace.\nBring me the materials, and I\'ll fire up the furnace immediately!"',
            charLimit: 240,
            contextNotes: '[SPEAKER]: Gemma (Master Smithy)\n[VOICE]: Energetic, warm, tomboyish inflection.\n[SUBTITLE]: Displays above forge interaction menu.',
            status: 'IN_REVIEW' as const,
        },

        // 2. Resident Evil - Remake
        {
            stringKey: 'LOC-RE-001',
            projectTag: 'Resident Evil - Remake',
            sourceText: '1998年5月19日\n熱い。体が熱くてたまらない。\n背中に大きなデキモノができた。痛くてかゆい。\nメシの肉を生で食った。うまい。\nかゆい　うま',
            targetLocale: 'en-US',
            targetText: 'May 19, 1998\nFever burning up. My whole body is scorching.\nA hideous boil ruptured on my back. Painful and itchy.\nAte the feeder ration raw today. Tasty.\nItchy  Tasty',
            charLimit: 180,
            contextNotes: '[DOCUMENT]: Mansion Laboratory Keeper\'s Diary, Page 4.\n[TONE]: Progressive cognitive deterioration caused by T-Virus infection.\n[CULTURE NOTE]: "Itchy Tasty" (かゆい うま) is an iconic franchise staple; spacing between words must remain exactly two spaces.',
            status: 'APPROVED' as const,
        },
        {
            stringKey: 'STR_ITEM_LOCKPICK',
            projectTag: 'Resident Evil - Remake',
            sourceText: '小さな鍵：シンプルな構造の錠前を開けることができるピッキングツール。\n「マスター・オブ・アンロッキング」たる証。',
            targetLocale: 'en-US',
            targetText: 'Lockpick: A precision pick set designed to bypass standard mechanical wafer locks.\nA hallmark testament of the "Master of Unlocking."',
            charLimit: 150,
            contextNotes: '[INVENTORY]: Jill Valentine exclusive starting inventory tool.\n[FRANCHISE EASTER EGG]: Barry Burton quote reference ("the master of unlocking").',
            status: 'APPROVED' as const,
        },

        // 3. Resident Evil - Veronica
        {
            stringKey: 'LOC-RE-002',
            projectTag: 'Resident Evil - Veronica',
            sourceText: '【緊急警報：レベル4バイオハザード検知】\n地下研究所ブロックBにて重大な封じ込め違反が発生しました。\n全職員は直ちに防護プロトコル「オメガ」を発令し、非常用減圧シャフトより地上へ退避してください。\n防毒マスク未着用の者は入室を禁じます。',
            targetLocale: 'en-US',
            targetText: '[EMERGENCY BROADCAST: Level 4 Biohazard Detected]\nA critical containment breach has occurred in Subterranean Research Block B.\nAll personnel are instructed to immediately initiate Protocol Omega and evacuate to the surface via emergency decompression shafts.\nEntry without standard-issue NBC respirators is strictly forbidden.',
            charLimit: 350,
            contextNotes: '[SYSTEM]: Rockfort Island Military Facility wall-mounted CRT terminal alert.\n[QA NOTE]: Flashes in sync with emergency amber strobe lighting.\n[TERMINOLOGY]: "Protocol Omega" is linked to Ashford Family Contingency Directives.',
            status: 'LQA_FLAGGED' as const,
        },
        {
            stringKey: 'LOC-RE-003',
            projectTag: 'Resident Evil - Veronica',
            sourceText: '「ハハハ！愚かな侵入者め。我が誇り高きアシュフォードの聖域に足を踏み入れた罪、万死に値する！\n貴様に脱出の道など残されてはいないのだ！」',
            targetLocale: 'en-US',
            targetText: '"Hahaha! Foolish trespasser. You dare contaminate the sacred sanctuary of House Ashford? Such insolence demands nothing less than absolute eradication!\nThere is no path of escape left for you!"',
            charLimit: 250,
            contextNotes: '[SPEAKER]: Alfred Ashford (PA System Broadcast).\n[DELIVERY]: High-pitched, maniacal theatricality with subtle echo filter applied in audio engine.',
            status: 'DRAFT' as const,
        },

        // 4. Pragmata
        {
            stringKey: 'LOC-PRAG-001',
            projectTag: 'PRAGMATA',
            sourceText: '【端末通信：同期率98.4%】\n「ヒュー、聞こえますか？上空の大気シールドに亀裂を確認しました。\n量子ハッキングコードの送信準備が完了しています。私の手を握ってください……行きますよ！」',
            targetLocale: 'en-US',
            targetText: '[UPLINK BROADCAST: Sync Ratio 98.4%]\n"Hugh, can you hear me? Structural rupture detected across the upper atmospheric shield.\nQuantum bypass sequence is armed and primed. Hold my hand... here we go!"',
            charLimit: 260,
            contextNotes: '[CINEMATIC]: Lunar atmospheric rupture set-piece sequence.\n[VOICE]: Diana (synthetic/human hybrid tone, calm urgency).',
            status: 'IN_REVIEW' as const,
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

        // 5. Megaman
        {
            stringKey: 'LOC-MM-001',
            projectTag: 'MEGAMAN-X',
            sourceText: '「ロックよ、よくぞこのカプセルを見つけてくれた。\nここに封じられしフットパーツを授けよう。これを用いれば、高速のダッシュが可能となるはずじゃ。\n世界に再び平和を取り戻すのじゃ！」',
            targetLocale: 'en-US',
            targetText: '"Mega Man, you have done well to discover this capsule.\nI bestow upon you these enhancement Foot Parts. Equipping them will grant you high-velocity dash propulsion.\nYou must bring peace back to our world!"',
            charLimit: 260,
            contextNotes: '[SPEAKER]: Dr. Thomas Light (Hologram projection).\n[CANON DIRECTIVE]: In Western localization, retain "Mega Man" rather than Japanese "Rockman". Dash mechanics must match classic X1 terminology.',
            status: 'APPROVED' as const,
        },
        {
            stringKey: 'STR_ITEM_E_TANK',
            projectTag: 'MEGAMAN-X',
            sourceText: 'E缶：スペアのエネルギーを蓄積する高圧コンデンサ。\nライフゲージが消耗した際、サブ画面より使用することで全回復する。',
            targetLocale: 'en-US',
            targetText: 'Energy Tank (E-Tank): High-pressure capacitor storing reserve solar power.\nCan be manually triggered via the sub-screen inventory to replenish full life gauge energy.',
            charLimit: 210,
            contextNotes: '[HUD]: In-game item inventory description.\n[CANON PRECEDENT]: "Energy Tank" (abbreviated E-Tank) consistent across all franchise iterations since 1988.',
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
    // SEEDING CANONICAL GLOSSARY TERMS ACROSS CAPCOM UNIVERSES
    // ===================================
    const glossaryEntries = [
        // Monster Hunter
        {
            termKey: 'DEMONDRUG',
            category: 'Item',
            sourceJa: '鬼神薬',
            targetEn: 'Demondrug',
            notes: 'Canonical franchise term since Monster Hunter (2004). Never translate as "Demon Potion" or "Devil Elixir". When consumed in-game, triggers the hunter\'s flex/roar vocalization animation. Synergizes with Might Seed crafting recipes.',
        },
        {
            termKey: 'GREEN_HERB',
            category: 'Item',
            sourceJa: 'グリーンハーブ',
            targetEn: 'Green Herb',
            notes: 'Primary recovery medicinal herb in both Resident Evil and Monster Hunter. In RE games, always capitalized as "Green Herb" (combinable with Red and Blue herbs). In Monster Hunter, used for crafting standard Potions (回復薬).',
        },
        {
            termKey: 'RATHALOS',
            category: 'Monster',
            sourceJa: 'リオレウス',
            targetEn: 'Rathalos',
            notes: 'King of the Skies (空の王者). Flying Wyvern apex predator of the Ancient Forest. Pronunciation: [RAH-thah-lohss]. In French: "Rathalos", German: "Rathalos", Spanish: "Rathalos", Italian: "Rathalos". Retain uniform Latinization across all EFIGS localization targets.',
        },
        {
            termKey: 'PALICO',
            category: 'Character',
            sourceJa: 'オトモアイルー',
            targetEn: 'Palico',
            notes: 'Felyne companion warrior. Portmanteau of "Pal" and "Calico". Plural is "Palicoes". In French: "Palico", German: "Palico", Spanish: "Felyne Camarada" (legacy) -> "Palico". Dialogue must feature cat puns (e.g., "paws-itively", "purr-fect", "meow-velous") in English localization.',
        },
        {
            termKey: 'SCOUTFLIES',
            category: 'System',
            sourceJa: '導蟲',
            targetEn: 'Scoutflies',
            notes: 'Bioluminescent insects stored in a cage on the hunter\'s hip used for tracking monster footprints, scent marks, and gathering nodes. Always capitalize as a proper system noun. Do not translate as "Guide Bugs" or "Tracker Flies".',
        },

        // Resident Evil Requiem
        {
            termKey: 'T_VIRUS',
            category: 'Lore',
            sourceJa: 'T-ウィルス',
            targetEn: 'T-Virus',
            notes: 'Progenitor-derived Tyrant Virus engineered by Umbrella Pharmaceuticals. Always hyphenated as "T-Virus" (never "TVirus" or "t-virus"). Induces extreme cellular mutation, tissue necrosis, and aggressive predatory instincts.',
        },
        {
            termKey: 'HERB_COCKTAIL',
            category: 'Item',
            sourceJa: '調合ハーブ (緑+赤)',
            targetEn: 'Mixed Herb (G+R)',
            notes: 'Medical compound synthesized by grinding Green and Red herbs. Fully restores vitality. Standardized notation: use single-letter abbreviations in inventory HUD ("G+R", "G+G+G", "G+R+B").',
        },
        {
            termKey: 'NEMESIS_T_TYPE',
            category: 'Character',
            sourceJa: 'ネメシス-T型',
            targetEn: 'Nemesis-T Type',
            notes: 'Bio-Organic Weapon (B.O.W.) implanted with the NE-α parasite. Iconic vocal line: "STARS..." must always be rendered in all-caps with four trailing periods in localization transcripts.',
        },

        // Pragmata
        {
            termKey: 'DIANA',
            category: 'Character',
            sourceJa: 'ディアナ',
            targetEn: 'Diana',
            notes: 'Artificial companion android possessing psionic-matter manipulation capabilities. Tone in EN script: naive curiosity blended with precise technological cadence. Avoid overly human colloquialisms in initial story acts.',
        },
        {
            termKey: 'LUNAR_SHELTER',
            category: 'Environment',
            sourceJa: '月面シェルター',
            targetEn: 'Lunar Shelter',
            notes: 'Sub-surface biosphere stations erected during the Cataclysm era. Use "Lunar Shelter" rather than "Moon Base" to reflect humanitarian civilian refugee origin.',
        },
        {
            termKey: 'PULSE_CANNON',
            category: 'Weapon',
            sourceJa: 'パルスカノン',
            targetEn: 'Pulse Cannon',
            notes: 'Kinetic repulsion firearm utilizing compressed gravimetric charges. System UI display name is strictly "PULSE CANNON"; do not abbreviate as "PL-C" in equipment loadouts.',
        },

        // Megaman
        {
            termKey: 'E_TANK',
            category: 'Item',
            sourceJa: 'E缶',
            targetEn: 'Energy Tank (E-Tank)',
            notes: 'Iconic cylindrical battery restoring maximum life energy. Formal noun is "Energy Tank", standard UI display abbreviation is "E-Tank". Precedent established in Mega Man 2 (1988).',
        },
        {
            termKey: 'BUSTER_SHOT',
            category: 'Weapon',
            sourceJa: 'バスターショット',
            targetEn: 'Buster Shot',
            notes: 'Default solar-energy projectile fired from the arm cannon (Rock Buster / Mega Buster). Secondary charged state is designated as "Charge Shot" (チャージショット).',
        },
        {
            termKey: 'MAVERICK',
            category: 'Lore',
            sourceJa: 'イレギュラー',
            targetEn: 'Maverick',
            notes: 'Reploids infected with the Sigma Virus or exhibiting hostile logic malfunctions. While Japanese source uses "Irregular" (イレギュラー), English franchise canon since Mega Man X (1993) strictly mandates "Maverick". Never use literal translation "Irregular".',
        },
    ];

    for (const entry of glossaryEntries) {
        await prisma.glossaryTerm.upsert({
            where: { termKey: entry.termKey },
            update: {
                category: entry.category,
                sourceJa: entry.sourceJa,
                targetEn: entry.targetEn,
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