import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SettingsService } from '../services/settings.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  currencyForm: FormGroup;
  isLoading$: boolean = false;

  constructor(
    private fb: FormBuilder,
    private settingsService: SettingsService,
    private toastr: ToastrService
  ) {
    this.currencyForm = this.fb.group({
      currency: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(3)]],
      symbol: ['', [Validators.required, Validators.maxLength(5)]],
      position: ['left', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadCurrencySettings();
  }

  loadCurrencySettings() {
    this.isLoading$ = true;
    this.settingsService.getCurrency().subscribe({
      next: (response: any) => {
        this.currencyForm.patchValue({
          currency: response.currency,
          symbol: response.symbol,
          position: response.position
        });
        this.isLoading$ = false;
      },
      error: (error: any) => {
        this.toastr.error('Error al cargar la configuración de moneda');
        this.isLoading$ = false;
      }
    });
  }

  saveCurrencySettings() {
    if (this.currencyForm.invalid) {
      this.toastr.error('Por favor complete todos los campos correctamente');
      return;
    }

    this.isLoading$ = true;
    this.settingsService.setCurrency(this.currencyForm.value).subscribe({
      next: (response: any) => {
        this.toastr.success('Configuración de moneda actualizada correctamente');
        this.isLoading$ = false;
      },
      error: (error: any) => {
        this.toastr.error('Error al actualizar la configuración de moneda');
        this.isLoading$ = false;
      }
    });
  }
} 