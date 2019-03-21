import * as _ from 'underscore'
import * as Telegram from 'node-telegram-bot-api'

import { IAdvice } from 'src/interfaces'
import BasePlugin from './BasePlugin'
import BaseTrigger from 'src/triggers/BaseTrigger'
import Plugins from 'src/database/models/plugins'



interface ITelegramOptions {
  token: string
  chatId?: string
}


export default class TelegramPlugin extends BasePlugin<ITelegramOptions> {
  public readonly name = 'Telegram'
  public readonly description = 'Sends notifications to a Telegram bot.'
  public readonly version = 1

  private bot: Telegram
  private chatId?: string


  constructor (pluginDB: Plugins, options?: ITelegramOptions) {
    super(pluginDB, pluginDB.uid, options)

    this.bot = new Telegram(options.token, { polling: { interval: 5000 }})
    this.chatId = options.chatId

    if (this.chatId) this.send('I\'m now connected to the trading server!')

    this.bot.onText(/(.+)/, msg => {
      this.send(`Hello! your chat id is: \`${msg.chat.id}\``, msg.chat.id)
    })
  }


  onTriggered (trigger: BaseTrigger, advice: IAdvice, price?: number, amount?: number) {
    const message = `${trigger.name} triggered! and adviced to \`${advice}\` ` +
      `on \`${trigger.getExchange().toUpperCase()}\` \`${trigger.getSymbol()}\` with a ` +
      `volume of \`${amount}\`! Current price is \`${price}\``

    this.send(message)
  }


  private send(message: string, chatId?: string) {
    this.bot.sendMessage(chatId || this.chatId, message, { parse_mode: 'markdown' })
  }
}
