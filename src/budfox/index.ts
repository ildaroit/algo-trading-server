import * as _ from 'underscore'
import { Readable } from 'stream'
import { Trade } from 'ccxt'

import { ICandle } from 'src/interfaces'
import BaseExchange from 'src/exchanges/core/BaseExchange'
import CandleCreator from './candleCreator'
import Candles from 'src/database/models/candles'
import log from 'src/utils/log'
import MarketDataProvider from './marketDataProvider'
import Trades from 'src/database/models/trades'


/**
 * Budfox is the realtime market for Iguana! It was initially built by the team
 * that built Gekko but was modified to support CCXT exchanges and websocket connections.
 *
 * Budfox takes an exchange and a symbol, and tracks all new trades and emits out candles.
 *
 * Read more here what Budfox does (Gekko's version):
 * @link https://github.com/askmike/gekko/blob/stable/docs/internals/budfox.md
 */
export default class BudFox extends Readable {
  private readonly marketDataProvider: MarketDataProvider
  private readonly candlesCreator: CandleCreator
  private readonly exchange: BaseExchange
  private readonly symbol: string


  constructor (exchange: BaseExchange, symbol: string) {
    super()
    log.debug('init budfox for', exchange.name, symbol)
    this.exchange = exchange
    this.symbol = symbol

    // init the different components
    this.marketDataProvider = new MarketDataProvider(exchange, symbol)
    this.candlesCreator = new CandleCreator

    // connect them together

    // on new trade data create candles and stream it
    this.marketDataProvider.on('trades', this.candlesCreator.write)
    this.candlesCreator.on('candles', this.processCandles)


    // relay a market-start, market-update and trade events
    this.marketDataProvider.on('market-start', e => this.emit('market-start', e))
    this.marketDataProvider.on('market-update', e => this.emit('market-update', e))
    this.marketDataProvider.on('trade', e => this.emit('trade', e))
    this.marketDataProvider.on('trades', this.processTrades)

    // once everything is connected, we start the market data provider
    this.marketDataProvider.start()
  }


  private processCandles = (candles: ICandle[]) => {
    candles.forEach(c => {
      // write to stream
      this.push(JSON.stringify(c))

      // save into the DB
      const candle = new Candles({
        open: c.open,
        high: c.high,
        low: c.low,
        volume: c.volume,
        close: c.close,
        vwp: c.vwp,
        start: c.start,
        trades: c.trades,
        exchange: this.exchange.name,
        symbol: this.symbol
      })

      candle.save().catch(_.noop)
    })
  }


  private processTrades = (trades: Trade[]) => {
    trades.forEach(t => {
      const trade = new Trades({
        exchange: this.exchange.name,
        price: t.price,
        symbol: this.symbol,
        tradedAt: new Date(t.timestamp),
        tradeId: String(t.id),
        volume: t.amount
      })

      trade.save().catch(_.noop)
    })
  }


  public _read () {
    // do nothing
  }
}