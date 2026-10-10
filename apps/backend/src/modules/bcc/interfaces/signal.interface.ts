export enum SignalType {
  SENTIMENT = "SENTIMENT", // Positive/Negative feedback
  INTENT = "INTENT", // High purchase or registration intent
  INTERACTION = "INTERACTION", // Standard UI interaction
  FRICTION = "FRICTION", // Error, struggle, or user frustration
  RESONANCE = "RESONANCE", // How well the brand message is received
}

export enum SignalSource {
  FORM = "FORM",
  EVENT = "EVENT",
  CMS = "CMS",
  SUPPORT = "SUPPORT",
  CRM = "CRM",
  SYSTEM = "SYSTEM",
  SOCIAL_MEDIA = "SOCIAL_MEDIA",
}

export interface IBccSignal {
  id: string;
  type: SignalType;
  source: SignalSource;
  intensity: number; // 0 to 1
  message?: string;
  metadata?: Record<string, any>;
  tenantId: string;
  userId?: string;
  createdAt: Date;
}
