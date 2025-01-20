import { Inject, Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { DepositDto } from './deposit.dto';
import { PostgresService } from 'src/postgres/postgres.service';
import { CustomException } from 'src/common/filter/custom-exception.filter';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class DepositService {
  constructor(
    private readonly postgresService: PostgresService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}
  async deposit(dto: DepositDto) {
    try {
      const { user_id, amount } = dto;

      const user = await this.postgresService.query(
        `SELECT * FROM users WHERE id = $1;`,
        [user_id],
      );

      if (user.length == 0) throw new CustomException('Invalid user');

      const transactionHash = await this.isHashExists(user_id, amount);

      const insertedTransaction = await this.postgresService.query(
        `INSERT INTO deposits (user_id, amount, transaction_hash) VALUES ($1, $2, $3) RETURNING id, amount;`,
        [user_id, amount, transactionHash],
      );

      this.cacheManager.set(transactionHash, insertedTransaction);

      return insertedTransaction[0];
    } catch (e) {
      console.error(e);
      if (e instanceof CustomException) throw e;
      throw new CustomException('Failed to add deposit');
    }
  }

  generateTransactionHash(user_id: number, amount: string): string {
    return createHash('sha256')
      .update(`${user_id}-${amount}-${Date.now()}`)
      .digest('hex');
  }

  async getCachedTransaction(hash: string): Promise<any> {
    try {
      return await this.cacheManager.get(hash);
    } catch (error) {
      console.error('Cache error:', error);
      return null;
    }
  }

  async isHashExists(user_id: number, amount: string): Promise<any> {
    try {
      const transactionHash = this.generateTransactionHash(user_id, amount);

      await this.getCachedTransaction(transactionHash);

      let transaction = await this.getCachedTransaction(transactionHash);

      if (!transaction) {
        transaction = await this.postgresService.query(
          `SELECT transaction_hash from deposits WHERE user_id = $1 AND transaction_hash = $2;`,
          [user_id, transactionHash],
        );

        transaction = transaction[0];

        if (transaction) throw new CustomException('Invalid transaction');

        this.cacheManager.set(transactionHash, transaction);
      }

      return transactionHash;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
}
