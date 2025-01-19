import { IsDecimal, IsInt, IsNotEmpty } from 'class-validator';

export class DepositDto {
  @IsDecimal()
  @IsNotEmpty()
  amount: number;

  @IsInt()
  @IsNotEmpty()
  user_id: number;
}
