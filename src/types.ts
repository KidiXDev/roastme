export enum RoastLevel {
  SANTAI = 'SANTAI',
  NORMAL = 'NORMAL',
  PEDES = 'PEDES'
}

export enum Language {
  EN = 'EN',
  ID = 'ID'
}

export interface RoastSource {
  title?: string;
  uri?: string;
}

export interface RoastResult {
  summary: string;
  roastContent: string;
  burnScore: number;
  roastLevel: RoastLevel;
  url: string;
  sources?: RoastSource[];
}

export interface RoastMetadata {
  id: string;
  label: string;
  description: string;
  color: string;
  accentClass: string;
}
