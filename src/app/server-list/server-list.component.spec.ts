import { ComponentFixture, TestBed } from '@angular/core/testing';
import {ActivatedRoute, Router} from '@angular/router';
import {of} from 'rxjs';

import { ServerListComponent } from './server-list.component';
import {ServerListService} from './server-list.service';

describe('ServerListComponent', () => {
  let component: ServerListComponent;
  let fixture: ComponentFixture<ServerListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServerListComponent],
      providers: [
        {
          provide: ServerListService,
          useValue: {
            getServerList: () => of({
              countriesWithServers: [],
              totalUsers: 0,
              totalServers: 0,
              lastMapReceived: new Date().toISOString(),
              now: new Date().toISOString()
            })
          }
        },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({})
          }
        },
        {
          provide: Router,
          useValue: {
            navigate: jasmine.createSpy('navigate')
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServerListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('linked totals', () => {
    const lastMapReceived = '2026-09-12T10:15:03.409+00:00';

    beforeEach(() => {
      component.data = {
        countriesWithServers: [
          {
            countryCode: '840',
            countryCodeAlpha2: 'US',
            countryName: 'United States',
            totalUsers: 120,
            serverList: [
              {
                serverName: 'open.example.net',
                sid: '001A',
                serverInfo: 'Open server',
                lastSeen: lastMapReceived,
                userCount: 50,
                version: 'test',
                open: true,
                sasl: false
              },
              {
                serverName: 'sasl.example.net',
                sid: '001B',
                serverInfo: 'SASL server',
                lastSeen: lastMapReceived,
                userCount: 70,
                version: 'test',
                open: false,
                sasl: true
              },
              {
                serverName: 'split.example.net',
                sid: '001C',
                serverInfo: 'Netsplit server',
                lastSeen: '2026-09-10T21:08:08.945+00:00',
                userCount: 187,
                version: 'test',
                open: true,
                sasl: true
              }
            ]
          }
        ],
        totalUsers: 120,
        totalServers: 2,
        lastMapReceived,
        now: '2026-09-12T10:15:05.427+00:00'
      };
    });

    it('excludes stale servers from ALL totals', () => {
      component.mode = 'ALL';

      expect(component.flatServers.length).toBe(3);
      expect(component.displayedTotalServers).toBe(2);
      expect(component.displayedTotalUsers).toBe(120);
      expect(component.getDisplayedCountryUsers(component.filteredCountries[0])).toBe(120);
    });

    it('excludes stale servers from OPEN totals', () => {
      component.mode = 'OPEN';

      expect(component.flatServers.length).toBe(2);
      expect(component.displayedTotalServers).toBe(1);
      expect(component.displayedTotalUsers).toBe(50);
      expect(component.getDisplayedCountryUsers(component.filteredCountries[0])).toBe(50);
    });

    it('excludes stale servers from SASL totals', () => {
      component.mode = 'SASL';

      expect(component.flatServers.length).toBe(2);
      expect(component.displayedTotalServers).toBe(1);
      expect(component.displayedTotalUsers).toBe(70);
      expect(component.getDisplayedCountryUsers(component.filteredCountries[0])).toBe(70);
    });
  });

  describe('server sorting', () => {
    const lastMapReceived = '2026-09-12T10:15:03.409+00:00';

    beforeEach(() => {
      component.data = {
        countriesWithServers: [
          {
            countryCode: '001',
            countryCodeAlpha2: 'AA',
            countryName: 'Alpha',
            serverList: [
              {serverName: 'small.example.net', lastSeen: lastMapReceived, userCount: 10, open: true, sasl: false},
              {serverName: 'largest.example.net', lastSeen: lastMapReceived, userCount: 200, open: false, sasl: true}
            ]
          },
          {
            countryCode: '002',
            countryCodeAlpha2: 'BB',
            countryName: 'Beta',
            serverList: [
              {serverName: 'middle.example.net', lastSeen: lastMapReceived, userCount: 80, open: true, sasl: true},
              {serverName: 'stale.example.net', lastSeen: '2026-09-10T21:08:08.945+00:00', userCount: 999, open: true, sasl: true}
            ]
          }
        ],
        lastMapReceived,
        now: '2026-09-12T10:15:05.427+00:00'
      };
      component.country = null;
      component.mode = 'ALL';
    });

    it('keeps backend order in DEFAULT mode, including stale rows', () => {
      component.sortMode = 'DEFAULT';

      expect(component.displayedFlatServers.map(server => server.serverName)).toEqual([
        'small.example.net',
        'largest.example.net',
        'middle.example.net',
        'stale.example.net'
      ]);
    });

    it('sorts linked servers by users descending and excludes stale servers', () => {
      component.sortMode = 'USERS_DESC';

      expect(component.displayedFlatServers.map(server => server.serverName)).toEqual([
        'largest.example.net',
        'middle.example.net',
        'small.example.net'
      ]);
    });

    it('sorts linked servers by users ascending', () => {
      component.sortMode = 'USERS_ASC';

      expect(component.displayedFlatServers.map(server => server.serverName)).toEqual([
        'small.example.net',
        'middle.example.net',
        'largest.example.net'
      ]);
    });

    it('keeps the OPEN filter when sorting', () => {
      component.mode = 'OPEN';
      component.sortMode = 'USERS_DESC';

      expect(component.displayedFlatServers.map(server => server.serverName)).toEqual([
        'middle.example.net',
        'small.example.net'
      ]);
    });

    it('keeps the SASL filter when sorting', () => {
      component.mode = 'SASL';
      component.sortMode = 'USERS_DESC';

      expect(component.displayedFlatServers.map(server => server.serverName)).toEqual([
        'largest.example.net',
        'middle.example.net'
      ]);
    });

    it('keeps backend order when user counts are equal', () => {
      component.data.countriesWithServers[0].serverList.push(
        {serverName: 'z-tie.example.net', lastSeen: lastMapReceived, userCount: 80, open: true, sasl: true}
      );
      component.sortMode = 'USERS_DESC';

      expect(component.displayedFlatServers.map(server => server.serverName)).toEqual([
        'largest.example.net',
        'z-tie.example.net',
        'middle.example.net',
        'small.example.net'
      ]);
    });
  });

});
