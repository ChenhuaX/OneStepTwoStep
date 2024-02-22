import { _decorator, Component, director, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('UI_Button')
export class UI_Button extends Component {
    onclick(){
        director.loadScene("scene");
    }
    start() {

    }

    update(deltaTime: number) {
        
    }
}


