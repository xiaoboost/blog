import { cacheNames, metadata, policy } from './policy';

export interface PageInfo {
  resources: string[];
  revision: string;
  used: number;
}

/** 窗口实际显示的文档可能比 HTML 缓存更旧，必须单独保留它的资源引用。 */
export interface ClientInfo {
  url: string;
  resources: string[];
  /** 首次安装时已有页面未经过 SW 导航，无法确定其 HTML 摘要，记为 null。 */
  revision: string | null;
  used: number;
  /** 页面已通过 pageshow 报告就绪；否则可能仍在导航创建过程中。 */
  confirmed: boolean;
}

export function readPage(response: Response): PageInfo | undefined {
  try {
    const revision = response.headers.get(metadata.revision);
    const resources: unknown = JSON.parse(decodeURIComponent(response.headers.get(metadata.resources) ?? ''));
    const used = Number(response.headers.get(metadata.used));
    if (!revision || !used || !Array.isArray(resources) || !resources.every((item) => typeof item === 'string')) return undefined;
    return { revision, resources, used };
  }
  catch {
    return undefined;
  }
}

/** 缓存中 body 和引用信息一起写入，避免中断后出现两份记录不一致。 */
export function decorate(
  response: Response,
  values: Record<string, string>,
  body: BodyInit | null = response.body,
): Response {
  const headers = new Headers(response.headers);
  // fetch 提供的是解码后的响应体，重建响应时不能沿用传输时的压缩及长度信息。
  headers.delete('content-encoding');
  headers.delete('content-length');
  headers.delete('transfer-encoding');
  for (const [key, value] of Object.entries(values)) headers.set(key, value);
  return new Response(body, { status: response.status, statusText: response.statusText, headers });
}

export async function revisionOf(html: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(html));
  return [...new Uint8Array(hash)].map((value) => value.toString(16).padStart(2, '0')).join('');
}

export function metaUrl(name: string): string {
  // 仅用作 Cache Storage 的记录键，不对应服务器接口，也不会发起网络请求。
  return new URL(`/__blog_cache__/${name}`, self.location.origin).href;
}

export async function readClient(id: string): Promise<ClientInfo | undefined> {
  const response = await (await caches.open(cacheNames.meta)).match(metaUrl(`client/${id}`));
  return response?.json();
}

export async function saveClient(id: string, info: ClientInfo): Promise<void> {
  if (id) await (await caches.open(cacheNames.meta)).put(metaUrl(`client/${id}`), Response.json(info));
}

/** 所有调用由 SW 的短事务串行执行；网络请求不占用事务。 */
export async function cleanRuntime(): Promise<void> {
  const cache = await caches.open(cacheNames.runtime);
  const entries = await Promise.all((await cache.keys()).map(async (request) => {
    const response = await cache.match(request);
    return {
      request,
      used: Number(response?.headers.get(metadata.used)),
      size: Number(response?.headers.get(metadata.bytes)),
    };
  }));
  // 优先保留近期使用的文件；写入时同时检查过期时间、数量和总容量。
  entries.sort((a, b) => b.used - a.used);
  let count = 0;
  let bytes = 0;
  for (const entry of entries) {
    if (
      !entry.used
      || !Number.isFinite(entry.size)
      || Date.now() - entry.used > policy.runtimeIdleMs
      || count >= policy.runtimeLimit
      || bytes + entry.size > policy.runtimeBytes
    ) {
      await cache.delete(entry.request);
    }
    else {
      count += 1;
      bytes += entry.size;
    }
  }
}
