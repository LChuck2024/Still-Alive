import mysql from 'mysql2/promise';

/**
 * TiDB 数据库连接配置
 * 从环境变量读取配置，确保安全性
 */
interface TiDBConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  port?: number;
  ssl?: boolean;
}

/**
 * 获取数据库配置
 */
function getTiDBConfig(): TiDBConfig {
  const host = process.env.TIDB_HOST;
  const user = process.env.TIDB_USER;
  const password = process.env.TIDB_PASSWORD;
  const database = process.env.TIDB_DATABASE || 'still_alive';
  const port = process.env.TIDB_PORT ? parseInt(process.env.TIDB_PORT) : 4000;

  if (!host || !user || !password) {
    throw new Error('TiDB 配置不完整。请设置环境变量: TIDB_HOST, TIDB_USER, TIDB_PASSWORD');
  }

  return {
    host,
    user,
    password,
    database,
    port,
    ssl: process.env.TIDB_SSL === 'true' || false,
  };
}

/**
 * 创建数据库连接池
 * 使用连接池以提高性能和资源管理
 */
let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    const config = getTiDBConfig();
    pool = mysql.createPool({
      ...config,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });
  }
  return pool;
}

/**
 * 执行查询
 */
export async function query<T = any>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  const pool = getPool();
  const [rows] = await pool.execute(sql, params);
  return rows as T[];
}

/**
 * 执行插入/更新/删除操作
 */
export async function execute(
  sql: string,
  params?: any[]
): Promise<mysql.ResultSetHeader> {
  const pool = getPool();
  const [result] = await pool.execute(sql, params);
  return result as mysql.ResultSetHeader;
}

/**
 * 关闭连接池（用于清理资源）
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
