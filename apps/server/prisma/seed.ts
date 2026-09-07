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
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000001',
            name: 'loc-mh-wilds',
            description: 'Monster Hunter Wilds main localization coordination channel',
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
        update: {},
        create: {
            channelId: mhChannel.id,
            userId: dante.id,
            role: 'member',
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
    // ** Two distinct naming conventions for localization strings available, split by type of string:
    // 1. Narrative / Dialogue strings: LOC-[PROJECT_TAG]-[STRING_ID]
    // 2. UI / Item / Asset strings: STR_ITEM_[ITEM_ID]

    await prisma.locString.upsert({
        where: { stringKey: 'LOC-MH-001' }, // Narrative / Dialogue string naming convention: LOC-[PROJECT_TAG]-[STRING_ID]
        update: {},
        create: {
            stringKey: 'LOC-MH-001',
            projectTag: 'MH-WILDS',
            sourceText: '一狩りいこうぜ！',
            targetLocale: 'en-US',
            targetText: "Let's hunt!",
            charLimit: 24,
            contextNotes: 'Title screen callout & cooperative lobby invitation.',
            status: 'APPROVED',
        },
    });

    await prisma.locString.upsert({
        where: { stringKey: 'STR_ITEM_DEMONDRUG' }, // UI / Item string naming convention: STR_ITEM_[ITEM_ID]
        update: {},
        create: {
            stringKey: 'STR_ITEM_DEMONDRUG',
            projectTag: 'MH-WILDS',
            sourceText: '鬼神薬：飲むと体内に力がみなぎり、攻撃力が上昇する。',
            targetLocale: 'en-US',
            targetText: 'Demondrug: Increases attack power by stimulating internal vigor.',
            charLimit: 80,
            contextNotes: 'Item pouch tooltip text.',
            status: 'APPROVED',
        },
    });

    await prisma.locString.upsert({
        where: { stringKey: 'LOC-RE-001' },
        update: {},
        create: {
            stringKey: 'LOC-RE-001',
            projectTag: 'RE-ENGINE',
            sourceText: 'かゆい うま',
            targetLocale: 'en-US',
            targetText: 'Itchy Tasty',
            charLimit: 30,
            contextNotes: 'Keeper Diary page 4 entry.',
            status: 'APPROVED',
        },
    });

    // ===================================
    // SEEDING CANONICAL GLOSSARY TERMS FOR TESTING
    // ===================================
    // Descriptive glossary terms for common in-game items, characters, and monsters. Used as context to ensure consistent translation across multiple projects
    const glossaryEntries = [
        { termKey: 'DEMONDRUG', category: 'Item', sourceJa: '鬼神薬', targetEn: 'Demondrug', notes: 'Consumable attack buff' },
        { termKey: 'GREEN_HERB', category: 'Item', sourceJa: 'グリーンハーブ', targetEn: 'Green Herb', notes: 'Recovery medicinal herb' },
        { termKey: 'RATHALOS', category: 'Monster', sourceJa: 'リオレウス', targetEn: 'Rathalos', notes: 'King of the Skies' },
        { termKey: 'PALICO', category: 'Character', sourceJa: 'オトモアイルー', targetEn: 'Palico', notes: 'Felyne companion' },
    ];

    for (const entry of glossaryEntries) {
        await prisma.glossaryTerm.upsert({
            where: { termKey: entry.termKey },
            update: {},
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