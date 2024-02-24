import { _decorator, Component, Node, resources } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CubeLoad')
export class CubeLoad extends Component {
    start() {
        resources.load("Texture/TCom_Pavement_TerracottaAntique_512_albedo")
    }

    update(deltaTime: number) {
        
    }
}


