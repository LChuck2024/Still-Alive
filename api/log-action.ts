/**
 * EdgeOne Pages API - 记录用户操作流水
 * 
 * 接口路径: /api/log-action
 * 方法: POST
 * 
 * 请求体:
 * {
 *   "email": "user@example.com",
 *   "action_type": "LOGIN" | "PULSE_CHECK" | "UPDATE_EMERGENCY" | "TEST_SEND",
 *   "action_data": {} // 可选的 JSON 数据
 * }
 */

import { execute } from '../services/db';

// 操作类型枚举
type ActionType = 'LOGIN' | 'PULSE_CHECK' | 'UPDATE_EMERGENCY' | 'TEST_SEND';

interface RequestBody {
  email: string;
  action_type: ActionType;
  action_data?: Record<string, any>;
}

// EdgeOne Pages 云函数入口
export default async function handler(request: Request): Promise<Response> {
  // 处理 CORS 预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // 只处理 POST 请求
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({
        success: false,
        error: `方法 ${request.method} 不被允许。此端点仅支持 POST 请求。`,
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
    // 解析请求体
    const body: RequestBody = await request.json();
    const { email, action_type, action_data } = body;

    // 验证必要参数
    if (!email || !action_type) {
      return new Response(
        JSON.stringify({
          success: false,
          error: '缺少必要参数：email, action_type',
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

    // 验证操作类型
    const validActionTypes: ActionType[] = ['LOGIN', 'PULSE_CHECK', 'UPDATE_EMERGENCY', 'TEST_SEND'];
    if (!validActionTypes.includes(action_type)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `无效的操作类型: ${action_type}。支持的类型: ${validActionTypes.join(', ')}`,
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

    // 插入数据库
    const sql = `
      INSERT INTO pulse_action_logs (email, action_type, action_data, created_at)
      VALUES (?, ?, ?, NOW())
    `;
    
    const actionDataJson = action_data ? JSON.stringify(action_data) : null;
    
    const result = await execute(sql, [email, action_type, actionDataJson]);

    // 返回成功响应
    return new Response(
      JSON.stringify({
        success: true,
        id: result.insertId,
        message: '操作已记录',
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
    console.error('[log-action] 错误:', error);
    
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
