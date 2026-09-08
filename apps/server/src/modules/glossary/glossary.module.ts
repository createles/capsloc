import { Module } from '@nestjs/common';
import { GlossaryService } from './glossary.service.js';
import { GlossaryController } from './glossary.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
    imports: [AuthModule],
    controllers: [GlossaryController],
    providers: [GlossaryService],
    exports: [GlossaryService],
})
export class GlossaryModule { }