export interface ServerList {
  countriesWithServers: CountryWithServers[];
  totalUsers: number;
  totalServers: number;
  lastMapReceived: string;
  now: string;
}

export interface CountryWithServers {
  countryCode: string;
  countryCodeAlpha2?: string;
  countryName: string;
  totalUsers: number;
  serverList: ServerEntry[];
}

export interface ServerEntry {
  serverName: string;
  sid: string;
  serverInfo: string;
  lastSeen: string;
  userCount: number;
  version: string;
  open: boolean;
  sasl: boolean;

  [key: string]: unknown;
}

export interface ServersBySidResponse {
  serverDTOList: ServerEntry[];
  numericCountryCode: number | null;
  countryName: string | null;
  countryCodeAlpha2?: string;
}
