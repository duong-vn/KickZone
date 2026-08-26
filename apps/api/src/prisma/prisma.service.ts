import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool, type PoolConfig } from 'pg';
import { PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private pool: Pool;

  constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL is not configured');
    }

    const caCertContent = process.env.DATABASE_CA_CERT
      ? process.env.DATABASE_CA_CERT.replace(/\\n/g, '\n')
      : process.env.DATABASE_CA_CERT_PATH
        ? readFileSync(resolve(process.env.DATABASE_CA_CERT_PATH), 'utf8')
        : undefined;

    const databaseUrl = new URL(connectionString);
    const configuredPoolMax = Number(process.env.DATABASE_POOL_MAX ?? 2);
    const poolMax =
      Number.isInteger(configuredPoolMax) && configuredPoolMax > 0
        ? configuredPoolMax
        : 2;
    const poolConfig: PoolConfig = {
      ...(caCertContent
        ? {
            database: databaseUrl.pathname.slice(1),
            host: databaseUrl.hostname,
            password: decodeURIComponent(databaseUrl.password),
            port: Number(databaseUrl.port) || 5432,
            user: decodeURIComponent(databaseUrl.username),
            // ponytail: certificate reload requires an API restart; add a cert manager only for live rotation.
            ssl: {
              ca: caCertContent,
              rejectUnauthorized: true,
            },
          }
        : { connectionString }),
      max: poolMax,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    };

    const pool = new Pool(poolConfig);
    pool.on('error', (err) => {
      // Catch idle client disconnects (e.g. 57P01 from Supabase / pgBouncer)
      // to prevent unhandled driver errors and dead connections in pool.
      this.logger.debug(
        `PostgreSQL idle pool client event: ${err.message || err}`,
      );
    });

    super({ adapter: new PrismaPg(pool) });
    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}
