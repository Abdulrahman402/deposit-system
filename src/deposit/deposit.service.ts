import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { DepositDto } from './deposit.dto';
import { PostgresService } from 'src/postgres/postgres.service';
import { CustomException } from 'src/common/filter/custom-exception.filter';

@Injectable()
export class DepositService {
  constructor(private readonly postgresService: PostgresService) {}
  async deposit(dto: DepositDto) {
    try {
      const { user_id, amount } = dto;

      const user = await this.postgresService.query(
        `SELECT * FROM users WHERE id = $1;`,
        [user_id],
      );

      if (user.length == 0) throw new CustomException('Invalid user');

      const transactionHash = this.generateTransactionHash(user_id, amount);

      const isTransactionExists = await this.postgresService.query(
        `SELECT transaction_hash from deposits WHERE user_id = $1 AND transaction_hash = $2;`,
        [user_id, transactionHash],
      );

      if (isTransactionExists.length > 0)
        throw new CustomException('Invalid transaction');

      const insertedTransaction = await this.postgresService.query(
        `INSERT INTO deposits (user_id, amount, transaction_hash) VALUES ($1, $2, $3) RETURNING id, amount;`,
        [user_id, amount, transactionHash],
      );

      return insertedTransaction[0];
    } catch (e) {
      console.error(e);
      if (e instanceof CustomException) throw e;
      throw new CustomException('Failed to add deposit');
    }
  }

  generateTransactionHash(user_id: number, amount: number): string {
    return createHash('sha256')
      .update(`${user_id}-${amount}-${Date.now()}`)
      .digest('hex');
  }
}
