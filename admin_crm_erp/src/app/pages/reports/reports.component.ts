import { Component } from '@angular/core';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent {
  activeTab: string = 'product-outputs';

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
} 