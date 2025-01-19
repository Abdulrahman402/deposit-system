import { Module } from '@nestjs/common';
import { DepositController } from './deposit.controller';
import { DepositService } from './deposit.service';

@Module({
  imports: [],
  controllers: [DepositController],
  providers: [DepositService],
})
export class DepositModule {}
