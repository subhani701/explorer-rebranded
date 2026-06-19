// SPDX-License-Identifier: LicenseRef-Blockscout
//
// Hardening overlay: normalize token address fields once, centrally.
// The frontend expects `token.address_hash`, but some backend versions (e.g. the
// v7.0.x line) return the token address as `address`. Without this, token links
// across the whole UI (tokens list, search, transfers, holders, …) point at bare
// `/token` (404). We walk each API response and, for token-shaped objects that
// have `address` but no `address_hash`, copy it over. Version-agnostic: harmless
// when the backend already provides `address_hash`.

import type { UseQueryOptions } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import type { ExternalChainExtended } from 'types/externalChains';

import { useMultichainContext } from 'lib/contexts/multichain';

import type { ResourceError, ResourceName, ResourcePathParams, ResourcePayload } from '../resources';
import useApiFetch from './useApiFetch';
import type { Params as FetchParams } from './useFetch';

const TOKEN_TYPES = [ 'ERC-20', 'ERC-721', 'ERC-1155', 'ERC-404' ];

// Recursively copy `address` -> `address_hash` for token-shaped objects.
function normalizeTokenAddresses(value: unknown, seen = new WeakSet<object>()): void {
  if (!value || typeof value !== 'object') {
    return;
  }
  if (seen.has(value as object)) {
    return;
  }
  seen.add(value as object);

  if (Array.isArray(value)) {
    value.forEach((item) => normalizeTokenAddresses(item, seen));
    return;
  }

  const obj = value as Record<string, unknown>;
  const looksLikeToken =
    typeof obj.address === 'string' &&
    obj.address_hash === undefined &&
    (typeof obj.symbol === 'string' || typeof obj.decimals === 'string' || TOKEN_TYPES.includes(obj.type as string));

  if (looksLikeToken) {
    obj.address_hash = obj.address;
  }

  for (const key of Object.keys(obj)) {
    normalizeTokenAddresses(obj[key], seen);
  }
}

export interface Params<R extends ResourceName, E = unknown, D = ResourcePayload<R>> {
  pathParams?: ResourcePathParams<R>;
  queryParams?: Record<string, string | Array<string> | number | boolean | undefined | null>;
  fetchParams?: Pick<FetchParams, 'body' | 'method' | 'headers'>;
  queryOptions?: Partial<Omit<UseQueryOptions<ResourcePayload<R>, ResourceError<E>, D>, 'queryFn'>>;
  logError?: boolean;
  chain?: ExternalChainExtended;
}

export interface GetResourceKeyParams<R extends ResourceName, E = unknown, D = ResourcePayload<R>>
  extends Pick<Params<R, E, D>, 'pathParams' | 'queryParams'> {
  chainId?: string;
}

// REFACTOR: extract to a separate file
export function getResourceKey<R extends ResourceName>(resource: R, { pathParams, queryParams, chainId }: GetResourceKeyParams<R> = {}) {
  if (pathParams || queryParams) {
    return [ resource, chainId, { ...pathParams, ...queryParams } ].filter(Boolean);
  }

  return [ resource, chainId ].filter(Boolean);
}

export default function useApiQuery<R extends ResourceName, E = unknown, D = ResourcePayload<R>>(
  resource: R,
  { queryOptions, pathParams, queryParams, fetchParams, logError, chain: chainProp }: Params<R, E, D> = {},
) {
  const apiFetch = useApiFetch();
  const multichainContext = useMultichainContext();
  const chain = chainProp || multichainContext?.chain;

  return useQuery<ResourcePayload<R>, ResourceError<E>, D>({
    queryKey: queryOptions?.queryKey || getResourceKey(resource, { pathParams, queryParams, chainId: chain?.id }),
    queryFn: async({ signal }) => {
      // all errors and error typing is handled by react-query
      // so error response will never go to the data
      // that's why we are safe here to do type conversion "as Promise<ResourcePayload<R>>"
      const data = await (apiFetch(resource, { pathParams, queryParams, chain, logError, fetchParams: { ...fetchParams, signal } }) as Promise<ResourcePayload<R>>);
      normalizeTokenAddresses(data);
      return data;
    },
    ...queryOptions,
  });
}
