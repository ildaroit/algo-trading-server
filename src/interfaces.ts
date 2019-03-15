import { Request } from "express"


export interface ICandle {
  open: number
  high: number
  low: number
  volume: number
  close: number
}


export type IAdvice = 'long' | 'short' | 'soft' | 'close-position' | 'do-nothing'


export interface IAppRequest extends Request {
  uid: string
}
