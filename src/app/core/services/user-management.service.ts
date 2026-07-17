import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environments';

import { User, UserRole } from '../../models/user';

import { Auth } from './auth';



@Injectable({
  providedIn: 'root'
})
export class UserManagementService {


  private readonly http = inject(HttpClient);

  private readonly auth = inject(Auth);


  private readonly baseUrl =
    environment.apiUrl;




  /**
   * Récupérer tous les utilisateurs
   * 
   * GET /users/
   */
  getUsers(): Observable<User[]> {


    return this.http.get<User[]>(
      `${this.baseUrl}/auth/users/`,
      {
        headers:this.auth.authHeaders()
      }

    ).pipe(

      catchError(this.handleError)

    );

  }







  /**
   * Récupérer les utilisateurs par rôle
   *
   * Exemple:
   *
   * /auth/users/role/user
   *
   * /auth/users/role/rescuer
   *
   */
  getUsersByRole(
    role:UserRole
  ):Observable<User[]>{


    return this.http.get<User[]>(

      `${this.baseUrl}/auth/users/role/${role}`,

      {

        headers:this.auth.authHeaders()

      }

    ).pipe(

      catchError(this.handleError)

    );


  }









  /**
   * Récupérer uniquement les secouristes actifs
   *
   * Utilisé pour assigner une alerte
   */
  getActiveRescuers():Observable<User[]>{


    return this.http.get<User[]>(

      `${this.baseUrl}/auth/users/role/rescuer`,

      {

        headers:this.auth.authHeaders()

      }

    ).pipe(


      catchError(this.handleError)


    );


  }









  /**
   * Activer / désactiver un compte utilisateur
   *
   * PUT
   *
   * /auth/users/{user_id}/activation
   *
   */
  updateUserStatus(

    userId:string,

    isActive:boolean

  ):Observable<User>{



    return this.http.put<User>(
      `${this.baseUrl}/auth/users/${userId}/activation`,
      { is_active: isActive },
      { headers:this.auth.authHeaders() }


    ).pipe(

      catchError(this.handleError)

    );


  }
  updateRescuerStatus(

    userId:string,

  ):Observable<User>{



    return this.http.put<User>(
      `${this.baseUrl}/auth/users/${userId}/rescuer-status`,
      { headers:this.auth.authHeaders() }


    ).pipe(

      catchError(this.handleError)

    );


  }

  verifyEmail(userId: string): Observable<User> {
    return this.http.put<User>(
      `${this.baseUrl}/auth/users/${userId}/verify-email`,
      {},
      { headers: this.auth.authHeaders() },
    ).pipe(catchError(this.handleError));
  }









  /**
   * Activer un utilisateur
   */
  activateUser(
    userId:string
  ):Observable<User>{


    return this.updateUserStatus(
      userId,
      true
    );


  }







  /**
   * Désactiver un utilisateur
   */
  deactivateUser(
    userId:string
  ):Observable<User>{


    return this.updateUserStatus(
      userId,
      false
    );


  }









  /**
   * Recherche locale préparée
   * pour le dashboard admin
   */
  searchUsers(
    users:User[],
    query:string
  ):User[]{


    const value =
      query
      .toLowerCase()
      .trim();



    if(!value){

      return users;

    }




    return users.filter(user=>


      (

        user.username ??

        ''

      )

      .toLowerCase()

      .includes(value)



      ||

      (

        user.email ??

        ''

      )

      .toLowerCase()

      .includes(value)



      ||

      (

        user.role ??

        ''

      )

      .toLowerCase()

      .includes(value)



    );


  }









  private handleError(error:any){


    console.error(
      '❌ UserManagementService error:',
      error
    );


    return throwError(()=>error);


  }



}
