import { Injectable, OnModuleInit, OnApplicationShutdown } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnApplicationShutdown {
    constructor() {
        const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
        super({ adapter });
    }
    async onModuleInit(): Promise<void> {
        await this.$connect();
    }

    async onApplicationShutdown(): Promise<void> {
        await this.$disconnect();
    }
}


