import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool, type PoolConfig } from 'pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL is not configured');
    }

    const caCertPath = process.env.DATABASE_CA_CERT_PATH;
    const databaseUrl = new URL(connectionString);
    const poolConfig: PoolConfig = caCertPath
      ? {
          database: databaseUrl.pathname.slice(1),
          host: databaseUrl.hostname,
          password: decodeURIComponent(databaseUrl.password),
          port: Number(databaseUrl.port) || 5432,
          user: decodeURIComponent(databaseUrl.username),
          // ponytail: certificate reload requires an API restart; add a cert manager only for live rotation.
          ssl: {
            ca: readFileSync(resolve(caCertPath), 'utf8'),
            rejectUnauthorized: true,
          },
        }
      : { connectionString };

    super({ adapter: new PrismaPg(new Pool(poolConfig)) });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
