import { _decorator, Component, instantiate, Node, Prefab, random,EventTarget, RigidBody, SphereCollider, Vec3, director, find, Sprite, loader, assetManager, ImageAsset, SpriteFrame, Texture2D, Label, AudioClip, math } from 'cc';
import { PlayerController } from './PlayerController';
import {AudioMgr} from './AudioMgr';
const { ccclass, property } = _decorator;
enum BlockType{
    BT_NONE,
    BT_STONE,
    BT_GOAL
};
enum GameState{
    GS_INIT,
    GS_PLAYING,
    GS_WIN,
    GS_LOSE
}
const myUrl = "http://localhost:8080";
@ccclass('GameManager')
export class GameManager extends Component {
     
    // 赛道预制体
    @property({type: Prefab})
    public cubePrefab: Prefab | null = null;

    // 赛道预制体
    @property({type: Prefab})
    public firePrefab: Prefab | null = null;

    // 赛道预制体
    @property({type: Prefab})
    public goalPrefab: Prefab | null = null;

    //开始菜单
    @property({type: Node})
    public startMenu: Node | null = null;

    // 玩家跳跃行为按钮
    @property({type:Node})
    public active: Node | null = null;

    // player结点绑定的ctrl组件
    @property({type: PlayerController})
    public playerCtrl: PlayerController | null = null;

    // player结点刚体
    @property({type: RigidBody})
    public playerRigidBody: RigidBody | null = null;

    // 声音
    @property({type: AudioClip})
    public crash: AudioClip | null = null;
    @property({type: AudioClip})
    public win: AudioClip | null = null;
    @property({type: AudioClip})
    public lose: AudioClip | null = null;
    @property({type: AudioClip})
    public bgm: AudioClip | null = null;

    // 赛道长度
    @property
    public roadLength = 50;
    private _road: BlockType[] = [];

    //记录玩家成绩
    @property({type:Label})
    public playTime: Label | null = null;

    // 游戏当前状态
    private _curState: GameState | null = null;
    
    // 玩家openId
    private _openId: string | null = null;

    // 玩家信息
    private userInfo;

    // 最近一局游戏的开始时间
    private startTime: number | null = null;

    // 玩家的最好成绩
    private _record: number = 0;


    get openId(){
        return this._openId;
    }

    set openId(value: string){
        this._openId = value;
    }
    
    get record(){
        return this._record;
    }

    set record(value: number){
        // 根据record修改值更新ui显示
        if(value === -1 && this.startMenu){
            this.startMenu.getChildByName("Record").getComponent(Label).string = '最好成绩:未挑战';
        }else if(this.startMenu){
            this.startMenu.getChildByName("Record").getComponent(Label).string = '最好成绩:'+(value/1000).toFixed(2)+'s';
        }
        this._record = value;
    }

    start() { 
        //播放背景音乐
        AudioMgr.inst.play(this.bgm);

        let sysInfo = wx.getSystemInfoSync();
        // 通过微信插件获取屏幕大小
        let screenWidth = sysInfo.screenWidth;
        let screenHeight = sysInfo.screenHeight;
        
        //创建用户授权按钮
        const wxLoginBtn = wx.createUserInfoButton({
            type:"text",
            text:"",
            style:{
                left:0,
                top:0,
                width:screenWidth,
                height: screenHeight,
                backgroundColor:'#00000000',
                color:'#ffffff',
            }
        })
        //当授权成功，加载头像等
        wxLoginBtn.onTap((res) => {
            // 隐藏按钮
            wxLoginBtn.hide();

            // 保持用户信息
            this.userInfo = res.userInfo;
            let Avatar = find("Canvas/StartMenu/Avatar").getComponent(Sprite);
            assetManager.loadRemote<ImageAsset>(this.userInfo.avatarUrl, { ext: '.png' }, function (err, imageAsset) {
                if (err != null) {
                    console.log("网络图片加载错误");
                    console.log(err);
                } else {
                    if (Avatar.isValid) {
                        const spriteFrame = new SpriteFrame();
                        const texture = new Texture2D();
                        texture.image = imageAsset;
                        spriteFrame.texture = texture;
                        Avatar.spriteFrame = spriteFrame;
                    }
                }
            });

            wx.login({
                success: (res) => {
                    if (res.code) {
                        //发起网络请求,获取openid
                        this.requestOpenId(res);
                    } else {
                        console.log('登录失败！' + res.errMsg)
                    }
                }
            })
            
            
        });
        
        this.curState = GameState.GS_INIT;
        // 监听游戏胜利或失败
        director.getScene().on('checkFailOrWin', (stepNum)=>{
            //console.log(stepNum)
            console.log(this.playerCtrl.node.position)
            if(this._road[stepNum] === BlockType.BT_GOAL){
                this.curState = GameState.GS_WIN;
            }else if(this._road[stepNum] === BlockType.BT_NONE){
                this.curState = GameState.GS_LOSE;
            }else{
                // 触平地的碰撞声音
                AudioMgr.inst.playOneShot(this.crash);
            }
        }, this)
    }
    //获取openId
    requestOpenId(date){
        wx.request({
            url: myUrl+'/user',
            method: "POST",
            header:{
                'content-type' : 'application/x-www-form-urlencoded'
            },
            data: {
                code: date.code
            },
            success:(res) => {
                this.openId = JSON.parse(res.data)['openid'];
                this.requestRecord(this.openId, -1);
            }
        })
    }

    // 获取玩家最好成绩
    requestRecord(id: String, newRecord: number){
        
        wx.request({
            url: myUrl+'/record',
            method: "POST",
            header:{
              'content-type' : 'application/x-www-form-urlencoded'
            },
            data: {
                openId: id,
                nickname: this.userInfo.nickName,
                province:this.userInfo.province, 
                record: newRecord,
                avatarUrl: this.userInfo.avatarUrl,
                time: new Date().getTime()
            },
            success:(res) => {
                if(res.statusCode == 200){
                    // 更新最好成绩
                    this.record = res.data.record
                }
            }
        })
    }

    
    //初始化游戏状态
    init(){

        if(this.playerCtrl){
            this.active.active = false;
            this.playerCtrl.node.setPosition(new Vec3(0,1,0));
            this.playerCtrl.stepNum = 0;

        }
        if(this.startMenu){
            this.startMenu.active = true;
        }
        
        this.generateRoad();
    }
    
    toRanking(){
        director.loadScene("ranking");
    }
    
    // 切换游戏状态至GS_PLAYING状态
    stToGS_PLAYING(){
        this.curState = GameState.GS_PLAYING;
    }
    get curState(){
        return this._curState;
    }
    set curState(value: GameState) {
        this._curState = value;
        switch(value) {
            case GameState.GS_INIT:
                this.init()
                break;
            case GameState.GS_PLAYING:
                if(this.startMenu){
                    this.startMenu.active = false;
                }
                setTimeout(()=>{
                    if(this.active){
                        this.active.active = true;
                        this.startTime = new Date().getTime();
                    }
                    if(this.playTime){
                        this.playTime.node.active = true;
                    }
                },0.1);
                break;
            case GameState.GS_LOSE:
                console.log("lose")
                // 暂停bgm，并播放失败音效
                AudioMgr.inst.pause();
                AudioMgr.inst.playOneShot(this.lose, 0.5);
                setTimeout(() => {
                    AudioMgr.inst.resume()
                }, 2000);

                if(this.playerCtrl){
                    if(this.playTime){
                        this.playTime.node.active = false;
                    }
                    this.playerRigidBody.applyForce(new math.Vec3(0, -100, 0));
                }
                if(this.active){
                    this.active.active = false;
                }
                
                setTimeout(()=>{

                    if(this.playerRigidBody){
                        this.playerRigidBody.clearVelocity();
                    }
                    this.curState = GameState.GS_INIT;
                }, 1000)
                break;
            case GameState.GS_WIN:
                console.log("win");
                // 暂停bgm，并播放获胜音效
                AudioMgr.inst.pause();
                AudioMgr.inst.playOneShot(this.win);
                setTimeout(() => {
                    AudioMgr.inst.resume()
                }, 4000);

                if(this.playTime){
                    this.playTime.node.active = false;
                }
                if(this.openId){
                    this.requestRecord(this.openId,  new Date().getTime() - this.startTime);
                }
                if(this.active){
                    this.active.active = false;
                }
                
                setTimeout(()=>{
                    this.curState = GameState.GS_INIT;
                }, 1000)
                
                break;
        }
    }

    update(deltaTime: number) {
        if(this.curState === GameState.GS_PLAYING){
            this.playTime.string = ((new Date().getTime() - this.startTime) / 1000).toFixed(2)+"s";
        }
    }
    generateRoad(){
        // 初始化赛道,移除所有子节点
        this.node.removeAllChildren();
        this._road = [];
        this._road.push(BlockType.BT_STONE);
        for(let i = 1; i < this.roadLength; i++){
            if(this._road[i - 1] === BlockType.BT_NONE){
                this._road.push(BlockType.BT_STONE);
            }else{
                this._road.push(Math.floor(Math.random() * 2));
            }
        }
        this._road.push(BlockType.BT_GOAL);
        this._road.push(BlockType.BT_GOAL);
        for(let i = 0; i < this.roadLength + 2; i++){
            let block = this.spawnBlockByType(this._road[i]);
            if(this._road[i] == BlockType.BT_STONE){
                block.setPosition(new Vec3(i,0,0));
            }else if(this._road[i] == BlockType.BT_NONE){
                block.setPosition(new Vec3(i,-0.5,0));
            }else if(this._road[i] == BlockType.BT_GOAL){
                block.setPosition(new Vec3(i,0.5,0));
            }
            
            this.node.addChild(block);
        }
    }

    // 实例化预制体
    spawnBlockByType(type: BlockType){
        if(!this.cubePrefab) return null;
        
        let block: Node | null = null;
        switch(type){
            case BlockType.BT_STONE:
                block = instantiate(this.cubePrefab);
                break;
            case BlockType.BT_NONE:
                block = instantiate(this.firePrefab)
                break;
            case BlockType.BT_GOAL:
                block = instantiate(this.goalPrefab)
                break;
        }
        return block;
    }


}


