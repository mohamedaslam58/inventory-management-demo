import { Component } from '@angular/core';
import { DxDataGridModule } from 'devextreme-angular';
import { createStore } from 'devextreme-aspnet-data-nojquery';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DxDataGridModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  dataSource: any;

  private apiUrl = 'http://localhost:7000/api/items';

  constructor() {
    this.dataSource = createStore({
      key: 'id',

      loadUrl: this.apiUrl,
      insertUrl: this.apiUrl,
      updateUrl: this.apiUrl,
      deleteUrl: this.apiUrl,

      onBeforeSend: (method, ajaxOptions) => {
        ajaxOptions.contentType = 'application/json';

        if (method === 'insert') {
          ajaxOptions.data = ajaxOptions.data.values;
        }

        if (method === 'update') {
          // Append ID to URL
          ajaxOptions.url += '/' + encodeURIComponent(ajaxOptions.data.key);

          // Send only the changed values
          ajaxOptions.data = ajaxOptions.data.values;
        }

        if (method === 'delete') {
          // Append ID to URL
          ajaxOptions.url += '/' + encodeURIComponent(ajaxOptions.data.key);
        }
      },
    });
  }
}
