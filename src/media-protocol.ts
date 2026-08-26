export const MANUAL_PAID_ACKNOWLEDGEMENT = 'accept-possible-openrouter-charge'

export function hasManualPaidAcknowledgement(value: unknown): boolean {
  return value === MANUAL_PAID_ACKNOWLEDGEMENT
}
