import { defaultPayout, oracleURL } from './constants'
import { fetchURL } from './fetch'
import { Asset, Investment, Offer, Oracle, Stock } from './types'

const lbtc: Asset = {
  icon: '/images/assets/lbtc.svg',
  id: '144c654344aa716d6f3abcc1ca90e5641e4e2a7f633bc09fe3baf64585819a49',
  isSynthetic: false,
  isAvailable: false,
  name: 'Liquid BTC',
  precision: 8,
  quantity: 0,
  ratio: 150,
  ticker: 'L-BTC',
  value: 40000,
}

const usdt: Asset = {
  icon: '/images/assets/usdt.svg',
  id: 'f3d1ec678811398cd2ae277cbe3849c6f6dbd72c74bc542f7c4b11ff0e820958',
  isSynthetic: false,
  isAvailable: false,
  name: 'Tether USD',
  precision: 8,
  quantity: 0,
  ratio: 150,
  ticker: 'USDt',
  value: 1,
}

const fusd: Asset = {
  icon: '/images/assets/fusd.svg',
  id: '0d86b2f6a8c3b02a8c7c8836b83a081e68b7e2b4bcdfc58981fc5486f59f7518',
  isSynthetic: true,
  isAvailable: true,
  name: 'FUJI USD',
  precision: 8,
  quantity: 0,
  ticker: 'FUSD',
  value: 1,
}

const fbmn: Asset = {
  icon: '/images/assets/fbmn.svg',
  id: 'fbmn',
  isSynthetic: true,
  isAvailable: false,
  name: 'FUJI BMN',
  precision: 8,
  quantity: 0,
  ticker: 'FBMN',
  value: 309415.05,
}

const assets: Asset[] = [lbtc, usdt, fusd, fbmn]

const oracles: Oracle[] = [
  {
    disabled: false,
    id: 'id0',
    name: 'Fuji.Money',
    pubkey:
      '0xc304c3b5805eecff054c319c545dc6ac2ad44eb70f79dd9570e284c5a62c0f9e',
  },
  { disabled: true, id: 'id1', name: 'Bitfinex' },
  { disabled: true, id: 'id2', name: 'Blockstream' },
]

export const apiAssets = async (): Promise<Asset[]> => {
  lbtc.value = await getBTCvalue()
  return assets
}

export const apiInvestments = (): Investment[] => [
  {
    asset: fbmn,
    delta: -0.1125,
    quantity: 0.001,
  },
]

export const apiOffers = async (): Promise<Offer[]> => [
  {
    id: 'lbtcfusd',
    collateral: await findAssetByTicker('l-btc'),
    oracles: [oracles[0].id],
    payout: defaultPayout,
    synthetic: await findAssetByTicker('fusd'),
    isAvailable: true,
  },
  {
    id: 'usdtfbmn',
    collateral: await findAssetByTicker('usdt'),
    oracles: [oracles[0].id],
    payout: defaultPayout,
    synthetic: await findAssetByTicker('fbmn'),
    isAvailable: false,
  },
]

export const apiOracles = (): Oracle[] => oracles

export const apiStocks = (): Stock[] =>
  assets
    .filter((asset) => asset.isSynthetic)
    .map((asset) => ({ asset, delta: 0.159 }))

export const findAssetByTicker = async (ticker: string): Promise<Asset> => {
  const asset = (await apiAssets()).find(
    (a) => a.ticker.toLowerCase() === ticker.toLowerCase(),
  )
  if (!asset) throw new Error(`Asset with ticker ${ticker} not found`)
  return asset
}

export const getBTCvalue = async (): Promise<number> => {
  const data = await fetchURL(oracleURL)
  return data ? Number(data.lastPrice) : 0
}
