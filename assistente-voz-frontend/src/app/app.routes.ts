import { Routes } from '@angular/router';
import { AlbaListener } from './pages/alba-listener/alba-listener';

export const routes: Routes = [
  {
    path: '',
    component: AlbaListener
  },
  {
    path: '**',
    redirectTo: ''
  }
];