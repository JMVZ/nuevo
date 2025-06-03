import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-pdf-viewer-modal',
  template: `
    <div class="pdf-viewer-container">
      <div class="pdf-viewer-header">
        <h2 mat-dialog-title>Vista Previa del PDF</h2>
        <button mat-icon-button (click)="close()" color="warn">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      <mat-dialog-content>
        <div *ngIf="loading" class="loading-container">
          <mat-spinner></mat-spinner>
          <p>Cargando PDF...</p>
        </div>
        <div *ngIf="error" class="error-container">
          <p>{{ error }}</p>
        </div>
        <iframe
          *ngIf="!loading && !error"
          [src]="safeUrl"
          width="100%"
          height="calc(90vh - 100px)"
          style="border: none;"
          (load)="onIframeLoad()"
          (error)="onIframeError()"
        ></iframe>
      </mat-dialog-content>
    </div>
  `,
  styles: [`
    .pdf-viewer-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background-color: white;
    }
    .pdf-viewer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background-color: #f5f5f5;
      border-bottom: 1px solid #e0e0e0;
    }
    mat-dialog-content {
      padding: 0;
      margin: 0;
      overflow: hidden;
      height: calc(100% - 64px);
    }
    ::ng-deep .pdf-viewer-dialog {
      max-width: 90vw !important;
      max-height: 90vh !important;
    }
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 1rem;
    }
    .error-container {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #dc3545;
    }
  `]
})
export class PdfViewerModalComponent implements OnInit {
  safeUrl: SafeResourceUrl;
  loading: boolean = true;
  error: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<PdfViewerModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { url: string },
    private sanitizer: DomSanitizer
  ) {
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(data.url);
  }

  ngOnInit() {
    // Verificar si la URL es válida
    if (!this.data.url) {
      this.error = 'URL del PDF no válida';
      this.loading = false;
      return;
    }

    // Intentar precargar el PDF
    const img = new Image();
    img.onload = () => {
      this.loading = false;
    };
    img.onerror = () => {
      this.error = 'No se pudo cargar el PDF';
      this.loading = false;
    };
    img.src = this.data.url;
  }

  onIframeLoad() {
    this.loading = false;
  }

  onIframeError() {
    this.error = 'Error al cargar el PDF';
    this.loading = false;
  }

  close(): void {
    this.dialogRef.close();
  }
} 