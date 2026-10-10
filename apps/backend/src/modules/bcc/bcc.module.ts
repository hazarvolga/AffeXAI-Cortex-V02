import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BccService } from "./bcc.service";
import { BccController } from "./bcc.controller";
import { BccSignal } from "./entities/bcc-signal.entity";
import { InsightService } from "./insight.service";

@Module({
  imports: [TypeOrmModule.forFeature([BccSignal])],
  controllers: [BccController],
  providers: [BccService, InsightService],
  exports: [BccService, InsightService],
})
export class BccModule { }
