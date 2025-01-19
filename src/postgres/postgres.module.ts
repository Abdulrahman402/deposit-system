import { Global, Module } from '@nestjs/common';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';
import { PostgresService } from './postgres.service';

@Global()
@Module({
  providers: [
    PostgresService,
    {
      provide: Pool,
      useFactory: (configService: ConfigService) => {
        return new Pool({
          host: configService.get('POSTGRES_HOST') || 'localhost',
          port: Number(configService.get('POSTGRES_PORT')) || 5432,
          user: configService.get('POSTGRES_USER') || 'user',
          password: configService.get('POSTGRES_PASSWORD') || 'password',
          database: configService.get('POSTGRES_DB') || 'deposit-system',
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [PostgresService],
})
export class PostgresModule {}
