export enum Tasks {
  Borrow = 'borrow',
  Exchange = 'exchange',
  Multiply = 'multiply',
  Redeem = 'redeem',
  Renew = 'renew',
  Topup = 'topup',
}

export const EnabledTasks: Record<string, boolean> = {
  [Tasks.Borrow]: true,
  [Tasks.Exchange]: false,
  [Tasks.Multiply]: false,
  [Tasks.Redeem]: true,
  [Tasks.Renew]: false,
  [Tasks.Topup]: false,
}

export const LightningEnabledTasks: Record<string, boolean> = {
  [Tasks.Borrow]: true,
  [Tasks.Exchange]: false,
  [Tasks.Multiply]: false,
  [Tasks.Redeem]: false,
  [Tasks.Renew]: false,
  [Tasks.Topup]: false,
}
