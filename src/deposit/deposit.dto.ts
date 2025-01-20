import { IsDecimal, IsInt, IsNotEmpty } from 'class-validator';

export class DepositDto {
  @IsDecimal()
  @IsNotEmpty()
  amount: string;

  @IsInt()
  @IsNotEmpty()
  user_id: number;
}
