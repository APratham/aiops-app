import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})

export class ContainerService {

  private apiUrl = '/api'; // The Express server will proxy this to FastAPI

  constructor(private http: HttpClient) {}

  // Fetch Docker containers list
  getDockerContainers(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/docker-containers/list`);
  }

  // Fetch detailed Docker container info by name
  getDockerContainerInfo(containerName: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/docker-containers/name/${containerName}`);
  }

  // Method to get logs by container ID
  getContainerLogsById(containerId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/docker-containers/id/${containerId}/logs`).pipe(
      catchError(error => {
        console.error('Error fetching logs:', error);
        return throwError(() => new Error('Error fetching logs'));
      })
    );
  }

  getContainerLogsByName(containerName: string): Observable<any> {
    return this.http.get(`/docker-containers/name/${containerName}/logs`);
  }

  // Fetch detailed information for all containers
  getAllDockerContainerDetails(): Observable<any[]> {
    return this.getDockerContainers().pipe(
      switchMap(containerNames => {
        const requests = containerNames.map(name => this.getDockerContainerInfo(name));
        return forkJoin(requests);
      })
    );
  }
}