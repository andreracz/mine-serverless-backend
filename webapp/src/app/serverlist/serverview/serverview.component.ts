import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Server } from '../../model/server';


@Component({
  selector: 'server-view',
  templateUrl: './serverview.component.html',
  styleUrls: ['./serverview.component.scss']
})
export class ServerViewComponent {

    constructor() {
    }

    @Input()
    server: Server;

    @Output()
    startClicked = new EventEmitter<Server>();

    @Output()
    stopClicked = new EventEmitter<Server>();

    public stopEvent() {
        this.stopClicked.emit(this.server);
    }


    public startEvent() {
        this.startClicked.emit(this.server);
    }

}
 