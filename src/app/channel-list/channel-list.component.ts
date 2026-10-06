import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {AppSettings} from "../app.settings";
import {debounceTime, fromEvent, retry, timeout} from "rxjs";
import {NgForOf, NgIf} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {DataTableDirective, DataTablesModule} from "angular-datatables";
import {Config} from "datatables.net";
import {Channel} from "./channel";
import {RemoveColorsPipe} from "../remove-colors.pipe";
import {RemoveColorsService} from "../remove-colors.service";

class DataTablesResponse {
  data!: any[];
  draw!: number;
  recordsFiltered!: number;
  recordsTotal!: number;
}

@Component({
  selector: 'app-channel-list',
  standalone: true,
  imports: [
    NgIf,
    FormsModule,
    NgForOf,
    RemoveColorsPipe,
    DataTablesModule
  ],
  templateUrl: './channel-list.component.html',
  styleUrl: './channel-list.component.scss'
})
export class ChannelListComponent implements OnInit, AfterViewInit {
  @ViewChild(DataTableDirective)
  datatableElement!: DataTableDirective;

  @ViewChild('searchTermInput')
  searchTermInput!: ElementRef;

  dtOptions: Config = {};
  channels: Channel[] = [];
  filterTypes = ['Channel or topic', 'Channel', 'Topic'];
  filterType = this.filterTypes[0];
  pageSizes = [25, 50, 100];
  pageSize = this.pageSizes[0];
  searchTerm = '';
  errorMessage: string | undefined;

  constructor(private http: HttpClient, private removeColorsService: RemoveColorsService) {}

  ngOnInit(): void {
    const that = this;

    this.dtOptions = {
      pagingType: 'full_numbers',
      pageLength: this.pageSize,
      lengthChange: false,
      searching: false,
      serverSide: true,
      processing: false,
      order: [[ 1, 'desc' ]],
      columns: [
        {
          title: 'Channel',
          data: 'name',
          orderable: true,
        },
        {
          title: 'Users',
          data: 'userCount',
          orderable: true,
        },
        {
          title: 'Topic',
          data: 'topic',
          orderable: false,
        }
      ],
      ajax: (dataTablesParameters: any, callback) => {
        if (this.filterType == this.filterTypes[0]) {
          dataTablesParameters.search.value = this.searchTerm;
        }
        else if (this.filterType == this.filterTypes[1]) {
          dataTablesParameters.columns[0].search.value = this.searchTerm;
        }
        else if (this.filterType == this.filterTypes[2]) {
          dataTablesParameters.columns[2].search.value = this.searchTerm;
        }

        that.http
            .post<DataTablesResponse>(
                AppSettings.CLIS_URL,
                dataTablesParameters, {}
            )
            .pipe(
                timeout(5000),
                retry()
            )
            .subscribe(response => {
                  that.channels = response.data;
                  this.channels.forEach(value => value.topic = this.removeColorsService.transform(value.topic));

                  callback({
                    recordsTotal: response.recordsTotal,
                    recordsFiltered: response.recordsFiltered,
                    data: response.data
                  });
                },
                error => this.errorMessage = 'Connection error. Please try again.'
            );
      },
    };
  }

  ngAfterViewInit(): void {
    fromEvent(this.searchTermInput.nativeElement, 'keyup')
        .pipe(debounceTime(300)).subscribe(value => {
      this.filterByChannelName();
    });
  }

  filterTypeChanged(): void {
    this.datatableElement.dtInstance.then(dtInstance => {
      dtInstance.draw();
    });
  }

  filterByChannelName(): void {
    this.datatableElement.dtInstance.then(dtInstance => {
      dtInstance.draw();
    });
  }
}
