import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { DepositService } from './deposit.service';
import { DepositDto } from './deposit.dto';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';

@Controller('deposit')
export class DepositController {
  constructor(private readonly depositService: DepositService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async deposit(@Body() dto: DepositDto) {
    return this.depositService.deposit(dto);
  }
}
