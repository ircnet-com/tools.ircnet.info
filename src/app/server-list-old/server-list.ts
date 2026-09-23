export interface ServerList {
  countriesWithServers: ({
    totalUsers: number;
    countryCode: string;
    serverList: ({
      lastVersion: string;
      flags: string;
      serverName: string;
      lastTrace: string;
      lastLinks: null;
      version: string;
      serverStartTime: string;
      sid: string; lastSeen: string;
      userCount: number;
      serverInfo: string;
      operators: {
        nick: string; host:
          string; user: string
      }[];
      mask: string;
      lastILine: string
    } | {
      lastVersion: string;
      flags: string; serverName: string; lastTrace: string; lastLinks: null; version: string; serverStartTime: null; sid: string; lastSeen: string; userCount: number; serverInfo: string; operators: null; mask: string; lastILine: string
    } | { lastVersion: string; flags: string; serverName: string; lastTrace: string; lastLinks: null; version: string; serverStartTime: null; sid: string; lastSeen: string; userCount: number; serverInfo: string; operators: { nick: string; host: string; user: string }[]; mask: string; lastILine: string })[]; countryName: string
  });
  totalUsers: number;
  lastMapReceived: string;
  now: string;
}
