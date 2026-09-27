export type BleConnectionState =
  | "IDLE"
  | "SCANNING"
  | "CONNECTING"
  | "CONNECTED"
  | "DISCONNECTED"
  | "ERROR";

export type BleMessageType =
  | "SYNC_OPERATION"
  | "VOLUNTEER_PRESENCE"
  | "ZONE_ASSIGNMENT"
  | "SESSION_STATUS"
  | "EMERGENCY_UPDATE";

export type BleSyncMessage<TPayload = Record<string, unknown>> = {
  messageId: string;
  senderId: string;
  caseId: string;
  messageType: BleMessageType;
  timestamp: number;
  payload: TPayload;
};

export type BleDeviceInfo = {
  id: string;
  name?: string | null;
  rssi?: number | null;
};

export type BleTransportState = {
  state: BleConnectionState;
  connected: boolean;
  lastMessageAt?: number | null;
};

export type BleMessageValidationResult = {
  valid: boolean;
  reason?: string;
};

export function createBleMessageId(senderId: string, timestamp: number): string {
  return `${senderId}:${timestamp}`;
}

export function validateBleMessage<TPayload>(
  message: Partial<BleSyncMessage<TPayload>>,
): BleMessageValidationResult {
  if (!message.messageId || !message.senderId || !message.caseId) {
    return {
      valid: false,
      reason: "messageId, senderId, and caseId are required.",
    };
  }

  if (typeof message.timestamp !== "number" || !Number.isFinite(message.timestamp)) {
    return {
      valid: false,
      reason: "timestamp must be a finite number.",
    };
  }

  if (!message.messageType) {
    return {
      valid: false,
      reason: "messageType is required.",
    };
  }

  if (message.payload == null) {
    return {
      valid: false,
      reason: "payload is required.",
    };
  }

  return { valid: true };
}
