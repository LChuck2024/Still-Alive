/**
 * EdgeOne Pages API - 获取用户最后一次 PULSE_CHECK 时间
 * 
 * 接口路径: /api/get-status
 * 方法: GET
 * 
 * 查询参数:
 *   email: 用户邮箱
 * 
 * 响应:
 * {
 *   "success": true,
 *   "lastCheckIn": 1234567890123, // 时间戳（毫秒），如果不存在则为 null
 *   "email": "user@example.com"
 * }
 */

import { query } from '../services/db';

interface LogRecord {
  created_at: Date;
}

// EdgeOne Pages 云函数入口
export default async function handler(request: Request): Promise<Response> {
  // 处理 CORS 预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // 只处理 GET 请求
  if (request.method !== 'GET') {
    return new Response(
      JSON.stringify({
        success: false,
        error: `方法 ${request.method} 不被允许。此端点仅支持 GET 请求。`,
      }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  try {
    // 从 URL 查询参数获取邮箱
    const url = new URL(request.url);
    const email = url.searchParams.get('email');

    if (!email) {
      return new Response(
        JSON.stringify({
          success: false,
          error: '缺少必要参数：email',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // 验证邮箱格式
    if (!email.includes('@')) {
      return new Response(
        JSON.stringify({
          success: false,
          error: '邮箱地址无效。',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // 查询最后一次 PULSE_CHECK 记录
    const sql = `
      SELECT created_at
      FROM pulse_action_logs
      WHERE email = ? AND action_type = 'PULSE_CHECK'
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const rows = await query<LogRecord>(sql, [email]);

    // 如果找到记录，返回时间戳（毫秒）
    const lastCheckIn = rows.length > 0 
      ? new Date(rows[0].created_at).getTime()
      : null;

    // 返回成功响应
    return new Response(
      JSON.stringify({
        success: true,
        lastCheckIn,
        email,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('[get-status] 错误:', error);
    
    // 处理数据库连接错误
    if (error instanceof Error) {
      if (error.message.includes('TiDB 配置不完整')) {
        return new Response(
          JSON.stringify({
            success: false,
            error: '数据库配置错误：' + error.message,
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
