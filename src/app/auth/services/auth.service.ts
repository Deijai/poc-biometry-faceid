import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { User } from 'src/app/shared/interfaces/user.interface';
import  { environment }  from 'src/environments/environment';
import { Storage } from '@ionic/storage';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private baseUrl: string = environment.baseUrl;
  private user?: User;

  constructor(private http: HttpClient, private router: Router, private storage: Storage) {}

  public get currentUser(): User | undefined {
    if (!this.user) return undefined;
    return structuredClone(this.user);
  }

  public login(email: string, password: string): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/auth/signin`, { email, password  });
  }

  public logout(): void {
    this.user = undefined;
    localStorage.removeItem('token');
    this.router.navigate(['/auth/login']);
  }

  public checkAuthentication(): Observable<boolean> {
    if (!localStorage.getItem('token')) return of(false);

    return this.http.get<User>(`${this.baseUrl}/users/1`).pipe(
      tap((user) => (this.user = user)),
      map((user) => !!user),
      catchError(() => of(false))
    );
  }

  public checkUserInSorage(): Promise<boolean> {
   return new Promise((resolve, err) => {
    this.storage.get('auth').then(res => {
      if(res) {
        resolve(true);
      } else {
        resolve(false);
      }
    }).catch(err => {
      resolve(false);
    });

   });

  }
}
