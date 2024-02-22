import { _decorator, Component, instantiate, Node, Prefab, Size, size, SpriteFrame, UITransform } from 'cc';
const { ccclass, property } = _decorator;


const myUrl = "http://localhost:8080";

@ccclass('RandingManager')
export class RandingManager extends Component {
    @property(Prefab)
    itemPrefab: Prefab | null = null;

    requestRank(){
        wx.request({
            url: myUrl+'/top',
            method: "GET",
            
            success:(res) => {
                if(res.data && this.itemPrefab){
                    // 创建一个临时预制体，获取一个项的高度，然后销毁临时预制体，释放资源
                    let tempPrefab = instantiate(this.itemPrefab);
                    let itemLength = tempPrefab.getComponent(UITransform).height;
                    tempPrefab.destroy();
                    let contentLength: number = res.data.length * itemLength;
                    this.node.getComponent(UITransform).setContentSize(new Size(1000, contentLength));
                    
                    res.data.sort((a, b) => a.record - b.record);
                    for(let i = 0; i < res.data.length; i++){
                        const item = instantiate(this.itemPrefab);
                        this.node.addChild(item);
                        item.getComponent("ItemTemplate").init(res.data[i]);
                    }
                }
            }
        })
    }
    start() {
        this.requestRank();
    }

    update(deltaTime: number) {
        
    }
}


