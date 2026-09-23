import {Component, OnInit} from '@angular/core';
import {ServerListService} from "./server-list.service";
import {CorrectServerDescriptionEncodingPipe} from "../correct-server-description-encoding.pipe";
import {NgForOf, NgIf} from "@angular/common";
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-server-list',
  standalone: true,
  imports: [
    CorrectServerDescriptionEncodingPipe,
    NgIf,
    NgForOf
  ],
  templateUrl: './server-list.component.html',
  styleUrl: './server-list.component.scss'
})
export class ServerListComponent implements OnInit {
  data: any;
  errorMessage: string = "";
  embed: boolean = false;

  constructor(private serverListService: ServerListService, private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.data = this.serverListService.getServerList().subscribe({
      next: data => {
        this.data = data;
      },
      error: err => this.errorMessage = err
    });

    this.route.queryParams.subscribe(params => {
      this.embed = params["embed"] === 'true';
    });
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

    if (days !== 0) {
      return days + ' days';
    }

    if (hours !== 0) {
      if (hours < 3 && minutes !== 0) {
        return hours + ' h ' + minutes + ' min';
      }
      else {
        return hours + (hours === 1 ? ' hour' : ' hours');
      }
    }

    if (minutes !== 0) {
      return minutes + (minutes === 1 ? ' minute' : ' minutes');
    }

    if (seconds !== 0) {
      return seconds + ' seconds';
    }

    return "";
  }
}
