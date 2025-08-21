import { jest } from '@jest/globals'
import type { HttpClientResponse } from '@actions/http-client'

export function createHttpResponse(
  statusCode = 200,
  body = '',
  statusMessage = 'OK'
): HttpClientResponse {
  return {
    message: {
      statusCode,
      statusMessage
    } as never,
    readBody: jest.fn<() => Promise<string>>().mockResolvedValue(body)
  }
}

export const HttpClient = jest.fn().mockImplementation(() => ({
  post: jest.fn()
}))
