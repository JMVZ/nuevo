import { Component, ChangeDetectorRef, NgZone } from '@angular/core';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent {
  activeTab: string | null = null;

  constructor(
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  setActiveTab(tab: string | null) {
    this.ngZone.run(() => {
      this.activeTab = tab;
      // Forzar la detección de cambios
      setTimeout(() => {
        this.cdr.detectChanges();
      }, 0);
    });
  }

  getReportTitle(): string {
    switch (this.activeTab) {
      case 'product-outputs':
        return 'Reporte de Salidas de Productos';
      case 'proforma-cost-analysis':
        return 'Análisis de Costos';
      default:
        return '';
    }
  }
}
