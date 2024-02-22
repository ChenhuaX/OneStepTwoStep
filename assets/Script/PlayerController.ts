import { _decorator, Component, Animation, Vec3, director, Scene, AudioClip} from 'cc';

const { ccclass, property } = _decorator;
@ccclass('PlayerController')
export class PlayerController extends Component {
    @property({type: Animation})
    public BodyAnim: Animation | null = null;



    private startJump : boolean  = false
    private _jumpStep : number = 0
    private _jumpTime : number = 0
    private _curJumpTime : number = 0
    private _curJumpSpeed : number = 0
    // player当前位置
    private _curPos : Vec3 = new Vec3();
    // player目标位置
    private _targetPos : Vec3 = new Vec3();
    // 帧移动位置
    private _deltaPos: Vec3 = new Vec3(0, 0, 0)
    // player移动步数
    private _stepNum: number = 0;
    private scene: Scene;
    get _startJump(){
        return this.startJump;
    }
    set _startJump(v){
        this.startJump = v;
    }
    get stepNum(){
        return this._stepNum;
    }
    set stepNum(num){
        this._stepNum = num;
    }
    start() {
        this.scene= director.getScene();
    }
    protected onDestroy(): void {
        //input.off(Input.EventType.MOUSE_UP, this.onMouseUp, this);
    }
    
    //帧间隔
    update(deltaTime: number) {

        if(this._startJump){
            
            this._curJumpTime += deltaTime
            if(this._curJumpTime > this._jumpTime){
                
                this.node.setPosition(this._targetPos)
                this._startJump = false
                
                // 判断游戏是否失败或失败
                this.scene.emit('checkFailOrWin', this.stepNum);
            }else{
                //获取当前位置
                this.node.getPosition(this._curPos)
                //计算本帧x轴移动长度
                this._deltaPos.x = this._curJumpSpeed * deltaTime;
                Vec3.add(this._curPos, this._curPos, this._deltaPos)
                //更新位置
                this.node.setPosition(this._curPos)
                
            }
            
        }
    }
   
    onActive(event: Event, button: string){
        if(button === 'left'){
            this.jumpByStep(1)
        }
        if (button === 'right'){
            this.jumpByStep(2)
        }
    }
    jumpByStep(step: number){

        if(this._startJump) return;

        if(this.BodyAnim){
            if(step === 1){
                this.BodyAnim.play('oneStep')
            }
            if(step === 2){
                this.BodyAnim.play('twoStep')
            }
            this.stepNum += step;
            
        }

        if(step === 1) this._jumpTime = 0.1
        if(step === 2) this._jumpTime = 0.2

        this._startJump = true; // 开始跳跃

        this._jumpStep = step; // 传递跳跃步数
        this._curJumpTime = 0
        this._curJumpSpeed = this._jumpStep / this._jumpTime
        this.node.getPosition(this._curPos);
        //Vec3的坐标加法封装
        Vec3.add(this._targetPos, this._curPos, new Vec3(this._jumpStep, 0, 0))
    }
}


