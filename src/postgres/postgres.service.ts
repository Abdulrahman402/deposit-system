import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PostgresService implements OnModuleInit, OnModuleDestroy {
  private readonly pool: Pool;

  constructor(private readonly config: ConfigService) {
    this.pool = new Pool({
      user: this.config.get('POSTGRES_USER'),
      host: this.config.get('POSTGRES_HOST'),
      database: this.config.get('POSTGRES_DB') || 'deposit-system',
      password: this.config.get('POSTGRES_PASSWORD'),
      port: Number(this.config.get('POSTGRES_PORT')),
    });
  }

  async onModuleInit() {
    await this.query(
      `CREATE DATABASE "${this.config.get('POSTGRES_DB')}"`,
    ).catch(() => console.log('Database already exists'));

    this.pool.options.database = this.config.get('POSTGRES_DB');

    await this.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS deposits (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            amount DECIMAL(10,2) NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            transaction_hash VARCHAR(255) UNIQUE NOT NULL
        );
    `);

    console.log(`Connected to database ${this.config.get('POSTGRES_DB')}`);
  }

  async onModuleDestroy() {
    await this.pool.end();
    console.log(`Disconnected from database ${this.config.get('POSTGRES_DB')}`);
  }

  async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    const { rows } = await this.pool.query(text, params);
    return rows;
  }
}
