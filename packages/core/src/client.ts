/**
 * Stellar Snaps API Client
 *
 * Client for interacting with the hosted Stellar Snaps API.
 * Use this if you want to create snaps on our platform and get
 * shareable URLs (stellar-snaps.vercel.app/s/...).
 */

import type {
  StellarSnapsConfig,
  Snap,
  CreateSnapOptions,
  SnapResponse,
  ListSnapsOptions,
} from './types';

const DEFAULT_BASE_URL = 'https://stellar-snaps.vercel.app';

export class StellarSnapsClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor(config: StellarSnapsConfig = {}) {
    this.baseUrl = config.baseUrl?.replace(/\/$/, '') || DEFAULT_BASE_URL;
    this.apiKey = config.apiKey;
  }

  private async fetch<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} - ${error}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Create a new snap and get a shareable URL
   *
   * @example
   * ```typescript
   * const client = new StellarSnapsClient();
   * const { snap, url } = await client.createSnap({
   *   title: 'Coffee Payment',
   *   destination: 'GABC...',
   *   amount: '5.00',
   *   assetCode: 'XLM',
   *   network: 'public',
   * });
   * console.log('Share this URL:', url);
   * ```
   */
  async createSnap(options: CreateSnapOptions): Promise<SnapResponse> {
    const snap = await this.fetch<Snap>('/api/snaps', {
      method: 'POST',
      body: JSON.stringify({
        title: options.title,
        description: options.description,
        destination: options.destination,
        amount: options.amount,
        assetCode: options.assetCode || 'XLM',
        assetIssuer: options.assetIssuer,
        memo: options.memo,
        memoType: options.memoType || 'MEMO_TEXT',
        network: options.network || 'testnet',
      }),
    });

    return {
      snap,
      url: `${this.baseUrl}/s/${snap.id}`,
    };
  }

  /**
   * Get a snap by ID
   */
  async getSnap(id: string): Promise<Snap> {
    return this.fetch<Snap>(`/api/snap/${id}`);
  }

  /**
   * List snaps (optionally filtered by creator wallet)
   */
  async listSnaps(options: ListSnapsOptions = {}): Promise<Snap[]> {
    const params = new URLSearchParams();

    if (options.wallet) params.set('creator', options.wallet);
    if (options.network) params.set('network', options.network);
    if (options.limit) params.set('limit', options.limit.toString());
    if (options.offset) params.set('offset', options.offset.toString());

    const query = params.toString();
    const path = query ? `/api/snaps?${query}` : '/api/snaps';

    return this.fetch<Snap[]>(path);
  }

  /**
   * Delete a snap (requires creator wallet signature in future versions)
   */
  async deleteSnap(id: string, creatorWallet: string): Promise<void> {
    await this.fetch(`/api/snaps?id=${id}&creator=${creatorWallet}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get the shareable URL for a snap ID
   */
  getSnapUrl(id: string): string {
    return `${this.baseUrl}/s/${id}`;
  }
}
