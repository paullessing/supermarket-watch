import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  public data: any;

  constructor(
    private http: HttpClient
  ) {}

  public search(text: string): void {
    if (!text) {
      return;
    }

    this.http.get('https://f117ytul04.execute-api.eu-west-2.amazonaws.com/dev/search', {
      params: {
        q: text
      }
    }).subscribe((data) => {
      console.log('Success', data);
      this.data = data;
    });
  }
}
