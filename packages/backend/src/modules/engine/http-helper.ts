import axios, { AxiosRequestConfig } from 'axios';
import type { HttpRequestOptions } from '@flowforge/shared';

export async function httpRequestHelper(
  options: HttpRequestOptions,
): Promise<unknown> {
  const config: AxiosRequestConfig = {
    method: (options.method ?? 'GET') as AxiosRequestConfig['method'],
    url: options.url,
    headers: options.headers,
    params: options.qs,
    data: options.body,
    timeout: options.timeout ?? 30_000,
    auth: options.auth,
    validateStatus: () => true,
  };
  const res = await axios.request(config);
  return {
    status: res.status,
    headers: res.headers,
    body: res.data,
  };
}
