import { Component } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { Server } from '../model/server';
import { ServersService } from '../service/servers.service';

@Component({
  selector: 'server-list',
  templateUrl: './serverlist.component.html',
  styleUrls: ['./serverlist.component.scss']
})
export class ServerListComponent {

    servers: Server[];
    currentServer: Server;

    constructor(private serversServices:ServersService, private spinner:NgxSpinnerService) {
        this.reload();
    }

    private showSpinner() {
        this.spinner.show();
    }

    private hideSpinner() {
        console.log("hide");
        this.spinner.hide();
    }

    

    public reload() {
        this.currentServer = null;
        this.showSpinner();
        this.serversServices.getServers().subscribe(servers => { this.servers = servers; this.hideSpinner() }, error => { this.hideSpinner(); alert(error.message)} );
    }

    public startServer(server:Server) {
        this.showSpinner();
        this.serversServices.startServer(server).subscribe(response => this.reload(), error => { this.hideSpinner(); alert(error.message)});
    }

    public stopServer(server:Server) {
        this.showSpinner();
        this.serversServices.stopServer(server).subscribe(response => this.reload(), error => { this.hideSpinner(); alert(error.message)});
    }

    public addServer() {
        this.currentServer = new Server();
    }

    public saveServer() {
        this.serversServices.createServer(this.currentServer).subscribe(response => this.reload(), error => { this.hideSpinner(); alert(error.message)});
    }


    
}
 