import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PostgresModule } from './postgres/postgres.module';
import { JwtService } from '@nestjs/jwt';
import { AuthModule } from './auth/auth.module';
import { DepositModule } from './deposit/deposit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PostgresModule,
    AuthModule,
    DepositModule,
  ],
  controllers: [],
  providers: [JwtService],
})
export class AppModule {}
