import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { AppRole, AppRoleMember } from '../../core/models/api.models';
import { scrollAdminContentTop } from '../../core/utils/scroll';

@Component({
  selector: 'app-admin-roles',
  standalone: false,
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="fw-bold mb-0">Role Management</h2>
      <button class="btn btn-primary" (click)="startCreate()"><i class="bi bi-plus-lg me-1"></i>Add role</button>
    </div>

    <!-- ─── Role add / edit modal ─── -->
    <div *ngIf="editingId !== null" class="modal-backdrop fade show"></div>
    <div *ngIf="editingId !== null" class="modal fade show d-block" tabindex="-1" role="dialog">
      <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">
              <i class="bi bi-shield me-2"></i>{{ editingId ? 'Edit role' : 'New role' }}
            </h5>
          </div>
          <form [formGroup]="form" (ngSubmit)="save()">
            <div class="modal-body">
              <div class="alert alert-danger d-flex align-items-start mb-3" *ngIf="formError">
                <i class="bi bi-exclamation-triangle-fill me-2 mt-1"></i>
                <div class="flex-grow-1">{{ formError }}</div>
                <button type="button" class="btn-close ms-2" aria-label="Dismiss" (click)="formError = ''"></button>
              </div>
              <div class="mb-3">
                <label class="form-label">Role name <span class="text-danger">*</span></label>
                <input class="form-control" formControlName="name"
                       placeholder="e.g. Executive, Coordinator…"
                       [class.is-invalid]="isInvalid(form.get('name'))" />
                <div class="invalid-feedback">Role name is required.</div>
              </div>
              <div class="mb-3">
                <label class="form-label">Description</label>
                <input class="form-control" formControlName="description"
                       placeholder="Short description of this role…" />
              </div>
              <div class="form-check" *ngIf="editingId">
                <input class="form-check-input" type="checkbox" formControlName="isActive" id="roleActive" />
                <label class="form-check-label" for="roleActive">Active</label>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline-secondary" type="button" (click)="cancelEdit()">
                <i class="bi bi-x-lg me-1"></i>Cancel
              </button>
              <button class="btn btn-primary" [disabled]="form.invalid || saving">
                <span *ngIf="saving" class="spinner-border spinner-border-sm me-1"></span>
                <i *ngIf="!saving" class="bi bi-check2-circle me-1"></i>
                {{ editingId ? 'Save changes' : 'Create role' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- ─── Permissions modal ─── -->
    <div *ngIf="permRoleId !== null || permStaffId !== null" class="modal-backdrop fade show"></div>
    <div *ngIf="permRoleId !== null || permStaffId !== null" class="modal fade show d-block" tabindex="-1" role="dialog">
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <div>
              <h5 class="modal-title fw-bold"><i class="bi bi-key me-2"></i>Permissions</h5>
              <div class="text-muted small mt-1" *ngIf="permStaffId !== null">
                User: <strong>{{ permTargetName }}</strong> — individual permissions for this user.
              </div>
              <div class="text-muted small mt-1" *ngIf="permStaffId === null">
                Role: <strong>{{ permRoleName }}</strong> — choose which actions members can perform.
              </div>
            </div>
          </div>
          <div class="modal-body" #permModalBody>
            <div class="alert alert-danger d-flex align-items-start mb-3" *ngIf="permError">
              <i class="bi bi-exclamation-triangle-fill me-2 mt-1"></i>
              <div class="flex-grow-1">{{ permError }}</div>
              <button type="button" class="btn-close ms-2" aria-label="Dismiss" (click)="permError = ''"></button>
            </div>
            <div class="d-flex justify-content-end gap-2 mb-3">
              <button type="button" class="btn btn-sm btn-outline-primary" (click)="selectAllPerms(true)">
                <i class="bi bi-check2-all me-1"></i>Select all
              </button>
              <button type="button" class="btn btn-sm btn-outline-secondary" (click)="selectAllPerms(false)">
                <i class="bi bi-x-circle me-1"></i>Clear all
              </button>
            </div>
            <div *ngFor="let group of permsGrouped; trackBy: trackByModule" class="mb-4">
              <div class="d-flex align-items-center justify-content-between mb-2">
                <h6 class="fw-semibold mb-0">
                  <i class="bi bi-grid-3x3-gap-fill me-1 text-primary opacity-75"></i>{{ moduleLabel(group.module) }}
                </h6>
                <div class="d-flex gap-2">
                  <button type="button" class="btn btn-sm btn-link p-0 text-primary" (click)="selectAllInGroup(group.module, true)">All</button>
                  <button type="button" class="btn btn-sm btn-link p-0 text-muted" (click)="selectAllInGroup(group.module, false)">None</button>
                </div>
              </div>
              <div class="d-flex flex-wrap gap-3 ps-1">
                <div class="form-check" *ngFor="let key of group.keys; trackBy: trackByKey">
                  <input class="form-check-input" type="checkbox"
                         [id]="'perm-' + key"
                         [checked]="selectedPerms.has(key)"
                         (change)="togglePerm(key)" />
                  <label class="form-check-label small" [attr.for]="'perm-' + key">{{ permLabel(key) }}</label>
                </div>
              </div>
              <hr class="mt-3 mb-0" />
            </div>
          </div>
          <div class="modal-footer">
            <div class="text-muted small me-auto">
              {{ selectedPerms.size }} permission{{ selectedPerms.size !== 1 ? 's' : '' }} selected
            </div>
            <button class="btn btn-outline-secondary" type="button" (click)="cancelPerms()">
              <i class="bi bi-x-lg me-1"></i>Cancel
            </button>
            <button class="btn btn-primary" (click)="savePerms()" [disabled]="savingPerms">
              <span *ngIf="savingPerms" class="spinner-border spinner-border-sm me-1"></span>
              <i *ngIf="!savingPerms" class="bi bi-key-fill me-1"></i>Save permissions
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── Filters ─── -->
    <div class="table-card mb-3">
      <div class="row g-2 align-items-end">
        <div class="col-md-3">
          <label class="form-label small text-muted mb-1">Search user</label>
          <div class="input-group input-group-sm">
            <span class="input-group-text"><i class="bi bi-person-search"></i></span>
            <input type="text" class="form-control" placeholder="Filter by user name…"
                   [(ngModel)]="filterUser" (ngModelChange)="onFilterChange()" />
          </div>
        </div>
        <div class="col-md-3">
          <label class="form-label small text-muted mb-1">Search role or description</label>
          <div class="input-group input-group-sm">
            <span class="input-group-text"><i class="bi bi-search"></i></span>
            <input type="text" class="form-control" placeholder="Filter by role…"
                   [(ngModel)]="filterText" (ngModelChange)="onFilterChange()" />
          </div>
        </div>
        <div class="col-md-2">
          <label class="form-label small text-muted mb-1">Status</label>
          <select class="form-select form-select-sm"
                  [(ngModel)]="filterStatus" (ngModelChange)="onFilterChange()">
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div class="col-md-1">
          <button class="btn btn-outline-secondary btn-sm w-100" type="button"
                  (click)="clearFilters()" [disabled]="!filtersApplied()" title="Clear filters">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- ─── Table ─── -->
    <div class="table-card">
      <div class="table-responsive">
        <table class="table align-middle">
          <thead>
            <tr>
              <th>Users</th>
              <th class="sortable" (click)="toggleSort('name')">Role name <i class="bi" [ngClass]="sortIcon('name')"></i></th>
              <th>Description</th>
              <th class="sortable" (click)="toggleSort('permissions')">Permissions <i class="bi" [ngClass]="sortIcon('permissions')"></i></th>
              <th class="sortable" (click)="toggleSort('status')">Status <i class="bi" [ngClass]="sortIcon('status')"></i></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of pagedFlatRows()">
              <td>
                <ng-container *ngIf="!row.member">
                  <span class="text-muted small fst-italic">No users assigned</span>
                </ng-container>
                <ng-container *ngIf="row.member">
                  <div class="d-flex align-items-center gap-2">
                    <span class="d-flex align-items-center justify-content-center rounded-circle text-white fw-semibold flex-shrink-0"
                          [style.background]="avatarColor(row.member.name)"
                          style="width:30px;height:30px;font-size:0.72rem;">
                      {{ row.member.name.charAt(0).toUpperCase() }}
                    </span>
                    <span class="fw-medium small" [title]="row.member.name">{{ row.member.name }}</span>
                  </div>
                </ng-container>
              </td>
              <td><strong>{{ row.role.name }}</strong></td>
              <td class="text-muted small">{{ row.role.description || '—' }}</td>
              <td>
                <ng-container *ngIf="row.member; else rolePerms">
                  <span *ngIf="row.member.permissions.length === 0" class="badge bg-secondary">None</span>
                  <span *ngIf="row.member.permissions.length > 0" class="badge bg-primary">
                    {{ row.member.permissions.length }} permission{{ row.member.permissions.length !== 1 ? 's' : '' }}
                  </span>
                </ng-container>
                <ng-template #rolePerms>
                  <span *ngIf="row.role.permissions.length === 0" class="badge bg-secondary">None</span>
                  <span *ngIf="row.role.permissions.length > 0" class="badge bg-primary">
                    {{ row.role.permissions.length }} permission{{ row.role.permissions.length !== 1 ? 's' : '' }}
                  </span>
                </ng-template>
              </td>
              <td>
                <span class="badge" [class.bg-success]="row.role.isActive" [class.bg-secondary]="!row.role.isActive">
                  {{ row.role.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="text-end">
                <div class="d-flex gap-1 justify-content-end">
                  <button class="btn btn-sm btn-outline-secondary"
                          (click)="row.member ? openUserPerms(row.member) : openPerms(row.role)"
                          title="Manage permissions">
                    <i class="bi bi-key me-1"></i>Permissions
                  </button>
                  <button class="btn btn-sm btn-outline-primary" (click)="startEdit(row.role)">Edit</button>
                  <button *ngIf="row.role.isActive" class="btn btn-sm btn-outline-danger"
                          (click)="toggleActive(row.role)" [disabled]="togglingId === row.role.id">
                    <span *ngIf="togglingId === row.role.id" class="spinner-border spinner-border-sm me-1"></span>
                    <i *ngIf="togglingId !== row.role.id" class="bi bi-pause-circle me-1"></i>Deactivate
                  </button>
                  <button *ngIf="!row.role.isActive" class="btn btn-sm btn-outline-success"
                          (click)="toggleActive(row.role)" [disabled]="togglingId === row.role.id">
                    <span *ngIf="togglingId === row.role.id" class="spinner-border spinner-border-sm me-1"></span>
                    <i *ngIf="togglingId !== row.role.id" class="bi bi-check2-circle me-1"></i>Activate
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="flatFiltered().length === 0">
              <td colspan="6" class="text-center text-muted py-3">
                {{ items.length === 0 ? 'No roles yet. Click "Add role" to create one.' : 'No roles match the filters.' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="flatFiltered().length > pageSize" class="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-3">
        <small class="text-muted">Showing {{ pageStart() }}–{{ pageEnd() }} of {{ flatFiltered().length }}</small>
        <nav>
          <ul class="pagination pagination-sm mb-0">
            <li class="page-item" [class.disabled]="page === 1">
              <button class="page-link" type="button" (click)="setPage(page - 1)" [disabled]="page === 1" aria-label="Previous">
                <i class="bi bi-chevron-left"></i>
              </button>
            </li>
            <li class="page-item" *ngFor="let p of pageNumbers()" [class.active]="p === page">
              <button class="page-link" type="button" (click)="setPage(p)">{{ p }}</button>
            </li>
            <li class="page-item" [class.disabled]="page === totalPages()">
              <button class="page-link" type="button" (click)="setPage(page + 1)" [disabled]="page === totalPages()" aria-label="Next">
                <i class="bi bi-chevron-right"></i>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  `
})
export class AdminRolesComponent implements OnInit, OnDestroy {
  private api   = inject(ApiService);
  private fb    = inject(FormBuilder);
  private toast = inject(ToastService);

  items: AppRole[] = [];

  // ── Role form state ──
  editingId:   number | null = null;
  editingRole: AppRole | null = null;
  formError  = '';
  saving     = false;

  // ── Permissions modal state ──
  permRoleId:   number | null = null;
  permStaffId:  number | null = null;
  permRoleName  = '';
  permTargetName = '';
  permError     = '';
  savingPerms   = false;

  // ── Filters & pagination & sort ──
  filterText   = '';
  filterUser   = '';
  filterStatus: 'all' | 'active' | 'inactive' = 'all';
  page = 1;
  readonly pageSize = 10;
  sortKey: 'name' | 'permissions' | 'status' | null = null;
  sortDir: 'asc' | 'desc' = 'asc';

  private readonly AVATAR_COLORS = [
    '#4f6ef7', '#2da44e', '#e36209', '#8250df',
    '#cf222e', '#0969da', '#1a7f37', '#9a6700',
    '#6639ba', '#c0392b'
  ];

  avatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return this.AVATAR_COLORS[Math.abs(hash) % this.AVATAR_COLORS.length];
  }

  // ── Permissions catalog ──
  permsCatalog: string[] = [];
  permsGrouped: { module: string; keys: string[] }[] = [];
  selectedPerms = new Set<string>();
  togglingId: number | null = null;

  @ViewChild('permModalBody') permModalBodyRef?: ElementRef<HTMLElement>;

  form = this.fb.group({
    name:        ['', Validators.required],
    description: [''],
    isActive:    [true]
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
    if (this.permRoleId !== null || this.permStaffId !== null) { this.cancelPerms(); return; }
    if (this.editingId  !== null) this.cancelEdit();
  }

  // ── Role form ──────────────────────────────────────────────────────────────

  startCreate(): void {
    this.editingId   = 0;
    this.editingRole = null;
    this.formError   = '';
    this.saving      = false;
    this.form.reset({ name: '', description: '', isActive: true });
    this.lockBody();
  }

  startEdit(r: AppRole): void {
    this.editingId   = r.id;
    this.editingRole = r;
    this.formError   = '';
    this.saving      = false;
    this.form.reset({ name: r.name, description: r.description || '', isActive: r.isActive });
    this.lockBody();
  }

  cancelEdit(): void {
    this.editingId   = null;
    this.editingRole = null;
    this.formError   = '';
    this.unlockBody();
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving    = true;
    this.formError = '';
    const v = this.form.getRawValue() as any;

    // Preserve existing permissions when editing; start with none for new roles
    const permissions = this.editingRole?.permissions ?? [];
    const payload = { ...v, permissions };

    const op = this.editingId
      ? this.api.updateRole(this.editingId, payload)
      : this.api.createRole(payload);

    op.subscribe({
      next: () => {
        this.toast.show(
          this.editingId ? `Role "${v.name}" updated.` : `Role "${v.name}" created.`,
          'success', 4000,
          { title: this.editingId ? 'Role updated' : 'Role created' }
        );
        this.saving    = false;
        this.editingId = null;
        this.editingRole = null;
        this.unlockBody();
        this.load();
      },
      error: (err: any) => {
        this.saving    = false;
        this.formError = err?.error?.message || err?.error?.errors?.[0] || 'Could not save. Please try again.';
      }
    });
  }

  // ── Permissions modal ──────────────────────────────────────────────────────

  openPerms(r: AppRole): void {
    this.permRoleId    = r.id;
    this.permStaffId   = null;
    this.permRoleName  = r.name;
    this.permTargetName = r.name;
    this.permError     = '';
    this.savingPerms   = false;
    this.selectedPerms = new Set(r.permissions);
    this.lockBody();
  }

  openUserPerms(member: AppRoleMember): void {
    this.permStaffId    = member.staffId;
    this.permRoleId     = null;
    this.permTargetName = member.name;
    this.permRoleName   = '';
    this.permError      = '';
    this.savingPerms    = false;
    this.selectedPerms  = new Set(member.permissions);
    this.lockBody();
  }

  cancelPerms(): void {
    this.permRoleId    = null;
    this.permStaffId   = null;
    this.permTargetName = '';
    this.permError     = '';
    this.selectedPerms.clear();
    this.unlockBody();
  }

  savePerms(): void {
    this.savingPerms = true;
    this.permError   = '';

    if (this.permStaffId !== null) {
      const staffId = this.permStaffId;
      const name    = this.permTargetName;
      this.api.setStaffPermissions(staffId, Array.from(this.selectedPerms)).subscribe({
        next: () => {
          this.toast.show(`Permissions for "${name}" saved.`, 'success', 4000, { title: 'Permissions updated' });
          this.savingPerms  = false;
          this.permStaffId  = null;
          this.permTargetName = '';
          this.selectedPerms.clear();
          this.unlockBody();
          this.load();
        },
        error: (err: any) => {
          this.savingPerms = false;
          this.permError   = err?.error?.message || err?.error?.errors?.[0] || 'Could not save permissions. Please try again.';
          setTimeout(() => this.permModalBodyRef?.nativeElement?.scrollTo({ top: 0, behavior: 'smooth' }), 0);
        }
      });
      return;
    }

    if (this.permRoleId === null) { this.savingPerms = false; return; }

    const role = this.items.find(r => r.id === this.permRoleId);
    if (!role) { this.savingPerms = false; return; }

    const payload = {
      name:        role.name,
      description: role.description,
      isActive:    role.isActive,
      permissions: Array.from(this.selectedPerms)
    };

    this.api.updateRole(this.permRoleId, payload).subscribe({
      next: () => {
        this.toast.show(`Permissions for "${role.name}" saved.`, 'success', 4000, { title: 'Permissions updated' });
        this.savingPerms  = false;
        this.permRoleId   = null;
        this.permTargetName = '';
        this.selectedPerms.clear();
        this.unlockBody();
        this.load();
      },
      error: (err: any) => {
        this.savingPerms = false;
        this.permError   = err?.error?.message || err?.error?.errors?.[0] || 'Could not save permissions. Please try again.';
        setTimeout(() => this.permModalBodyRef?.nativeElement?.scrollTo({ top: 0, behavior: 'smooth' }), 0);
      }
    });
  }

  // ── Permission helpers ─────────────────────────────────────────────────────

  togglePerm(key: string): void {
    if (this.selectedPerms.has(key)) this.selectedPerms.delete(key);
    else this.selectedPerms.add(key);
  }

  selectAllPerms(on: boolean): void {
    if (on) this.permsCatalog.forEach(k => this.selectedPerms.add(k));
    else this.selectedPerms.clear();
  }

  selectAllInGroup(module: string, on: boolean): void {
    for (const key of this.permsCatalog) {
      if (!key.startsWith(module + '.')) continue;
      if (on) this.selectedPerms.add(key);
      else    this.selectedPerms.delete(key);
    }
  }

  permLabel(key: string): string {
    const labelMap: Record<string, string> = {
      'customers.update_mobile': 'Update Mobile No.',
      'customers.update_email':  'Update Email'
    };
    if (labelMap[key]) return labelMap[key];
    const [, action] = key.split('.');
    if (!action) return key;
    if (action === 'toggle') return 'Activate / Deactivate';
    return action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  moduleLabel(module: string): string {
    const map: Record<string, string> = { customers: 'People' };
    return map[module] ?? module.replace(/\b\w/g, c => c.toUpperCase());
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

  // ── Misc ──────────────────────────────────────────────────────────────────

  load(): void {
    this.api.listRoles().subscribe({ next: rs => this.items = rs });
  }

  isInvalid(ctrl: AbstractControl | null): boolean {
    return !!ctrl && ctrl.invalid && (ctrl.touched || ctrl.dirty);
  }

  filtered(): AppRole[] {
    const q = this.filterText.trim().toLowerCase();
    const list = this.items.filter(r => {
      if (q && !r.name.toLowerCase().includes(q) && !(r.description || '').toLowerCase().includes(q)) return false;
      if (this.filterStatus === 'active'   && !r.isActive) return false;
      if (this.filterStatus === 'inactive' &&  r.isActive) return false;
      return true;
    });
    if (!this.sortKey) return list;
    const dir = this.sortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      if (this.sortKey === 'name')        return a.name.localeCompare(b.name) * dir;
      if (this.sortKey === 'permissions') return (a.permissions.length - b.permissions.length) * dir;
      if (this.sortKey === 'status')      return ((a.isActive ? 1 : 0) - (b.isActive ? 1 : 0)) * dir;
      return 0;
    });
  }

  filtersApplied(): boolean { return !!this.filterText || !!this.filterUser || this.filterStatus !== 'all'; }

  clearFilters(): void {
    this.filterText   = '';
    this.filterUser   = '';
    this.filterStatus = 'all';
    this.page = 1;
  }

  onFilterChange(): void { this.page = 1; }

  toggleSort(key: 'name' | 'permissions' | 'status'): void {
    if (this.sortKey === key) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDir = 'asc';
    }
    this.page = 1;
  }

  sortIcon(key: 'name' | 'permissions' | 'status'): string {
    if (this.sortKey !== key) return 'bi-arrow-down-up text-muted';
    return this.sortDir === 'asc' ? 'bi-caret-up-fill' : 'bi-caret-down-fill';
  }

  flatFiltered(): { role: AppRole; member: AppRoleMember | null }[] {
    const rows: { role: AppRole; member: AppRoleMember | null }[] = [];
    const uq = this.filterUser.trim().toLowerCase();
    for (const role of this.filtered()) {
      if (role.members?.length) {
        const matched = uq
          ? role.members.filter(m => m.name.toLowerCase().includes(uq))
          : role.members;
        if (uq && matched.length === 0) continue;
        for (const m of (matched.length ? matched : role.members)) rows.push({ role, member: m });
      } else {
        if (uq) continue;
        rows.push({ role, member: null });
      }
    }
    return rows;
  }

  pagedFlatRows(): { role: AppRole; member: AppRoleMember | null }[] {
    const start = (this.page - 1) * this.pageSize;
    return this.flatFiltered().slice(start, start + this.pageSize);
  }

  pagedItems(): AppRole[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.flatFiltered().length / this.pageSize));
  }

  pageStart(): number {
    const len = this.flatFiltered().length;
    if (len === 0) return 0;
    return (this.page - 1) * this.pageSize + 1;
  }

  pageEnd(): number {
    return Math.min(this.page * this.pageSize, this.flatFiltered().length);
  }

  pageNumbers(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  setPage(p: number): void {
    const total = this.totalPages();
    if (p < 1 || p > total) return;
    this.page = p;
    scrollAdminContentTop();
  }

  toggleActive(r: AppRole): void {
    if (this.togglingId !== null) return;
    this.togglingId = r.id;
    this.api.setRoleActive(r.id, !r.isActive).subscribe({
      next: () => {
        this.togglingId = null;
        this.toast.show(
          `Role "${r.name}" ${r.isActive ? 'deactivated' : 'activated'}.`,
          'success', 3000,
          { title: 'Role updated' }
        );
        this.load();
      },
      error: () => {
        this.togglingId = null;
        this.toast.show(`Could not update "${r.name}".`, 'danger', 4000, { title: 'Update failed' });
      }
    });
  }

  trackByModule(_: number, item: { module: string }): string { return item.module; }
  trackByKey(_: number, key: string): string { return key; }

  private lockBody():   void { document.body.classList.add('modal-open'); }
  private unlockBody(): void { document.body.classList.remove('modal-open'); }
}
