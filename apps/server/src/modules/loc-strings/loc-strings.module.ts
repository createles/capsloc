import { Module } from '@nestjs/common';
import { LocStringsService } from './loc-strings.service.js';
import { LocStringsController } from './loc-strings.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
    imports: [AuthModule],
    controllers: [LocStringsController],
    providers: [LocStringsService],
    exports: [LocStringsService],
})
export class LocStringsModule { }