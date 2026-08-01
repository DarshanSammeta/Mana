import { NextResponse } from "next/server";

export interface ApiResponseOptions {
  status?: number;
  message?: string;
  meta?: Record<string, any>;
  headers?: Record<string, string>;
  requestId?: string;
}

export interface PaginatedMeta extends Record<string, any> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Standardized API Response Helper
 */
export class ApiResponse {
  /**
   * Success Response
   */
  static success<T>(data: T, options: ApiResponseOptions = {}) {
    const {
      status = 200,
      message = "Success",
      meta,
      headers = {},
      requestId
    } = options;

    return NextResponse.json(
      {
        success: true,
        message,
        data,
        meta: {
            ...meta,
            requestId,
            timestamp: new Date().toISOString()
        }
      },
      {
        status,
        headers
      }
    );
  }

  /**
   * Error Response
   */
  static error(message: string, options: ApiResponseOptions & { code?: string; errors?: any } = {}) {
    const {
      status = 400,
      code = "ERROR",
      errors,
      meta,
      headers = {},
      requestId
    } = options;

    return NextResponse.json(
      {
        success: false,
        message,
        error: {
          code,
          details: errors
        },
        meta: {
            ...meta,
            requestId,
            timestamp: new Date().toISOString()
        }
      },
      {
        status,
        headers
      }
    );
  }

  /**
   * Paginated Success Response
   */
  static paginated<T>(items: T[], meta: PaginatedMeta, options: ApiResponseOptions = {}) {
      return this.success(items, {
          ...options,
          meta: {
              ...options.meta,
              pagination: meta
          }
      });
  }

  /**
   * Legacy Compatibility Layer
   * Returns data in the exact format expected by older frontend code
   */
  static legacy<T>(data: T, status: number = 200) {
      return NextResponse.json(data, { status });
  }
}
