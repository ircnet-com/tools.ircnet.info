/* tslint:disable:one-line whitespace triple-equals */
import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {ServerEntry, ServerList} from "./server-list";
import {AppSettings} from "../app.settings";

@Injectable({
  providedIn: 'root'
})
export class ServerListService {
  private readonly url = AppSettings.INFOBOT_API_URL + '/serversByCountry';

  constructor(private http: HttpClient) {
  }

  getServerList(sid?: string | null): Observable<ServerList> {
    const normalizedSid = sid?.trim();
    const shouldFilterBySid = !!normalizedSid && normalizedSid.length >= 3;

    if (shouldFilterBySid) {
      return this.http.get<ServerList>(this.url).pipe(
        map((response) => this.filterServerListBySid(response, normalizedSid)),
        catchError(this.handleError)
      );
    }

    return this.http.get<ServerList>(this.url).pipe(
      catchError(this.handleError)
    );
  }

  private filterServerListBySid(response: ServerList, sidPrefix: string): ServerList {
    const filteredCountries = response.countriesWithServers
      .map((country) => {
        const serverList = (country.serverList ?? []).filter((server) => server.sid?.startsWith(sidPrefix));
        if (serverList.length === 0) {
          return null;
        }

        const totalUsers = serverList.reduce((sum, server) => sum + (server.userCount ?? 0), 0);

        return {
          ...country,
          totalUsers,
          serverList
        };
      })
      .filter((country): country is NonNullable<typeof country> => country !== null);

    const totalUsers = filteredCountries.reduce((sum, country) => sum + (country.totalUsers ?? 0), 0);
    const totalServers = filteredCountries.reduce((sum, country) => sum + (country.serverList?.length ?? 0), 0);
    const lastMapReceived = this.getLatestLastSeen(
      filteredCountries.flatMap((country) => country.serverList ?? [])
    );

    return {
      ...response,
      countriesWithServers: filteredCountries,
      totalUsers,
      totalServers,
      lastMapReceived
    };
  }

  private getLatestLastSeen(serverList: ServerEntry[]): string {
    const latestServer = serverList
      .filter((server) => !!server.lastSeen && !Number.isNaN(new Date(server.lastSeen).getTime()))
      .sort((left, right) => new Date(right.lastSeen).getTime() - new Date(left.lastSeen).getTime())[0];

    return latestServer?.lastSeen ?? new Date().toISOString();
  }

  private handleError(error: HttpErrorResponse) {
    if (error.error?.errorMessage) {
      return throwError(() => error.error.errorMessage);
    }
    else {
      return throwError(() => 'Connection error. Please try again.');
    }
  }
}
