import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Server } from '../model/server';
import {concatMap} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ServersService {

    private url = 'https://mine-serverless.azurewebsites.net/api/servers/';

    constructor(private http: HttpClient) {

    }

    public getServers(): Observable<Server[]> {
        return this.http.get<Server[]>(this.url);
    }

    public startServer(server:Server):Observable<string> {
        return this.http.post<string>(this.url + server.serverName + "/start", {});
    }

    public createServer(server:Server):Observable<string> {
        console.log(server);
        return this.http.post<string>(this.url, server);
    }

    public stopServer(server:Server):Observable<string> {
        return this.http.post<string>(this.url + server.serverName + "/stop", {});
    }


}