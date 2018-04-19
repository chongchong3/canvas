<template>
    <div>
        <el-row >
            <el-col :span="24">
                <div v-show="showFlag && !transformFlag" class="grid-content bg-purple-dark">
                   
                    <el-button  type="primary" @click="showFilters" >
                    滤镜
                    </el-button>
                    <div class="filter-c" v-show="showFilterList">
                        <div >
                            亮度{{lightnum}}
                            <el-slider :max="100" :min="-100" @change="changeBright"  v-model="lightnum"></el-slider>
                        </div>
                         <div >
                            对比度{{contrastnum}}
                            <el-slider :max="100" :min="-100" @change="changeContrast"  v-model="contrastnum"></el-slider>
                        </div>
                         <div >
                            饱和度{{saturationnum}}
                            <el-slider :max="100" :min="-100" @change="changeSaturation"  v-model="saturationnum"></el-slider>
                        </div>
                         <div >
                            清晰度{{blurnum}}
                            <el-slider :max="100" :min="0" @change="changeBlur"  v-model="blurnum"></el-slider>
                        </div>
                         <div >
                            透明度{{opacitynum}}
                            <el-slider :max="100" :min="0" @change="changeOpacity"  v-model="opacitynum"></el-slider>
                        </div>
                    </div>
                    
                    <el-tooltip class="item" effect="dark" content="变形" >
                        <el-button  type="primary" @click="transform">
                        变形
                        </el-button>
                    </el-tooltip>
                    <el-tooltip class="item" effect="dark" content="裁剪" >
                        <el-button  type="primary" @click="cut">
                            裁剪
                        </el-button>
                    </el-tooltip>
                    <el-tooltip class="item" effect="dark" content="拷贝" >
                        <el-button  type="primary" @click="clone">
                            拷贝
                        </el-button>
                    </el-tooltip>
                    <el-tooltip class="item" effect="dark" :content="lockTxt" >
                        <el-button  type="primary" @click="lock">
                            {{lockTxt}}
                        </el-button>
                    </el-tooltip>
                    <el-tooltip class="item" effect="dark" content="删除" >
                        <el-button  type="primary" @click="del">
                            删除
                        </el-button>
                    </el-tooltip>
                    <el-tooltip class="item" effect="dark" content="显示" >
                        <el-button  type="primary" @click="show">
                            显示
                        </el-button>
                    </el-tooltip>
                     <el-tooltip class="item" effect="dark" content="隐藏" >
                        <el-button  type="primary" @click="hide">
                            隐藏
                        </el-button>
                    </el-tooltip>
                    <el-tooltip class="item" effect="dark" content="水平翻转" >
                        <el-button  type="primary" @click="flip">
                            水平翻转
                        </el-button>
                    </el-tooltip>
                    <el-tooltip class="item" effect="dark" content="组合" >
                        <el-button  type="primary" @click="group">
                            组合
                        </el-button>
                    </el-tooltip>
                    <el-tooltip class="item" effect="dark" content="打散" >
                        <el-button  type="primary" @click="ungroup">
                            打散
                        </el-button>
                    </el-tooltip>
                    
                    <el-dropdown trigger="click" @command="changeForWord">
                        <el-button type="primary">
                            层级<i class="el-icon-arrow-down el-icon--right"></i>
                        </el-button>
                        <el-dropdown-menu  slot="dropdown">
                            <el-dropdown-item command="forWard">上一层</el-dropdown-item>
                            <el-dropdown-item command="backWard" >下一层</el-dropdown-item>
                            <el-dropdown-item command="toFront" >最上层</el-dropdown-item>
                            <el-dropdown-item command="toBack">最底层</el-dropdown-item>
                        </el-dropdown-menu>
                    </el-dropdown>
                    
                </div>
                <div class="grid-content bg-purple-dark" v-show="!showFlag">
                    <el-tooltip class="item" effect="dark" content="取消" >
                        <el-button  type="primary" @click="cutCancel">
                             <i class="el-icon-close" ></i>
                        </el-button>
                    </el-tooltip>
                    <el-tooltip class="item" effect="dark" content="确认" >
                        <el-button  type="primary" @click="cutConfirm">
                            <i class="el-icon-check"></i>
                        </el-button>
                    </el-tooltip>
                   
                    
                </div>
                <div class="grid-content bg-purple-dark" v-show="transformFlag">
                    <el-tooltip class="item" effect="dark" content="取消" >
                        <el-button  type="primary" @click="transCancel">
                             <i class="el-icon-close" ></i>
                        </el-button>
                    </el-tooltip>
                    <el-tooltip class="item" effect="dark" content="确认" >
                        <el-button  type="primary" @click="transConfirm">
                            <i class="el-icon-check"></i>
                        </el-button>
                    </el-tooltip>
                   
                    
                </div>
            </el-col>
        </el-row>
        <el-container>
            <el-aside width="200px"  style="text-align:center;border:10px solid #ccc;padding-top:20px;">
                <el-row v-for="(item,index) in imgArr" :key="index"> 
                    <img class="example-img" draggable="true" @dragstart="dragStart($event)" @dragend="dragend($event)"  :src="item"/>
                </el-row>
               
            </el-aside>
            <el-main>
                <div class="canvas-c">
                    <div id="normalContent">
                         <canvas id="canvas" width="800" height="500" style="z-index:9">

                        </canvas>
                    </div>
                    <div id="transformContent" v-show="transformFlag">
                        <canvas width="800" height="500" id="screenCanvas" style="z-index: 19;"></canvas>
				        <svg width="800" height="500" id="controlHandles" style="z-index: 20;" ></svg>
                    </div>
                </div>
            </el-main>
        </el-container>
       
    </div>
</template>
<style rel="stylesheet/scss" lang="scss">
    .el-row {
        margin-bottom: 20px;
        &:last-child {
        margin-bottom: 0;
        }
    }
    .el-col {
        border-radius: 4px;
    }
    .bg-purple-dark {
        background: #99a9bf;
    }
 
    .grid-content {
        border-radius: 4px;
        min-height: 36px;
        text-align: center;
        position: relative;
    }
    .row-bg {
        padding: 10px 0;
        background-color: #f9fafc;
    }
    
    #canvas{
        border:1px solid #99a9bf;
    }
    .example-img{
        width:60%;
    }
    .filter-c{
        width:250px;
        position:absolute;
        background:#666;
        top:60px;
        left:40px;
        z-index:999;
        color:#fff;
        padding:0 20px;
    }
    .canvas-c *{
        position: absolute;
    }
    circle.control-point {
		fill: green;
		fill-opacity: 0.25;
	}
	
	circle.control-point:hover {
		stroke: yellow;
		stroke-width: 2px;
	}
</style>
<script>
import canvasObj from '@/api/canvas';
export default {
    data(){
        return {
            showFilterList:false,
            transformFlag:false,
            lightnum:0,
            contrastnum:0,
            saturationnum: 0,
            blurnum: 0,
            colornum: 0,
            opacitynum: 0,
            filter: fabric.Image.filters,
            showFlag:true,
            mouseImgPos:{},
            canvasPos:{},
            canvas:null,
            lockTxt:'锁定',
            imgURL:'',
            imgArr:[require('../assets/images/1.jpg'),require('../assets/images/2.jpg'),require('../assets/images/3.jpg')],
            cutRect: {
                el: '',
                object: '',
                lastActive: '',
                object1: '',
                object2: '',
                cntObj: '',
                selection_object_left: '',
                selection_object_top: ''
            }
        }
    },
    mounted(){
        this.canvas = canvasObj.createCanvas('canvas');
        // this.$store.commit('setCanvas', this.canvas);
    },
    methods:{
        transCancel:function(){
            canvasObj.cancalTransform();
            this.transformFlag = false;
        },
        transConfirm :function(){
            canvasObj.confirmTransform();
            this.transformFlag = false;
        },
        transform:function(){
            canvasObj.transformInit('screenCanvas');
            this.transformFlag = true;
        },
        changeOpacity:function(){
            canvasObj.changeOpacity((1 - this.opacitynum / 100));
        },
        changeBlur:function(){
            canvasObj.changeBlur((this.blurnum / 100));
        },
        changeSaturation:function(){
            canvasObj.changeSaturation((this.saturationnum / 100));
        },
        changeContrast:function(){
            canvasObj.changeContrast((this.contrastnum / 100));
        },
        changeBright:function(){
            canvasObj.changeBright(this.lightnum/100);
        },
        showFilters:function(){
            this.showFilterList =  this.showFilterList ? false : true;
        },
        changeForWord:function(style){           
            canvasObj.fabricForward(style);
        },
        flip:function(){
            canvasObj.flip();
        },
        ungroup:function(){
            canvasObj.ungroup();
        },
        group:function(){
            canvasObj.group();
        },
        show:function(){
            canvasObj.show();
        },
        hide:function(){
            canvasObj.hide();
        },
        del() {
            var el = canvasObj.canvas.getActiveObject();
            canvasObj.canvas.remove(el);
        },
        lock:function(){
            canvasObj.lockOption();
            canvasObj.unclock ? this.lockTxt='锁定' : this.lockTxt='解锁';
        },
        cutCancel:function(){
            this.canvas.remove(canvasObj.cutRect.el);
            this.showFlag = true;
        },
        cutConfirm:function(){
            canvasObj.optionSelect = true;
            canvasObj.cutSelect = false;
            // this.$store.commit('setOptionSelect', true);
            // this.$store.commit('setCutSelect', false);
            canvasObj.crop();
            this.showFlag = true;
        },
        cut:function(){
            canvasObj.optionSelect = false;
            canvasObj.cutSelect = true;
            // this.$store.commit('setOptionSelect', false);
            // this.$store.commit('setCutSelect', true);
            this.showFlag = false;
            canvasObj.startCrop();
        },
        clone:function(){
            canvasObj.copy();
            setTimeout(()=>{
                canvasObj.paste();
            },100);
        },
        drawObj() {
            let rect = document.querySelector('canvas').getBoundingClientRect();
            this.canvasPos = {
                x: rect.left,
                y: rect.top,
                w: rect.width,
                h: rect.height,
                l: rect.left,
                t: rect.top,
                r: rect.right,
                b: rect.bottom
            };
        },
        dragStart:function(ev){
            ev.dataTransfer.setData("url", ev.target.src);
            ev.dataTransfer.setData("id", ev.target.id);
            // let url = ev.dataTransfer.getData("url");

            this.mouseImgPos = {
                x: ev.offsetX,
                y: ev.offsetY
            };
        },
        dragend:function(ev){
            let _this = this;
            this.drawObj();
            fabric.util.loadImage(
                ev.target.src,
                function(oimg){
                  
                    let imgInstance = new fabric.Image(oimg,{
                        left: ev.clientX - _this.canvasPos.x - _this.mouseImgPos.x,
                        top: ev.clientY - _this.canvasPos.y - _this.mouseImgPos.y,
                        scale: 1
                    });
                    
                    _this.canvas.add(imgInstance);
                    // imgInstance.crossOrigin = 'Anonymous';
                },
                _this.canvas.getContext(),
                true
            );
        }
    }
};
</script>
