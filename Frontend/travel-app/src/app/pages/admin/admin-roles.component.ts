import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { AppRole } from '../../core/models/api.models';

@Component({
  selector: 'app-admin-roles',
  standalone: false,
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="fw-bold mb-0">Role Management</h2>
      <button class="btn btn-primary" (click)="startCreate()"><i class="bi bi-plus-lg me-1"></i>Add role</button>
    </div>

    <div class="alert alert-info small">
      Roles define a set of permissions. Assign roles to staff or customers so their access is managed centrally.
    </div>

    <!-- Add/Edit modal -->
    <div *ngIf="editingId !== null" class="modal-backdrop fade show"></div>
    <div *ngIf="editingId !== null" class="modal fade show d-block" tabindex="-1" role="dialog">
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">{{ editingId ? 'Edit role' : 'New role' }}</h5>
          </div>
          <form [formGroup]="form" (ngSubmit)="save()">
            <div class="modal-body" #modalBody>
              <div class="alert alert-danger d-flex align-items-start mb-3" *ngIf="formError">
                <i class="bi bi-exclamation-triangle-fill me-2 mt-1"></i>
                <div class="flex-grow-1">{{ formError }}</div>
                <button type="button" class="btn-close ms-2" aria-label="Dismiss" (click)="formError = ''"></button>
              </div>
              <div class="row g-3 mb-4">
                <div class="col-md-6">
                  <label class="form-label">Role name <span class="text-danger">*</span></label>
                  <input class="form-control" formControlName="name" placeholder="e.g. Executive, Coordinator…" [class.is-invalid]="isInvalid(form.get('name'))" />
                  <div class="invalid-feedback">Role name is required.</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Description</label>
                  <input class="form-control" formControlName="description" placeholder="Short description of this role…" />
                </div>
                <div class="col-12" *ngIf="editingId">
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" formControlName="isActive" id="roleActive" />
                    <label class="form-check-label" for="roleActive">Active</label>
                  </div>
                </div>
              </div>

              <h6 class="fw-bold mb-2">Permissions</h6>
              <p class="text-muted small mb-3">Choose which actions members with this role are allowed to perform.</p>

              <div *ngFor="let group of permsGrouped; trackBy: trackByModule" class="mb-3">
                <div class="d-flex align-items-center justify-content-between mb-1">
                  <h6 class="fw-semibold mb-0 text-capitalize small text-primary">{{ group.module }}</h6>
                  <div>
                    <button type="button" class="btn btn-sm btn-link p-0 me-2" (click)="selectAllInGroup(group.module, true)">All</button>
                    <button type="button" class="btn btn-sm btn-link p-0 text-muted" (click)="selectAllInGroup(group.module, false)">None</button>
                  </div>
                </div>
                <div class="d-flex flex-wrap gap-3">
                  <div class="form-check" *ngFor="let key of group.keys; trackBy: trackByKey">
                    <input class="form-check-input" type="checkbox"
                           [id]="'perm-' + key"
                           [checked]="selectedPerms.has(key)"
                           (change)="togglePerm(key)" />
                    <label class="form-check-label small" [attr.for]="'perm-' + key">{{ permLabel(key) }}</label>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline-secondary" type="button" (click)="cancel()"><i class="bi bi-x-lg me-1"></i>Cancel</button>
              <button class="btn btn-primary" [disabled]="form.invalid">
                <i class="bi bi-check2-circle me-1"></i>Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="table-card mb-3">
      <div class="row g-2 align-items-end">
        <div class="col-md-5">
          <label class="form-label small text-muted mb-1">Search name or description</label>
          <div class="input-group input-group-sm">
            <span class="input-group-text"><i class="bi bi-search"></i></span>
            <input type="text" class="form-control" placeholder="Type to filter…" [(ngModel)]="filterText" />
          </div>
        </div>
        <div class="col-md-3">
          <label class="form-label small text-muted mb-1">Status</label>
          <select class="form-select form-select-sm" [(ngModel)]="filterStatus">
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div class="col-md-1">
          <button class="btn btn-outline-secondary btn-sm w-100" type="button" (click)="clearFilters()" [disabled]="!filtersApplied()" title="Clear filters">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
      </div>
    </div>

    <div class="table-card">
      <div class="table-responsive">
        <table class="table align-middle">
          <thead>
            <tr>
              <th>Role name</th>
              <th>Description</th>
              <th>Permissions</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of filtered()">
              <td><strong>{{ r.name }}</strong></td>
              <td class="text-muted small">{{ r.description || '—' }}</td>
              <td>
                <span class="badge bg-secondary me-1" *ngIf="r.permissions.length === 0">None</span>
                <span class="badge bg-primary me-1" *ngIf="r.permissions.length > 0">{{ r.permissions.length }} permission{{ r.permissions.length !== 1 ? 's' : '' }}</span>
              </td>
              <td><span class="badge" [class.bg-success]="r.isActive" [class.bg-secondary]="!r.isActive">{{ r.isActive ? 'Active' : 'Inactive' }}</span></td>
              <td class="text-end">
                <div class="d-flex gap-1 justify-content-end">
                  <button class="btn btn-sm btn-outline-secondary" (click)="edit(r)"><i class="bi bi-pencil me-1"></i>Edit</button>
                  <button *ngIf="r.isActive" class="btn btn-sm btn-outline-warning" (click)="toggleActive(r)" [disabled]="togglingId === r.id">
                    <span *ngIf="togglingId === r.id" class="spinner-border spinner-border-sm me-1"></span>
                    <i *ngIf="togglingId !== r.id" class="bi bi-pause-circle me-1"></i>Deactivate
                  </button>
                  <button *ngIf="!r.isActive" class="btn btn-sm btn-outline-success" (click)="toggleActive(r)" [disabled]="togglingId === r.id">
                    <span *ngIf="togglingId === r.id" class="spinner-border spinner-border-sm me-1"></span>
                    <i *ngIf="togglingId !== r.id" class="bi bi-check2-circle me-1"></i>Activate
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filtered().length === 0">
              <td colspan="5" class="text-center text-muted py-3">{{ items.length === 0 ? 'No roles yet. Click "Add role" to create one.' : 'No roles match the filters.' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AdminRolesComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  items: AppRole[] = [];
  editingId: number | null = null;
  formError = '';
  togglingId: number | null = null;

  filterText = '';
  filterStatus: 'all' | 'active' | 'inactive' = 'all';

  permsCatalog: string[] = [];
  permsGrouped: { module: string; keys: string[] }[] = [];
  selectedPerms = new Set<string>();

  @ViewChild('modalBody') modalBodyRef?: ElementRef<HTMLElement>;

  form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    isActive: [true]
  });

  ngOnInit(): void {
    this.load();
    this.api.listPermissionCatalog().subscribe({
      next: list => {
        this.permsCatalog = list || [];
        this.permsGrouped = this.buildGroups(this.permsCatalog);
      }
    });
  }

  ngOnDestroy(): void { this.unlockBody(); }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.editingId !== null) this.cancel();
  }

  private buildGroups(catalog: string[]): { module: string; keys: string[] }[] {
    const groups = new Map<string, string[]>();
    for (const key of catalog) {
      const [mod] = key.split('.');
      const arr = groups.get(mod) ?? [];
      arr.push(key);
      groups.set(mod, arr);
    }
    return Array.from(groups.entries()).map(([module, keys]) => ({ module, keys }));
  }

  togglePerm(key: string): void {
    if (this.selectedPerms.has(key)) this.selectedPerms.delete(key);
    else this.selectedPerms.add(key);
  }

  selectAllInGroup(module: string, on: boolean): void {
    for (const key of this.permsCatalog) {
      if (!key.startsWith(module + '.')) continue;
      if (on) this.selectedPerms.add(key);
      else this.selectedPerms.delete(key);
    }
  }

  permLabel(key: string): string {
    const [, action] = key.split('.');
    if (!action) return key;
    return action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  trackByModule(_: number, item: { module: string }): string { return item.module; }
  trackByKey(_: number, key: string): string { return key; }

  load(): void {
    this.api.listRoles().subscribe({ next: rs => this.items = rs });
  }

  isInvalid(ctrl: AbstractControl | null): boolean {
    return !!ctrl && ctrl.invalid && (ctrl.touched || ctrl.dirty);
  }

  filtered(): AppRole[] {
    const q = this.filterText.trim().toLowerCase();
    return this.items.filter(r => {
      if (q && !r.name.toLowerCase().includes(q) && !(r.description || '').toLowerCase().includes(q)) return false;
      if (this.filterStatus === 'active' && !r.isActive) return false;
      if (this.filterStatus === 'inactive' && r.isActive) return false;
      return true;
    });
  }

  filtersApplied(): boolean { return !!this.filterText || this.filterStatus !== 'all'; }
  clearFilters(): void { this.filterText = ''; this.filterStatus = 'all'; }

  startCreate(): void {
    this.editingId = 0;
    this.formError = '';
    this.selectedPerms.clear();
    this.form.reset({ name: '', description: '', isActive: true });
    this.lockBody();
  }

  edit(r: AppRole): void {
    this.editingId = r.id;
    this.formError = '';
    this.selectedPerms = new Set(r.permissions);
    this.form.reset({ name: r.name, description: r.description || '', isActive: r.isActive });
    this.lockBody();
  }

  cancel(): void {
    this.editingId = null;
    this.formError = '';
    this.selectedPerms.clear();
    this.unlockBody();
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.formError = '';
    const v = this.form.getRawValue() as any;
    const payload = { ...v, permissions: Array.from(this.selectedPerms) };
    const op = this.editingId
      ? this.api.updateRole(this.editingId, payload)
      : this.api.createRole(payload);
    op.subscribe({
      next: () => {
        this.toast.show(
          this.editingId ? `Role "${v.name}" updated.` : `Role "${v.name}" created.`,
          'success', 4000, { title: this.editingId ? 'Role updated' : 'Role created' }
        );
        this.editingId = null;
        this.selectedPerms.clear();
        this.unlockBody();
        this.load();
      },
      error: (err: any) => {
        this.formError = err?.error?.message || err?.error?.errors?.[0] || 'Could not save. Please try again.';
        setTimeout(() => this.modalBodyRef?.nativeElement?.scrollTo({ top: 0, behavior: 'smooth' }), 0);
      }
    });
  }

  toggleActive(r: AppRole): void {
    if (this.togglingId !== null) return;
    this.togglingId = r.id;
    this.api.setRoleActive(r.id, !r.isActive).subscribe({
      next: () => {
        this.togglingId = null;
        this.toast.show(`Role "${r.name}" ${r.isActive ? 'deactivated' : 'activated'}.`, 'success', 3000, { title: 'Role updated' });
        this.load();
      },
      error: () => {
        this.togglingId = null;
        this.toast.show(`Could not update "${r.name}".`, 'danger', 4000, { title: 'Update failed' });
      }
    });
  }

  private lockBody(): void {
    document.body.classList.add('modal-open');
  }

  private unlockBody(): void {
    document.body.classList.remove('modal-open');
  }
}
