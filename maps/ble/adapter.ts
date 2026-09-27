import type {
  BleConnectionState,
  BleDeviceInfo,
  BleMessageType,
  BleSyncMessage,
  BleTransportState,
} from "./types";

export type BleTransport = {
  discoverNearbyDevices(): Promise<BleDeviceInfo[]>;
  connect(deviceId: string): Promise<void>;
  disconnect(deviceId?: string): Promise<void>;
  send(message: BleSyncMessage): Promise<void>;
  receive(): Promise<BleSyncMessage | null>;
  getConnectionState(): BleTransportState;
};

export class NoopBleTransport implements BleTransport {
  private state: BleConnectionState = "IDLE";

  async discoverNearbyDevices(): Promise<BleDeviceInfo[]> {
    return [];
  }

  async connect(_deviceId: string): Promise<void> {
    this.state = "CONNECTED";
  }

  async disconnect(_deviceId?: string): Promise<void> {
    this.state = "DISCONNECTED";
  }

  async send(_message: BleSyncMessage): Promise<void> {
    this.state = "CONNECTED";
  }

  async receive(): Promise<BleSyncMessage | null> {
    return null;
  }

  getConnectionState(): BleTransportState {
    return {
      state: this.state,
      connected: this.state === "CONNECTED",
      lastMessageAt: null,
    };
  }
}

export function createBleSyncMessage<TPayload>(
  senderId: string,
  caseId: string,
  messageType: BleMessageType,
  payload: TPayload,
  messageIdOverride?: string,
): BleSyncMessage<TPayload> {
  const messageId =
    messageIdOverride ?? `${senderId}:${caseId}:${messageType}:${Date.now()}`;

  return {
    messageId,
    senderId,
    caseId,
    messageType,
    timestamp: Date.now(),
    payload,
  };
}
