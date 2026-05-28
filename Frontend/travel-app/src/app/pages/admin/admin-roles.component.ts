import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmModalService } from '../../core/services/confirm-modal.service';
import { AppRole, AppRoleMember, CustomPermission } from '../../core/models/api.models';
import { scrollAdminContentTop } from '../../core/utils/scroll';

@Component({
  selector: 'app-admin-roles',
  standalone: false,
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="fw-bold mb-0">Role Management</h2>
      <button *ngIf="activeTab === 'roles'" class="btn btn-primary" (click)="startCreate()"><i class="bi bi-plus-lg me-1"></i>Add role</button>
      <button *ngIf="activeTab === 'permissions' && auth.isSuperAdmin()" class="btn btn-primary" (click)="startCreatePerm()">
        <i class="bi bi-plus-lg me-1"></i>Add permission
      </button>
    </div>

    <!-- ─── Tabs ─── -->
    <ul class="nav nav-tabs mb-3">
      <li class="nav-item">
        <button class="nav-link" [class.active]="activeTab === 'roles'" type="button" (click)="activeTab = 'roles'">
          <i class="bi bi-shield-check me-1"></i>Roles
        </button>
      </li>
      <li class="nav-item">
        <button class="nav-link" [class.active]="activeTab === 'permissions'" type="button" (click)="activeTab = 'permissions'; loadPerms()">
          <i class="bi bi-key me-1"></i>Permission Catalog
        </button>
      </li>
    </ul>

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

            <!-- Toolbar -->
            <div class="d-flex align-items-center justify-content-between mb-3 gap-2 flex-wrap">
              <div class="d-flex gap-2">
                <button type="button" class="btn btn-sm btn-outline-secondary" (click)="toggleAllModules()">
                  <i class="bi me-1" [class.bi-arrows-expand]="!areAllExpanded()" [class.bi-arrows-collapse]="areAllExpanded()"></i>
                  {{ areAllExpanded() ? 'Collapse all' : 'Expand all' }}
                </button>
              </div>
              <div class="d-flex gap-2">
                <button type="button" class="btn btn-sm btn-outline-primary" (click)="selectAllPerms(true)">
                  <i class="bi bi-check2-all me-1"></i>Select all
                </button>
                <button type="button" class="btn btn-sm btn-outline-secondary" (click)="selectAllPerms(false)">
                  <i class="bi bi-x-circle me-1"></i>Clear all
                </button>
              </div>
            </div>

            <!-- Accordion modules -->
            <div *ngFor="let group of permsGrouped; trackBy: trackByModule"
                 class="border rounded mb-2 overflow-hidden">

              <!-- Accordion header -->
              <div class="d-flex align-items-center justify-content-between px-3 py-2"
                   style="cursor:pointer; background: var(--tm-surface, #f8f9f4);"
                   (click)="toggleModule(group.module)">
                <div class="d-flex align-items-center gap-2">
                  <i class="bi text-muted"
                     style="transition: transform .2s; display:inline-block;"
                     [style.transform]="expandedModules.has(group.module) ? 'rotate(90deg)' : 'rotate(0deg)'"
                     [class.bi-chevron-right]="!expandedModules.has(group.module)"
                     [class.bi-chevron-down]="expandedModules.has(group.module)"></i>
                  <span class="fw-semibold small">{{ moduleLabel(group.module) }}</span>
                  <span class="badge rounded-pill ms-1"
                        [class.bg-primary]="groupSelectedCount(group) > 0"
                        [class.bg-light]="groupSelectedCount(group) === 0"
                        [class.text-muted]="groupSelectedCount(group) === 0"
                        style="font-size:.7rem">
                    {{ groupSelectedCount(group) }} / {{ group.keys.length }}
                  </span>
                </div>
                <div class="d-flex gap-2" (click)="$event.stopPropagation()">
                  <button type="button" class="btn btn-sm btn-link p-0 text-primary" style="font-size:.8rem"
                          (click)="selectAllInGroup(group.module, true)">All</button>
                  <button type="button" class="btn btn-sm btn-link p-0 text-muted" style="font-size:.8rem"
                          (click)="selectAllInGroup(group.module, false)">None</button>
                </div>
              </div>

              <!-- Accordion body -->
              <div *ngIf="expandedModules.has(group.module)" class="px-3 py-3 border-top bg-white">
                <div class="row g-2">
                  <div class="col-sm-6 col-md-4" *ngFor="let key of group.keys; trackBy: trackByKey">
                    <div class="form-check mb-0">
                      <input class="form-check-input" type="checkbox"
                             [id]="'perm-' + key"
                             [checked]="selectedPerms.has(key)"
                             (change)="togglePerm(key)" />
                      <label class="form-check-label small d-inline-flex align-items-center gap-1" [attr.for]="'perm-' + key">
                        {{ permLabel(key) }}
                        <i *ngIf="isViewKey(key)"
                           class="bi bi-shield-lock-fill text-primary ms-1"
                           style="font-size:.75rem;"
                           title="Page access — this must be enabled for any other permission in this module to take effect"></i>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
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

    <!-- ─── Permission add / edit modal ─── -->
    <div *ngIf="editingPerm !== undefined" class="modal-backdrop fade show"></div>
    <div *ngIf="editingPerm !== undefined" class="modal fade show d-block" tabindex="-1" role="dialog">
      <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">
              <i class="bi bi-key me-2"></i>{{ permFormMode === 'create' ? 'New permission' : 'Edit permission' }}
            </h5>
          </div>
          <form [formGroup]="permForm" (ngSubmit)="savePerm()">
            <div class="modal-body">
              <div class="alert alert-danger d-flex align-items-start mb-3" *ngIf="permFormError">
                <i class="bi bi-exclamation-triangle-fill me-2 mt-1"></i>
                <div class="flex-grow-1">{{ permFormError }}</div>
                <button type="button" class="btn-close ms-2" aria-label="Dismiss" (click)="permFormError = ''"></button>
              </div>
              <div class="mb-3">
                <label class="form-label">Key <span class="text-danger">*</span></label>
                <input class="form-control" formControlName="key"
                       placeholder="e.g. reports.export"
                       [class.is-invalid]="isInvalid(permForm.get('key'))"
                       [readonly]="permFormMode === 'edit'" />
                <div class="invalid-feedback">
                  Key is required and must match the pattern <code>module.action</code> (lowercase, dots and underscores allowed).
                </div>
                <div class="form-text" *ngIf="permFormMode === 'create'">Format: <code>module.action</code> e.g. <code>reports.export</code></div>
              </div>
              <div class="mb-3">
                <label class="form-label">Display name <span class="text-danger">*</span></label>
                <input class="form-control" formControlName="displayName"
                       placeholder="e.g. Export Reports"
                       [class.is-invalid]="isInvalid(permForm.get('displayName'))" />
                <div class="invalid-feedback">Display name is required.</div>
              </div>
              <div class="mb-3">
                <label class="form-label">Module <span class="text-danger">*</span></label>
                <input class="form-control" formControlName="module"
                       placeholder="e.g. reports"
                       [class.is-invalid]="isInvalid(permForm.get('module'))" />
                <div class="invalid-feedback">Module is required.</div>
              </div>
              <div class="mb-3">
                <label class="form-label">Description</label>
                <input class="form-control" formControlName="description"
                       placeholder="Optional description…" />
              </div>
              <div class="form-check" *ngIf="permFormMode === 'edit'">
                <input class="form-check-input" type="checkbox" formControlName="isActive" id="permActive" />
                <label class="form-check-label" for="permActive">Active</label>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline-secondary" type="button" (click)="cancelPermEdit()">
                <i class="bi bi-x-lg me-1"></i>Cancel
              </button>
              <button class="btn btn-primary" [disabled]="permForm.invalid || savingPerm">
                <span *ngIf="savingPerm" class="spinner-border spinner-border-sm me-1"></span>
                <i *ngIf="!savingPerm" class="bi bi-check2-circle me-1"></i>
                {{ permFormMode === 'create' ? 'Create permission' : 'Save changes' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- ─── Role view modal ─── -->
    <div *ngIf="viewingRole !== null" class="modal-backdrop fade show"></div>
    <div *ngIf="viewingRole !== null" class="modal fade show d-block" tabindex="-1" role="dialog">
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold"><i class="bi bi-eye me-2"></i>Role Details</h5>
            <button type="button" class="btn-close" (click)="closeViewRole()"></button>
          </div>
          <div class="modal-body">
            <dl class="row mb-0">
              <dt class="col-sm-3 text-muted small">Name</dt>
              <dd class="col-sm-9 fw-semibold">{{ viewingRole.name }}</dd>
              <dt class="col-sm-3 text-muted small">Description</dt>
              <dd class="col-sm-9">{{ viewingRole.description || '—' }}</dd>
              <dt class="col-sm-3 text-muted small">Status</dt>
              <dd class="col-sm-9">
                <span class="badge" [class.bg-success]="viewingRole.isActive" [class.bg-secondary]="!viewingRole.isActive">
                  {{ viewingRole.isActive ? 'Active' : 'Inactive' }}
                </span>
              </dd>
              <dt class="col-sm-3 text-muted small pt-1">Permissions</dt>
              <dd class="col-sm-9">
                <span *ngIf="viewingRole.permissions.length === 0" class="text-muted small fst-italic">None assigned</span>
                <div *ngIf="viewingRole.permissions.length > 0">
                  <div class="text-muted small mb-2">{{ viewingRole.permissions.length }} permission{{ viewingRole.permissions.length !== 1 ? 's' : '' }} assigned</div>
                  <div *ngFor="let group of rolePermsByModule(viewingRole)" class="mb-3">
                    <div class="fw-semibold small mb-1" style="color: var(--tm-primary, #4f6c3a);">
                      {{ moduleLabel(group.module) }}
                    </div>
                    <div class="d-flex flex-wrap gap-1">
                      <span *ngFor="let key of group.perms" class="badge bg-light text-dark border" style="font-size:.72rem;">
                        {{ permLabel(key) }}
                      </span>
                    </div>
                  </div>
                </div>
              </dd>
              <dt class="col-sm-3 text-muted small pt-1">Members</dt>
              <dd class="col-sm-9">
                <span *ngIf="!viewingRole.members?.length" class="text-muted small fst-italic">No users assigned</span>
                <div *ngFor="let m of viewingRole.members" class="d-flex align-items-center gap-2 mb-1">
                  <span class="d-flex align-items-center justify-content-center rounded-circle text-white fw-semibold flex-shrink-0"
                        [style.background]="avatarColor(m.name)"
                        style="width:26px;height:26px;font-size:0.68rem;">
                    {{ m.name.charAt(0).toUpperCase() }}
                  </span>
                  <span class="small">{{ m.name }}</span>
                </div>
              </dd>

              <!-- Individual user overrides — shown only when the member has actual overrides -->
              <ng-container *ngIf="viewingMember !== null && viewingMember.permissions.length > 0">
                <dt class="col-sm-3 text-muted small pt-1">Individual overrides</dt>
                <dd class="col-sm-9">
                  <div class="text-muted small mb-2">
                    {{ viewingMember.permissions.length }} individual override{{ viewingMember.permissions.length !== 1 ? 's' : '' }}
                    assigned directly to <strong>{{ viewingMember.name }}</strong>
                  </div>
                  <div *ngFor="let group of groupPermsByModule(viewingMember.permissions)" class="mb-2">
                    <div class="fw-semibold small mb-1" style="color: var(--tm-primary, #4f6c3a);">
                      {{ moduleLabel(group.module) }}
                    </div>
                    <div class="d-flex flex-wrap gap-1">
                      <span *ngFor="let key of group.perms" class="badge bg-light text-dark border" style="font-size:.72rem;">
                        {{ permLabel(key) }}
                      </span>
                    </div>
                  </div>
                </dd>
              </ng-container>
            </dl>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline-secondary" type="button" (click)="closeViewRole()">
              <i class="bi bi-x-lg me-1"></i>Close
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── Permission view modal ─── -->
    <div *ngIf="viewingPerm !== null" class="modal-backdrop fade show"></div>
    <div *ngIf="viewingPerm !== null" class="modal fade show d-block" tabindex="-1" role="dialog">
      <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold"><i class="bi bi-eye me-2"></i>Permission Details</h5>
            <button type="button" class="btn-close" (click)="closeViewPerm()"></button>
          </div>
          <div class="modal-body">
            <dl class="row mb-0">
              <dt class="col-sm-4 text-muted small">Key</dt>
              <dd class="col-sm-8"><code class="small">{{ viewingPerm.key }}</code></dd>
              <dt class="col-sm-4 text-muted small">Display Name</dt>
              <dd class="col-sm-8 fw-semibold">{{ viewingPerm.displayName }}</dd>
              <dt class="col-sm-4 text-muted small">Module</dt>
              <dd class="col-sm-8"><span class="badge bg-light text-dark border">{{ viewingPerm.module }}</span></dd>
              <dt class="col-sm-4 text-muted small">Description</dt>
              <dd class="col-sm-8">{{ viewingPerm.description || '—' }}</dd>
              <dt class="col-sm-4 text-muted small">Type</dt>
              <dd class="col-sm-8">
                <span *ngIf="viewingPerm.isSystem" class="badge bg-info text-dark">System</span>
                <span *ngIf="!viewingPerm.isSystem" class="badge bg-warning text-dark">Custom</span>
              </dd>
              <dt class="col-sm-4 text-muted small">Status</dt>
              <dd class="col-sm-8">
                <span class="badge" [class.bg-success]="viewingPerm.isActive" [class.bg-secondary]="!viewingPerm.isActive">
                  {{ viewingPerm.isActive ? 'Active' : 'Inactive' }}
                </span>
              </dd>
            </dl>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline-secondary" type="button" (click)="closeViewPerm()">
              <i class="bi bi-x-lg me-1"></i>Close
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ════════════════════ ROLES TAB ════════════════════ -->
    <ng-container *ngIf="activeTab === 'roles'">

      <!-- ─── Filters ─── -->
      <div class="table-card mb-3">
        <div class="row g-2 align-items-end">
          <div class="col-md-3">
            <label class="form-label small text-muted mb-1">Search user</label>
            <div class="input-group input-group-sm">
              <span class="input-group-text"><i class="bi bi-search"></i></span>
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
                    <span class="badge bg-secondary">None</span>
                  </ng-template>
                </td>
                <td>
                  <span class="badge" [class.bg-success]="row.role.isActive" [class.bg-secondary]="!row.role.isActive">
                    {{ row.role.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="text-end">
                  <div class="d-flex gap-1 justify-content-end">
                    <button class="btn btn-sm btn-outline-primary" (click)="openViewRole(row.role, row.member)" title="View details">
                      <i class="bi bi-eye me-1"></i>View
                    </button>
                    <button class="btn btn-sm btn-outline-secondary"
                            (click)="row.member ? openUserPerms(row.member) : openPerms(row.role)"
                            title="Manage permissions">
                      <i class="bi bi-key me-1"></i>Permissions
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" (click)="startEdit(row.role)">Edit</button>
                    <button *ngIf="row.role.isActive" class="btn btn-sm btn-outline-danger"
                            (click)="toggleActive(row.role)" [disabled]="togglingId === row.role.id">
                      <span *ngIf="togglingId === row.role.id" class="spinner-border spinner-border-sm me-1"></span>
                      <i *ngIf="togglingId !== row.role.id" class="bi bi-eye-slash me-1"></i>Deactivate
                    </button>
                    <button *ngIf="!row.role.isActive" class="btn btn-sm btn-outline-success"
                            (click)="toggleActive(row.role)" [disabled]="togglingId === row.role.id">
                      <span *ngIf="togglingId === row.role.id" class="spinner-border spinner-border-sm me-1"></span>
                      <i *ngIf="togglingId !== row.role.id" class="bi bi-check2-circle me-1"></i>Activate
                    </button>
                    <button *ngIf="auth.hasPermission('roles.delete')" class="btn btn-sm btn-danger" (click)="permanentDelete(row.role)" [disabled]="permanentDeletingId === row.role.id" title="Permanently delete this role">
                      <span *ngIf="permanentDeletingId === row.role.id" class="spinner-border spinner-border-sm me-1"></span>
                      <i *ngIf="permanentDeletingId !== row.role.id" class="bi bi-trash me-1"></i>Delete
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

    </ng-container>
    <!-- ════════════════════ END ROLES TAB ════════════════════ -->

    <!-- ════════════════════ PERMISSION CATALOG TAB ════════════════════ -->
    <ng-container *ngIf="activeTab === 'permissions'">

      <!-- ─── Permission catalog filter ─── -->
      <div class="table-card mb-3">
        <div class="row g-2 align-items-end">
          <div class="col-md-4">
            <label class="form-label small text-muted mb-1">Search permissions</label>
            <div class="input-group input-group-sm">
              <span class="input-group-text"><i class="bi bi-search"></i></span>
              <input type="text" class="form-control" placeholder="Filter by key or module…"
                     [(ngModel)]="filterPermText" (ngModelChange)="permPage = 1" />
            </div>
          </div>
          <div class="col-md-2">
            <label class="form-label small text-muted mb-1">Type</label>
            <select class="form-select form-select-sm" [(ngModel)]="filterPermType" (ngModelChange)="permPage = 1">
              <option value="all">All</option>
              <option value="system">System</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div class="col-md-1">
            <button class="btn btn-outline-secondary btn-sm w-100" type="button"
                    (click)="filterPermText = ''; filterPermType = 'all'; permPage = 1" title="Clear filters">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- ─── Permission catalog table ─── -->
      <div class="table-card">
        <div class="table-responsive">
          <table class="table align-middle">
            <thead>
              <tr>
                <th>Key</th>
                <th>Display Name</th>
                <th>Module</th>
                <th>Description</th>
                <th>Type</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of pagedFilteredPerms()">
                <td><code class="small">{{ p.key }}</code></td>
                <td class="fw-medium small">{{ p.displayName }}</td>
                <td><span class="badge bg-light text-dark border">{{ p.module }}</span></td>
                <td class="text-muted small">{{ p.description || '—' }}</td>
                <td>
                  <span *ngIf="p.isSystem" class="badge bg-info text-dark">System</span>
                  <span *ngIf="!p.isSystem" class="badge bg-warning text-dark">Custom</span>
                </td>
                <td>
                  <span class="badge" [class.bg-success]="p.isActive" [class.bg-secondary]="!p.isActive">
                    {{ p.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="text-end">
                  <div class="d-flex gap-1 justify-content-end" *ngIf="auth.isSuperAdmin()">
                    <button class="btn btn-sm btn-outline-primary" (click)="openViewPerm(p)" title="View details">
                      <i class="bi bi-eye me-1"></i>View
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" (click)="startEditPerm(p)" title="Edit">Edit</button>
                    <button *ngIf="p.isActive" class="btn btn-sm btn-outline-danger"
                            (click)="togglePermActive(p)" [disabled]="togglingPermId === p.id">
                      <span *ngIf="togglingPermId === p.id" class="spinner-border spinner-border-sm me-1"></span>
                      <i *ngIf="togglingPermId !== p.id" class="bi bi-eye-slash me-1"></i>Deactivate
                    </button>
                    <button *ngIf="!p.isActive" class="btn btn-sm btn-outline-success"
                            (click)="togglePermActive(p)" [disabled]="togglingPermId === p.id">
                      <span *ngIf="togglingPermId === p.id" class="spinner-border spinner-border-sm me-1"></span>
                      <i *ngIf="togglingPermId !== p.id" class="bi bi-check2-circle me-1"></i>Activate
                    </button>
                    <button class="btn btn-sm btn-danger" (click)="confirmDeletePerm(p)"
                            [disabled]="deletingPermId === p.id" title="Permanently delete this permission">
                      <span *ngIf="deletingPermId === p.id" class="spinner-border spinner-border-sm me-1"></span>
                      <i *ngIf="deletingPermId !== p.id" class="bi bi-trash me-1"></i>Delete
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredPerms().length === 0">
                <td colspan="7" class="text-center text-muted py-3">
                  {{ customPerms.length === 0 ? 'Loading permissions…' : 'No permissions match the filters.' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div *ngIf="filteredPerms().length > permPageSize" class="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-3">
          <small class="text-muted">Showing {{ permPageStart() }}–{{ permPageEnd() }} of {{ filteredPerms().length }}</small>
          <nav>
            <ul class="pagination pagination-sm mb-0">
              <li class="page-item" [class.disabled]="permPage === 1">
                <button class="page-link" type="button" (click)="setPermPage(permPage - 1)" [disabled]="permPage === 1" aria-label="Previous">
                  <i class="bi bi-chevron-left"></i>
                </button>
              </li>
              <ng-container *ngFor="let p of permPageNumbers()">
                <li *ngIf="p !== -1" class="page-item" [class.active]="p === permPage">
                  <button class="page-link" type="button" (click)="setPermPage(p)">{{ p }}</button>
                </li>
                <li *ngIf="p === -1" class="page-item disabled">
                  <span class="page-link">…</span>
                </li>
              </ng-container>
              <li class="page-item" [class.disabled]="permPage === permTotalPages()">
                <button class="page-link" type="button" (click)="setPermPage(permPage + 1)" [disabled]="permPage === permTotalPages()" aria-label="Next">
                  <i class="bi bi-chevron-right"></i>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

    </ng-container>
    <!-- ════════════════════ END PERMISSION CATALOG TAB ════════════════════ -->
  `
})
export class AdminRolesComponent implements OnInit, OnDestroy {
  private api   = inject(ApiService);
  private fb    = inject(FormBuilder);
  private toast = inject(ToastService);
  private confirmModal = inject(ConfirmModalService);
  auth          = inject(AuthService);

  items: AppRole[] = [];

  // ── Tab state ──
  activeTab: 'roles' | 'permissions' = 'roles';

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

  // ── Custom permission catalog state ──
  customPerms: CustomPermission[] = [];
  filterPermText = '';
  filterPermType: 'all' | 'system' | 'custom' = 'all';
  editingPerm: CustomPermission | undefined = undefined;
  permFormMode: 'create' | 'edit' = 'create';
  permFormError = '';
  savingPerm = false;
  deletingPermId: number | null = null;
  permPage = 1;
  readonly permPageSize = 10;

  viewingRole: AppRole | null = null;
  viewingMember: AppRoleMember | null = null;
  viewingPerm: CustomPermission | null = null;

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
  selectedPerms  = new Set<string>();
  expandedModules = new Set<string>();
  togglingId: number | null = null;
  permanentDeletingId: number | null = null;
  togglingPermId: number | null = null;

  @ViewChild('permModalBody') permModalBodyRef?: ElementRef<HTMLElement>;

  form = this.fb.group({
    name:        ['', Validators.required],
    description: [''],
    isActive:    [true]
  });

  permForm = this.fb.group({
    key:         ['', [Validators.required, Validators.pattern(/^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/)]],
    displayName: ['', Validators.required],
    module:      ['', Validators.required],
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
    this.api.listCustomPermissions().subscribe({
      next: list => this.customPerms = list || []
    });
  }

  ngOnDestroy(): void { this.unlockBody(); }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.editingPerm !== undefined) { this.cancelPermEdit(); return; }
    if (this.permRoleId !== null || this.permStaffId !== null) { this.cancelPerms(); return; }
    if (this.editingId  !== null) { this.cancelEdit(); return; }
    if (this.viewingRole !== null) { this.closeViewRole(); return; }
    if (this.viewingPerm !== null) { this.closeViewPerm(); return; }
  }

  // ── Permission catalog loading ─────────────────────────────────────────────

  loadPerms(): void {
    this.api.listCustomPermissions().subscribe({
      next: list => this.customPerms = list || []
    });
    // Refresh the permissions catalog too (custom permissions may now appear)
    this.api.listPermissionCatalog().subscribe({
      next: list => {
        this.permsCatalog = list || [];
        this.permsGrouped = this.buildGroups(this.permsCatalog);
      }
    });
  }

  filteredPerms(): CustomPermission[] {
    const q = this.filterPermText.trim().toLowerCase();
    return this.customPerms.filter(p => {
      if (q && !p.key.toLowerCase().includes(q) && !p.module.toLowerCase().includes(q) && !p.displayName.toLowerCase().includes(q)) return false;
      if (this.filterPermType === 'system' && !p.isSystem) return false;
      if (this.filterPermType === 'custom' && p.isSystem) return false;
      return true;
    });
  }

  pagedFilteredPerms(): CustomPermission[] {
    const start = (this.permPage - 1) * this.permPageSize;
    return this.filteredPerms().slice(start, start + this.permPageSize);
  }

  permTotalPages(): number {
    return Math.max(1, Math.ceil(this.filteredPerms().length / this.permPageSize));
  }

  permPageStart(): number {
    const len = this.filteredPerms().length;
    if (len === 0) return 0;
    return (this.permPage - 1) * this.permPageSize + 1;
  }

  permPageEnd(): number {
    return Math.min(this.permPage * this.permPageSize, this.filteredPerms().length);
  }

  permPageNumbers(): number[] {
    const total = this.permTotalPages();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const cur = this.permPage;
    const pages: number[] = [1];
    const start = Math.max(2, cur - 2);
    const end   = Math.min(total - 1, cur + 2);
    if (start > 2) pages.push(-1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < total - 1) pages.push(-1);
    pages.push(total);
    return pages;
  }

  setPermPage(p: number): void {
    if (p < 1 || p > this.permTotalPages()) return;
    this.permPage = p;
    scrollAdminContentTop();
  }

  // ── Custom permission CRUD ─────────────────────────────────────────────────

  startCreatePerm(): void {
    this.permFormMode  = 'create';
    this.permFormError = '';
    this.savingPerm    = false;
    this.permForm.reset({ key: '', displayName: '', module: '', description: '', isActive: true });
    this.permForm.get('key')?.enable();
    this.editingPerm = {} as CustomPermission;
    this.lockBody();
  }

  startEditPerm(p: CustomPermission): void {
    this.permFormMode  = 'edit';
    this.permFormError = '';
    this.savingPerm    = false;
    this.permForm.reset({
      key: p.key,
      displayName: p.displayName,
      module: p.module,
      description: p.description || '',
      isActive: p.isActive
    });
    this.permForm.get('key')?.disable();
    this.editingPerm = p;
    this.lockBody();
  }

  cancelPermEdit(): void {
    this.editingPerm   = undefined;
    this.permFormError = '';
    this.unlockBody();
  }

  savePerm(): void {
    if (this.permForm.invalid) { this.permForm.markAllAsTouched(); return; }
    this.savingPerm    = true;
    this.permFormError = '';
    const v = this.permForm.getRawValue() as any;

    if (this.permFormMode === 'create') {
      this.api.createCustomPermission({
        key: v.key,
        displayName: v.displayName,
        module: v.module,
        description: v.description || undefined
      }).subscribe({
        next: () => {
          this.toast.show(`Permission "${v.key}" created.`, 'success', 4000, { title: 'Permission created' });
          this.savingPerm  = false;
          this.editingPerm = undefined;
          this.unlockBody();
          this.loadPerms();
          this.load();
        },
        error: (err: any) => {
          this.savingPerm    = false;
          this.permFormError = err?.error?.message || 'Could not create permission. Please try again.';
        }
      });
    } else {
      const id = this.editingPerm!.id;
      this.api.updateCustomPermission(id, {
        displayName: v.displayName,
        module: v.module,
        description: v.description || undefined,
        isActive: v.isActive
      }).subscribe({
        next: () => {
          this.toast.show(`Permission updated.`, 'success', 4000, { title: 'Permission updated' });
          this.savingPerm  = false;
          this.editingPerm = undefined;
          this.unlockBody();
          this.loadPerms();
          this.load();
        },
        error: (err: any) => {
          this.savingPerm    = false;
          this.permFormError = err?.error?.message || 'Could not update permission. Please try again.';
        }
      });
    }
  }

  async confirmDeletePerm(p: CustomPermission): Promise<void> {
    const ok = await this.confirmModal.confirm({
      title: 'Delete Permission',
      message: `Delete permission "${p.key}"?`,
      detail: 'This will remove the permission from all roles and users it was assigned to.',
    });
    if (!ok) return;
    this.deletingPermId = p.id;
    this.api.deleteCustomPermission(p.id).subscribe({
      next: () => {
        this.toast.show(`Permission "${p.key}" deleted.`, 'success', 3000, { title: 'Permission deleted' });
        this.deletingPermId = null;
        this.loadPerms();
        this.load();
      },
      error: (err: any) => {
        this.deletingPermId = null;
        this.toast.show(err?.error?.message || 'Could not delete permission.', 'danger', 4000, { title: 'Delete failed' });
      }
    });
  }

  openViewRole(r: AppRole, member: AppRoleMember | null = null): void {
    this.viewingRole = r;
    this.viewingMember = member;
    this.lockBody();
  }
  closeViewRole(): void { this.viewingRole = null; this.viewingMember = null; this.unlockBody(); }

  openViewPerm(p: CustomPermission): void { this.viewingPerm = p; this.lockBody(); }
  closeViewPerm(): void { this.viewingPerm = null; this.unlockBody(); }

  togglePermActive(p: CustomPermission): void {
    if (this.togglingPermId !== null) return;
    this.togglingPermId = p.id;
    this.api.updateCustomPermission(p.id, {
      displayName: p.displayName,
      module: p.module,
      description: p.description,
      isActive: !p.isActive
    }).subscribe({
      next: () => {
        this.togglingPermId = null;
        this.toast.show(
          `Permission "${p.key}" ${p.isActive ? 'deactivated' : 'activated'}.`,
          'success', 3000,
          { title: 'Permission updated' }
        );
        this.loadPerms();
      },
      error: () => {
        this.togglingPermId = null;
        this.toast.show(`Could not update "${p.key}".`, 'danger', 4000, { title: 'Update failed' });
      }
    });
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
    this.permRoleId     = r.id;
    this.permStaffId    = null;
    this.permRoleName   = r.name;
    this.permTargetName = r.name;
    this.permError      = '';
    this.savingPerms    = false;
    this.selectedPerms  = new Set(r.permissions);
    this.expandedModules.clear();
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
    this.expandedModules.clear();
    this.lockBody();
  }

  cancelPerms(): void {
    this.permRoleId     = null;
    this.permStaffId    = null;
    this.permTargetName = '';
    this.permError      = '';
    this.selectedPerms.clear();
    this.expandedModules.clear();
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
    const dot    = key.indexOf('.');
    const module = key.substring(0, dot);
    const action = key.substring(dot + 1);
    const viewKey = `${module}.view`;

    if (this.selectedPerms.has(key)) {
      this.selectedPerms.delete(key);
      // Unchecking view revokes all permissions for this module
      if (action === 'view') {
        for (const k of this.permsCatalog) {
          if (k.startsWith(module + '.')) this.selectedPerms.delete(k);
        }
      }
    } else {
      this.selectedPerms.add(key);
      // Checking any non-view permission auto-grants view (page access prerequisite)
      if (action !== 'view' && this.permsCatalog.includes(viewKey)) {
        this.selectedPerms.add(viewKey);
      }
    }
  }

  isViewKey(key: string): boolean { return key.endsWith('.view'); }

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

  toggleModule(module: string): void {
    if (this.expandedModules.has(module)) this.expandedModules.delete(module);
    else this.expandedModules.add(module);
  }

  areAllExpanded(): boolean {
    return this.permsGrouped.length > 0 && this.permsGrouped.every(g => this.expandedModules.has(g.module));
  }

  toggleAllModules(): void {
    if (this.areAllExpanded()) this.expandedModules.clear();
    else this.permsGrouped.forEach(g => this.expandedModules.add(g.module));
  }

  groupSelectedCount(group: { module: string; keys: string[] }): number {
    return group.keys.filter(k => this.selectedPerms.has(k)).length;
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

  rolePermsByModule(role: AppRole): { module: string; perms: string[] }[] {
    return this.groupPermsByModule(role.permissions);
  }

  groupPermsByModule(keys: string[]): { module: string; perms: string[] }[] {
    const groups = new Map<string, string[]>();
    for (const key of keys) {
      const [mod] = key.split('.');
      const arr = groups.get(mod) ?? [];
      arr.push(key);
      groups.set(mod, arr);
    }
    return Array.from(groups.entries()).map(([module, perms]) => ({ module, perms }));
  }

  private buildGroups(catalog: string[]): { module: string; keys: string[] }[] {
    const groups = new Map<string, string[]>();
    for (const key of catalog) {
      const [mod] = key.split('.');
      const arr = groups.get(mod) ?? [];
      arr.push(key);
      groups.set(mod, arr);
    }
    return Array.from(groups.entries()).map(([module, keys]) => ({
      module,
      keys: [...keys].sort((a, b) => {
        if (a.endsWith('.view') && !b.endsWith('.view')) return -1;
        if (!a.endsWith('.view') &&  b.endsWith('.view')) return 1;
        return a.localeCompare(b);
      })
    }));
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

  async permanentDelete(r: AppRole): Promise<void> {
    const ok = await this.confirmModal.confirm({
      title: 'Permanently delete role?',
      message: `Delete role "${r.name}" permanently?`,
      detail: 'This will permanently remove the role and revoke it from all assigned users. This action cannot be undone.',
    });
    if (!ok) return;
    this.permanentDeletingId = r.id;
    this.api.deleteRole(r.id).subscribe({
      next: () => {
        this.permanentDeletingId = null;
        this.toast.show(`Role "${r.name}" permanently deleted.`, 'success', 4000, { title: 'Role deleted' });
        this.load();
      },
      error: (err: any) => {
        this.permanentDeletingId = null;
        this.toast.show(err?.error?.message || `Could not delete role "${r.name}". Please try again.`, 'danger', 4000, { title: 'Delete failed' });
      }
    });
  }

  trackByModule(_: number, item: { module: string }): string { return item.module; }
  trackByKey(_: number, key: string): string { return key; }

  private lockBody():   void { document.body.classList.add('modal-open'); }
  private unlockBody(): void { document.body.classList.remove('modal-open'); }
}
