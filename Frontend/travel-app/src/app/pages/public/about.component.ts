import { Component } from '@angular/core';

@Component({
  selector: 'app-about',
  standalone: false,
  template: `
    <div class="container py-5">
      <h1 class="fw-bold mb-3">About TravelHub</h1>
      <p class="lead text-muted">
        TravelHub is a tour operator specialising in multi-day curated experiences across the Indian subcontinent.
      </p>
      <div class="row g-4 mt-3">
        <div class="col-md-4">
          <h5 class="fw-bold">Our mission</h5>
          <p class="text-muted">Connect travellers with the wonders of India, Bhutan and Nepal through hand-crafted itineraries.</p>
        </div>
        <div class="col-md-4">
          <h5 class="fw-bold">What we offer</h5>
          <p class="text-muted">Vehicles, accommodation, meals and licensed guides — all bundled into transparent packages.</p>
        </div>
        <div class="col-md-4">
          <h5 class="fw-bold">Need help?</h5>
          <p class="text-muted">Email <a href="mailto:support&#64;travelhub.local">support&#64;travelhub.local</a> or call +91 90000 00000.</p>
        </div>
      </div>
    </div>
  `
})
export class AboutComponent {}
