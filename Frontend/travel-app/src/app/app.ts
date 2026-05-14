import { Component, OnInit, inject, signal } from '@angular/core';
import { BrandService } from './core/services/brand.service';
import { ThemeService } from './core/services/theme.service';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private brand = inject(BrandService);
  private theme = inject(ThemeService);
  private auth = inject(AuthService);

  protected readonly title = signal('travel-app');

  ngOnInit(): void {
    this.brand.load().subscribe({ error: () => {} });
    void this.theme;

    if (this.auth.isAuthenticated()) {
      this.auth.me().subscribe({
        next: r => { if (r.success && r.data) this.auth.updateCachedUser(r.data); },
        error: () => {}
      });
    }
  }
}
