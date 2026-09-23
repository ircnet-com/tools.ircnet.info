import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {ServerListService} from "./server-list.service";
import {CorrectServerDescriptionEncodingPipe} from "../correct-server-description-encoding.pipe";
import {NgClass, NgForOf, NgIf, UpperCasePipe} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {ActivatedRoute, Router, RouterLink} from '@angular/router';

type ServerSort = 'DEFAULT' | 'USERS_DESC' | 'USERS_ASC';

@Component({
  selector: 'app-server-list',
  standalone: true,
  imports: [
    CorrectServerDescriptionEncodingPipe,
    NgIf,
    NgForOf,
    FormsModule,
    NgClass,
    RouterLink,
    UpperCasePipe
  ],
  templateUrl: './server-list.component.html',
  styleUrl: './server-list.component.scss'
})
export class ServerListComponent implements OnInit, AfterViewInit {
  data: any;
  errorMessage: string = "";
  embed: boolean = false;
  currentSid: string | null = null;

  flatView: boolean = false;
  sortMode: ServerSort = 'DEFAULT';

  mode: 'ALL' | 'OPEN' | 'SASL' = 'ALL';
  country: string | null = null;

  private updatingFromUrl: boolean = false;
  private lastLoadedSid: string | null = null;

  @ViewChild('modeScroll', { static: false })
  modeScroll?: ElementRef<HTMLElement>;

  get flatServers(): any[] {
    const servers: any[] = [];
    for (const country of this.filteredCountries) {
      for (const server of (country.serverList ?? [])) {
        servers.push({
          ...server,
          countryCode: country.countryCode,
          countryCodeAlpha2: country.countryCodeAlpha2,
          countryName: country.countryName
        });
      }
    }
    return servers;
  }

  get linkedFlatServers(): any[] {
    return this.flatServers.filter((server: any) => this.isServerLinked(server));
  }

  get isSortActive(): boolean {
    return this.sortMode !== 'DEFAULT';
  }

  get isUsersSort(): boolean {
    return this.sortMode === 'USERS_DESC' || this.sortMode === 'USERS_ASC';
  }

  get sortDescription(): string {
    switch (this.sortMode) {
      case 'USERS_DESC':
        return 'Linked servers sorted by user count, highest first.';
      case 'USERS_ASC':
        return 'Linked servers sorted by user count, lowest first.';
      default:
        return '';
    }
  }

  get displayedFlatServers(): any[] {
    if (!this.isSortActive) {
      return this.flatServers;
    }

    const servers = [...this.linkedFlatServers];

    return servers.sort((a: any, b: any) => {
      switch (this.sortMode) {
        case 'USERS_DESC':
          return Number(b?.userCount ?? 0) - Number(a?.userCount ?? 0);
        case 'USERS_ASC':
          return Number(a?.userCount ?? 0) - Number(b?.userCount ?? 0);
        default:
          return 0;
      }
    });
  }

  get displayedTotalUsers(): number {
    return this.linkedFlatServers.reduce((sum, server) => sum + (server?.userCount ?? 0), 0);
  }

  get displayedTotalServers(): number {
    return this.linkedFlatServers.length;
  }

  get isUnfilteredAllView(): boolean {
    return this.mode === 'ALL' && !this.effectiveSid && !this.country;
  }

  get filteredCountries(): any[] {
    const countries = this.data?.countriesWithServers ?? [];
    const selectedCountry = this.country;

    return countries
      .filter((country: any) => {
        if (!selectedCountry) {
          return true;
        }
        const alpha2 = String(country?.countryCodeAlpha2 ?? '').trim().toLowerCase();
        const code = String(country?.countryCode ?? '').trim().toLowerCase();
        return alpha2 === selectedCountry || code === selectedCountry;
      })
      .map((country: any) => ({
        ...country,
        serverList: (country.serverList ?? []).filter((server: any) => this.matchesFilters(server))
      }))
      .filter((country: any) => (country.serverList?.length ?? 0) > 0);
  }

  getCountryAnchor(country: any): string {
    const code = country?.countryCodeAlpha2 || country?.countryCode || '';
    return String(code).trim().toLowerCase();
  }

  buildCountryQueryParams(alpha2: string): any {
    const qp: any = {
      country: String(alpha2 ?? '').trim().toLowerCase()
    };

    if (this.mode === 'SASL') {
      qp.sasl = 'true';
    } else if (this.mode === 'OPEN') {
      qp.open = 'true';
    }

    if (this.flatView) {
      qp.flat = 'true';
    }

    const sortQuery = this.getSortQueryValue(this.sortMode);
    if (sortQuery) {
      qp.sort = sortQuery;
    }

    if (this.embed) {
      qp.embed = 'true';
    }

    return qp;
  }

  private matchesFilters(server: any): boolean {
    if (this.mode === 'OPEN') {
      return !!server?.open;
    }
    if (this.mode === 'SASL') {
      return !!server?.sasl;
    }
    return true;
  }

  getDisplayedCountryUsers(country: any): number {
    return (country?.serverList ?? [])
      .filter((server: any) => this.isServerLinked(server))
      .reduce((sum: number, server: any) => sum + (server?.userCount ?? 0), 0);
  }

  private isServerLinked(server: any): boolean {
    return !!this.data?.lastMapReceived && server?.lastSeen === this.data.lastMapReceived;
  }

  constructor(
    private serverListService: ServerListService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngAfterViewInit() {
    this.queueScrollCheckedModeIntoView();
  }

  private queueScrollCheckedModeIntoView() {
    requestAnimationFrame(() => this.scrollCheckedModeIntoView());
  }

  private scrollCheckedModeIntoView() {
    const host = this.modeScroll?.nativeElement;
    if (!host) return;

    const checkedLabel = host.querySelector('input.btn-check:checked + label') as HTMLElement | null;
    if (!checkedLabel) return;

    checkedLabel.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.embed = params["embed"] === 'true';

      const sidRaw = params['sid'];
      const sidRawString = typeof sidRaw === 'string' ? sidRaw.trim() : '';
      const sidValue = sidRawString.length > 0 ? sidRawString : null;
      const effectiveSid = this.getEffectiveSid(sidValue);

      const openEnabled = this.isTruthyQueryParam(params, 'open');

      const saslPresent = Object.prototype.hasOwnProperty.call(params, 'sasl');
      const saslEnabled = this.isTruthyQueryParam(params, 'sasl');

      const flatPresent = Object.prototype.hasOwnProperty.call(params, 'flat');
      const flatEnabled = this.isTruthyQueryParam(params, 'flat');

      const topPresent = Object.prototype.hasOwnProperty.call(params, 'top');
      const topEnabled = this.isTruthyQueryParam(params, 'top');

      const sortPresent = Object.prototype.hasOwnProperty.call(params, 'sort');
      const sortRaw = sortPresent ? String(params['sort'] ?? '').trim().toLowerCase() : '';
      const requestedSort = this.getSortMode(params['sort']);
      const sortValue: ServerSort = requestedSort === 'DEFAULT' && topEnabled ? 'USERS_DESC' : requestedSort;

      const countryPresent = Object.prototype.hasOwnProperty.call(params, 'country');
      const countryRaw = countryPresent ? params['country'] : undefined;
      const countryRawString = countryPresent ? String(countryRaw ?? '').trim() : '';
      const countryNormalized = countryRawString.toLowerCase();
      const countryValue = /^[a-z0-9]{2,3}$/.test(countryNormalized) ? countryNormalized : null;

      this.updatingFromUrl = true;
      if (saslEnabled) {
        this.mode = 'SASL';
      } else if (openEnabled) {
        this.mode = 'OPEN';
      } else {
        this.mode = 'ALL';
      }
      const shouldReload = !this.data || effectiveSid !== this.lastLoadedSid;

      this.flatView = flatEnabled;
      this.sortMode = sortValue;
      this.country = countryValue;
      this.currentSid = sidValue;
      this.updatingFromUrl = false;

      if (shouldReload) {
        this.loadServerList(effectiveSid);
      }

      this.queueScrollCheckedModeIntoView();

      const bothPresent = saslEnabled && openEnabled;
      const canonicalSort = this.getSortQueryValue(this.sortMode) ?? '';
      const sortNeedsCanonicalization = topPresent || (sortPresent && sortRaw !== canonicalSort);
      if (bothPresent || sortNeedsCanonicalization) {
        this.syncUrlWithFilters();
      }
    });
  }

  private loadServerList(sid: string | null) {
    this.lastLoadedSid = sid;
    this.serverListService.getServerList(sid).subscribe({
      next: data => {
        this.data = data;
      },
      error: err => this.errorMessage = err
    });
  }

  onModeChanged(_: any) {
    this.syncUrlWithFilters();
    this.queueScrollCheckedModeIntoView();
  }

  onCountryChanged(value: any): void {
    if (!value || value === 'null') {
      this.country = null;
    } else {
      const normalized = String(value).trim().toLowerCase();
      this.country = /^[a-z0-9]{2,3}$/.test(normalized) ? normalized : null;
    }
    this.syncUrlWithFilters();
  }

  onSortChanged(_: any) {
    this.syncUrlWithFilters();
  }

  resetFilters() {
    this.mode = 'ALL';
    this.sortMode = 'DEFAULT';
    this.syncUrlWithFilters();
    this.queueScrollCheckedModeIntoView();
  }

  clearCountry() {
    this.country = null;
    this.syncUrlWithFilters();
  }

  clearSid() {
    this.currentSid = null;
    this.syncUrlWithFilters();
  }

  syncUrlWithFilters() {
    if (this.updatingFromUrl) {
      return;
    }

    const effectiveSid = this.getEffectiveSid(this.currentSid);
    const shouldReload = effectiveSid !== this.lastLoadedSid;

    const queryParams: any = {
      sid: effectiveSid ? effectiveSid : null,
      sasl: this.mode === 'SASL' ? 'true' : null,
      open: this.mode === 'OPEN' ? 'true' : null,
      flat: this.flatView ? 'true' : null,
      sort: this.getSortQueryValue(this.sortMode),
      top: null,
      country: this.country ? this.country : null,

      nocountry: null,
      hideCountry: null,
      hidecountry: null
    };

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true
    });

    if (shouldReload) {
      this.loadServerList(effectiveSid);
    }
  }

  get effectiveSid(): string | null {
    return this.getEffectiveSid(this.currentSid);
  }

  private getEffectiveSid(value: string | null): string | null {
    const trimmed = value?.trim() ?? '';
    return trimmed.length >= 3 ? trimmed : null;
  }

  private getSortMode(value: any): ServerSort {
    switch (String(value ?? '').trim().toLowerCase()) {
      case 'users-desc':
        return 'USERS_DESC';
      case 'users-asc':
        return 'USERS_ASC';
      default:
        return 'DEFAULT';
    }
  }

  private getSortQueryValue(sortMode: ServerSort): string | null {
    switch (sortMode) {
      case 'USERS_DESC':
        return 'users-desc';
      case 'USERS_ASC':
        return 'users-asc';
      default:
        return null;
    }
  }

  private isTruthyQueryParam(params: any, key: string): boolean {
    if (!Object.prototype.hasOwnProperty.call(params, key)) {
      return false;
    }

    const raw = params[key];
    if (raw === undefined || raw === null || raw === '') {
      return true;
    }

    const value = String(raw).trim().toLowerCase();
    if (["true", "1"].includes(value)) return true;
    if (["false", "0"].includes(value)) return false;

    return true;
  }

  getFormattedDateDifference(date1String: string): string {
    const date1 = new Date(date1String);
    date1.setMilliseconds(0);
    const now = new Date(this.data.now);
    now.setMilliseconds(0);

    const diffSeconds = (now.getTime() - date1.getTime()) / 1000;

    const days = Math.floor(diffSeconds / 86400);
    const hours = Math.floor(diffSeconds / 3600) % 24;
    const minutes = Math.floor(diffSeconds / 60) % 60;
    const seconds = Math.floor(diffSeconds % 60);

    const result: Array<string> = [];
    result.push(days + ' days');
    result.push(hours + ' hours');
    result.push(minutes + ' minutes');
    result.push(seconds + ' seconds');

    while (result[0].startsWith('0') && result.length > 1) {
      result.shift();
    }

    return result.join(', ');
  }

  getFormattedLastSeenTime(date1String: string): string {
    const date1 = new Date(date1String);
    date1.setMilliseconds(0);
    const now = new Date(this.data.now);
    now.setMilliseconds(0);

    const diffSeconds = (now.getTime() - date1.getTime()) / 1000;
    const days = Math.floor(diffSeconds / 86400);
    const hours = Math.floor(diffSeconds / 3600) % 24;
    const minutes = Math.floor(diffSeconds / 60) % 60;
    const seconds = Math.floor(diffSeconds % 60);

    if (days !== 0) return days + ' days';

    if (hours !== 0) {
      if (hours < 3 && minutes !== 0) return hours + ' h ' + minutes + ' min';
      return hours + (hours === 1 ? ' hour' : ' hours');
    }

    if (minutes !== 0) return minutes + (minutes === 1 ? ' minute' : ' minutes');
    if (seconds !== 0) return seconds + ' seconds';

    return "";
  }
}