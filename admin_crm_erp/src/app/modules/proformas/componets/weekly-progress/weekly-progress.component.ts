import { Component, Input, OnInit, ChangeDetectorRef, ViewChild, TemplateRef, OnDestroy } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProformasService } from '../../service/proformas.service';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';

interface Activity {
  id?: number;
  description: string;
  completed: boolean;
}

interface Week {
  id?: number | string;
  week_number: number;
  notes: string;
  activities: Activity[];
  start_date: Date;
  end_date: Date;
  is_current_week: boolean;
  is_past_week: boolean;
  is_future_week: boolean;
}

interface ApiResponse {
  data: Week | Week[];
}

@Component({
  selector: 'app-weekly-progress',
  templateUrl: './weekly-progress.component.html',
  styleUrls: ['./weekly-progress.component.scss'],
  host: {
    '[class.modal-xl]': 'true'
  }
})
export class WeeklyProgressComponent implements OnInit, OnDestroy {
  @Input() proforma: any;
  @ViewChild('notesModal') notesModal!: TemplateRef<any>;
  weeks: Week[] = [];
  isLoading$: Observable<boolean>;
  readonly MAX_ACTIVITIES = 8;
  currentWeekNumber: number = 1;
  selectedWeek: Week | null = null;
  private modalRef: any;
  isDarkMode: boolean = false;
  private colorSchemeListener: any;

  constructor(
    public modal: NgbActiveModal,
    public modalService: NgbModal,
    private proformasService: ProformasService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {
    this.isLoading$ = this.proformasService.isLoading$;
  }

  ngOnInit() {
    // Detectar modo oscuro del sistema
    const matcher = window.matchMedia('(prefers-color-scheme: dark)');
    this.isDarkMode = matcher.matches;
    this.colorSchemeListener = (event: MediaQueryListEvent) => {
      this.isDarkMode = event.matches;
      this.cdr.detectChanges();
    };
    matcher.addEventListener('change', this.colorSchemeListener);
    this.initializeWeeks();
    // Si está en modo claro, agregar la clase global al body
    if (!this.isDarkMode) {
      document.body.classList.add('modal-light-force-global');
    }
  }

  ngOnDestroy() {
    // Remover el listener al destruir el componente
    const matcher = window.matchMedia('(prefers-color-scheme: dark)');
    matcher.removeEventListener('change', this.colorSchemeListener);
    // Remover la clase global del body
    document.body.classList.remove('modal-light-force-global');
  }

  private calculateWeekDates(startDate: Date, weekNumber: number): { start: Date, end: Date } {
    const start = new Date(startDate);
    start.setDate(start.getDate() + ((weekNumber - 1) * 7));
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return { start, end };
  }

  private isCurrentWeek(startDate: Date, endDate: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalizar la fecha actual
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return today >= start && today <= end;
  }

  private isPastWeek(endDate: Date): boolean {
    const today = new Date();
    return today > endDate;
  }

  private isFutureWeek(startDate: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    return today < start;
  }

  initializeWeeks() {
    const numWeeks = this.proforma.weeks || 0;
    const startDate = new Date(this.proforma.created_at);
    const today = new Date();
    
    // Inicializar las semanas temporales primero
    this.weeks = Array.from({ length: numWeeks }, (_, i) => {
      const weekNumber = i + 1;
      const { start, end } = this.calculateWeekDates(startDate, weekNumber);
      const isCurrentWeek = this.isCurrentWeek(start, end);
      const isPastWeek = this.isPastWeek(end);
      const isFutureWeek = this.isFutureWeek(start);

      if (isCurrentWeek) {
        this.currentWeekNumber = weekNumber;
      }

      return {
        id: `temp_${weekNumber}`,
        week_number: weekNumber,
        notes: '',
        activities: [],
        start_date: start,
        end_date: end,
        is_current_week: isCurrentWeek,
        is_past_week: isPastWeek,
        is_future_week: isFutureWeek
      };
    });

    // Luego cargar los datos del servidor
    this.loadWeeks();
  }

  loadWeeks() {
    console.log('Cargando semanas para proforma:', this.proforma.id);
    (this.proformasService.getWeeklyProgress(this.proforma.id) as Observable<ApiResponse>).subscribe({
      next: (response) => {
        console.log('Respuesta del servidor:', response);
        if (response.data && Array.isArray(response.data)) {
          // Actualizar las semanas existentes o agregar nuevas
          response.data.forEach((serverWeek: Week) => {
            const existingWeekIndex = this.weeks.findIndex(w => w.week_number === serverWeek.week_number);
            if (existingWeekIndex !== -1) {
              // Actualizar semana existente
              this.weeks[existingWeekIndex] = {
                ...serverWeek,
                activities: serverWeek.activities || [],
                start_date: new Date(serverWeek.start_date),
                end_date: new Date(serverWeek.end_date),
                is_current_week: this.isCurrentWeek(new Date(serverWeek.start_date), new Date(serverWeek.end_date)),
                is_past_week: this.isPastWeek(new Date(serverWeek.end_date)),
                is_future_week: this.isFutureWeek(new Date(serverWeek.start_date))
              };
            }
          });
          console.log('Semanas actualizadas:', this.weeks);
        }
      },
      error: (error) => {
        console.error('Error al cargar el progreso semanal:', error);
        this.toastr.error('Error al cargar el progreso semanal');
      }
    });
  }

  canAddActivity(week: Week): boolean {
    return week.activities.length < this.MAX_ACTIVITIES && week.is_current_week;
  }

  canEditWeek(week: Week | null): boolean {
    if (!week) return false;
    return week.is_current_week;
  }

  addActivity(week: Week) {
    if (this.canAddActivity(week)) {
      week.activities.push({
        description: '',
        completed: false
      });
    }
  }

  removeActivity(week: Week, index: number) {
    if (this.canEditWeek(week)) {
      week.activities.splice(index, 1);
    }
  }

  updateProgress(week: Week) {
    if (!this.canEditWeek(week)) {
      this.toastr.warning('Solo puedes editar la semana actual o semanas pasadas');
      return;
    }

    // Preparar los datos para enviar
    const weekData = {
      ...week,
      proforma_id: this.proforma.id,
      activities: week.activities.map(activity => ({
        description: activity.description,
        completed: activity.completed
      }))
    };

    (this.proformasService.updateWeeklyProgress(weekData) as Observable<ApiResponse>).subscribe({
      next: (response) => {
        if (response.data && !Array.isArray(response.data)) {
          // Actualizar el ID de la semana si es una nueva
          if (week.id?.toString().startsWith('temp_')) {
            week.id = response.data.id;
          }
          this.toastr.success('Progreso semanal actualizado correctamente');
        }
      },
      error: (error) => {
        console.error('Error al actualizar el progreso semanal:', error);
        this.toastr.error('Error al actualizar el progreso semanal');
      }
    });
  }

  getWeekStatus(week: Week): string {
    if (week.is_current_week) return 'Semana Actual';
    if (week.is_past_week) return 'Semana Pasada';
    return 'Semana Futura';
  }

  openNotesModal(week: Week) {
    this.selectedWeek = week;
    this.modalRef = this.modalService.open(this.notesModal, {
      backdrop: 'static',
      keyboard: false,
      size: 'lg'
    });
  }

  closeNotesModal() {
    if (this.modalRef) {
      this.modalRef.close();
      this.modalRef = null;
    }
  }

  saveNotes() {
    if (this.selectedWeek && this.canEditWeek(this.selectedWeek)) {
      this.updateProgress(this.selectedWeek);
      this.closeNotesModal();
    }
  }

  closeModal() {
    if (this.modalRef) {
      this.modalRef.close();
      this.modalRef = null;
    }
    document.body.classList.remove('modal-light-force-global');
    this.modal.dismiss();
  }
}
