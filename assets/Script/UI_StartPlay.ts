import { _decorator, Component, director, Node } from 'cc';
import { GameManager } from './GameManager';
const { ccclass, property } = _decorator;

@ccclass('UI_StartPlay')
export class UI_StartPlay extends Component {
    @property({type: GameManager})
    gm: GameManager | null = null;
    start() {

    }

    update(deltaTime: number) {
        
    }

    onBtnStart(){
        if(this.gm){
            this.gm.stToGS_PLAYING();
        }
        
    }
}


