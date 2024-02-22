import { _decorator, assetManager, Component, ImageAsset, Label, Node,Sprite, SpriteFrame, Texture2D } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ItemTemplate')
export class ItemTemplate extends Component {
    @property
    public openId:number = 0;
    @property(Sprite)
    public avatar: Sprite | null = null;
    @property(Label)
    public nickname: Label | null = null;
    @property(Label)
    public record: Label | null = null;
    init(data){
        // 为当前项注入属性
        this.openId = data.openId;
        this.nickname.string = data.nickname;
        this.record.string = (data.record/1000).toFixed(2) + 's';
        console.log(data.avatarUrl);
        console.log(this.avatar);
        assetManager.loadRemote<ImageAsset>(data.avatarUrl, { ext: '.png' }, (err, imageAsset)=> {
            if (err != null) {
                console.log("网络图片加载错误");
                console.log(err);
            } else {
                const spriteFrame = new SpriteFrame();
                const texture = new Texture2D();
                texture.image = imageAsset;
                spriteFrame.texture = texture;
                this.avatar.spriteFrame = spriteFrame;
            }
        });
    }
}


