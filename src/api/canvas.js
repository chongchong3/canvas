import numeric from 'numeric';
import * as d3 from 'd3';
const canvasObj={
    canvas: {},
    filter:fabric.Image.filters,
    optionSelect: false,
    cutSelect: false,
    unclock: true,
    _clipboard: {},
    forWrodBoxShow:false,
    // jigsawIsOpen:true,
    // currentNav:'',
    // isEditor:false,
    // config:{},
    cutRect: {
        el: '',
        object: '',
        lastActive: '',
        object1: '',
        object2: '',
        cntObj: '',
        selection_object_left: '',
        selection_object_top: ''
    },
    srcPoints:null,
    transCanvasElement:null,
    controlHandlesElement:null,
    gl:null,
    glResources:null,
    controlPoints:[],
    aftercontrolPoints:[],
    canvas2d:null,
    removeObj:null
};

/***变形相关代码--START */


canvasObj.getClipparam = function(){
    let temp = this.aftercontrolPoints;
    let x0 = temp[0].x >= temp[2].x ?  temp[2].x : temp[0].x;
    let y0 = temp[0].y >= temp[1].y ?  temp[1].y : temp[0].y;
    let x1 = temp[1].x >= temp[3].x ?  temp[1].x : temp[3].x;
    let y1 = temp[2].y >= temp[3].y ?  temp[2].y : temp[3].y;
    return [{x:x0,y:y0},{x:x1,y:y1}];
};

/**
 * 变形后确认变形操作
 */
canvasObj.confirmTransform = function(){

    //TODO如何截取图片并导出

    let data = this.gl.canvas.toDataURL();
    var img = new Image();
    img.src  = "data:"+data;
    // img.onload = function(){
    //     canvasObj.canvas.getContext('2d').drawImage(img,0,0);

    // };
    // let ctx = canvasObj.getCanvas2d.getContext('2d');
    fabric.util.loadImage(
        img.src,
        function(oimg){
          
            let imgInstance = new fabric.Image(oimg,{
                left: 0,
                top:0,
                scale: 1
            });
            
            canvasObj.canvas.add(imgInstance);
            // imgInstance.crossOrigin = 'Anonymous';
        },
        canvasObj.canvas.getContext(),
        true
    );



    // let points = canvasObj.getClipparam();
    // let ctx = this.canvas2d.getContext('2d');
    // ctx.rect(points[0].x,points[0].y,points[1].x,points[1].y);
    // ctx.stroke();
    // ctx.clip();
    // let data1 = this.canvas2d.toDataURL();
    // var img1 = new Image();
    // img1.src  = "data:"+data1;
    // fabric.util.loadImage(
    //     img1.src,
    //     function(oimg){
          
    //         let imgInstance = new fabric.Image(oimg,{
    //             left: points[0].x,
    //             top:points[0].y,
    //             scale: 1
    //         });
            
    //         canvasObj.canvas.add(imgInstance);
    //         // imgInstance.crossOrigin = 'Anonymous';
    //     },
    //     canvasObj.canvas.getContext(),
    //     true
    // );
};
/**
 * 取消变形
 */
canvasObj.cancalTransform = function(){
    this.canvas.add(this.removeObj);
};
/**
 * 变形初始化
 */
canvasObj.transformInit = function(canvasId){
    let o = this.canvas.getActiveObject();
    let obj = o.aCoords;
    this.removeObj = o;
    let data = this.canvas.toDataURL({format:'image/png',left:o.left,top:o.top,width:o.width,height:o.height});
    this.aftercontrolPoints = this.controlPoints=[obj.tl,obj.tr,obj.bl,obj.br];
    
    if(!this.gl){
        this.initGl(canvasId);
        this.canvas.remove(o);
    }
    this.screenImgElement = new Image();
    this.screenImgElement.crossOrigin = '';
    this.screenImgElement.onload = this.loadScreenTexture;
    this.screenImgElement.src = 'data: '+data;
    this.controlHandlesElement = document.getElementById('controlHandles');
    this.setupControlHandles(this.controlHandlesElement, this.redrawImg);
};
/**
 * 初始化webgl
 */
canvasObj.initGl=function(id){
    this.transCanvasElement = document.getElementById(id);
    var glOpts = { antialias: true, depth: false, preserveDrawingBuffer: true };
    this.gl =
        this.transCanvasElement.getContext('webgl', glOpts) ||
        this.transCanvasElement.getContext('experimental-webgl', glOpts);
    this.glResources = this.setupGlContext();
};
/**
 * webgl变形相关配置参数
 */
canvasObj.setupGlContext = function() {
    // Store return values here
    var rv = {};
    
    // Vertex shader:
    var vertShaderSource = [
        'attribute vec2 aVertCoord;',
        'uniform mat4 uTransformMatrix;',
        'varying vec2 vTextureCoord;',
        'void main(void) {',
        '    vTextureCoord = aVertCoord;',
        '    gl_Position = uTransformMatrix * vec4(aVertCoord, 0.0, 1.0);',
        '}'
    ].join('\n');
    var vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
    this.gl.shaderSource(vertexShader, vertShaderSource);
    this.gl.compileShader(vertexShader);

    if (!this.gl.getShaderParameter(vertexShader, this.gl.COMPILE_STATUS)) {
        addError('Failed to compile vertex shader:' +
              this.gl.getShaderInfoLog(vertexShader));
    }
       
    // Fragment shader:
    var fragShaderSource = [
        'precision mediump float;',
        'varying vec2 vTextureCoord;',
        'uniform sampler2D uSampler;',
        'void main(void)  {',
        '    gl_FragColor = texture2D(uSampler, vTextureCoord);',
        '}'
    ].join('\n');

    var fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
    this.gl.shaderSource(fragmentShader, fragShaderSource);
    this.gl.compileShader(fragmentShader);

    if (!this.gl.getShaderParameter(fragmentShader, this.gl.COMPILE_STATUS)) {
        addError('Failed to compile fragment shader:' +
              this.gl.getShaderInfoLog(fragmentShader));
    }
    
    // Compile the program
    rv.shaderProgram = this.gl.createProgram();
    this.gl.attachShader(rv.shaderProgram, vertexShader);
    this.gl.attachShader(rv.shaderProgram, fragmentShader);
    this.gl.linkProgram(rv.shaderProgram);

    if (!this.gl.getProgramParameter(rv.shaderProgram, this.gl.LINK_STATUS)) {
        addError('Shader linking failed.');
    }
        
    // Create a buffer to hold the vertices
    rv.vertexBuffer = this.gl.createBuffer();

    // Find and set up the uniforms and attributes        
    this.gl.useProgram(rv.shaderProgram);
    rv.vertAttrib = this.gl.getAttribLocation(rv.shaderProgram, 'aVertCoord');
        
    rv.transMatUniform = this.gl.getUniformLocation(rv.shaderProgram, 'uTransformMatrix');
    rv.samplerUniform = this.gl.getUniformLocation(rv.shaderProgram, 'uSampler');
        
    // Create a texture to use for the screen image
    rv.screenTexture = this.gl.createTexture();
    
    return rv;
};

/**
 * 变形坐标计算
 */
canvasObj.transformationFromQuadCorners = function (before, after){
    /*
     Return the 8 elements of the transformation matrix which maps
     the points in *before* to corresponding ones in *after*. The
     points should be specified as
     [{x:x1,y:y1}, {x:x2,y:y2}, {x:x3,y:y2}, {x:x4,y:y4}].
     
     Note: There are 8 elements because the bottom-right element is
     assumed to be '1'.
    */
    var b = numeric.transpose([[
        after[0].x, after[0].y,
        after[1].x, after[1].y,
        after[2].x, after[2].y,
        after[3].x, after[3].y ]]);
    var A = [];
    for(var i=0; i<before.length; i++) {
        A.push([
            before[i].x, 0, -after[i].x*before[i].x,
            before[i].y, 0, -after[i].x*before[i].y, 1, 0]);
        A.push([
            0, before[i].x, -after[i].y*before[i].x,
            0, before[i].y, -after[i].y*before[i].y, 0, 1]);
    }
    // Solve for T and return the elements as a single array
    return numeric.transpose(numeric.dot(numeric.inv(A), b))[0];
};
/**
 * 重绘图片
 */
canvasObj.redrawImg = function() {
    let _this = canvasObj;
    if(!_this.gl || !_this.glResources || !_this.srcPoints) { return; }
    var vpW = _this.transCanvasElement.width;
    var vpH = _this.transCanvasElement.height;
    
    // Find where the control points are in 'window coordinates'. I.e.
    // where thecanvas covers [-1,1] x [-1,1]. Note that we have to flip
    // the y-coord.
    var dstPoints = [];
    for(var i=0; i<_this.controlPoints.length; i++) {
        dstPoints.push({
            x: (2 * _this.controlPoints[i].x / vpW) - 1,
            y: -(2 * _this.controlPoints[i].y / vpH) + 1
        });
    }
    
    // Get the transform
    var v = _this.transformationFromQuadCorners(_this.srcPoints, dstPoints);
    
    // set background to full transparency
    _this.gl.clearColor(0,0,0,0);
    _this.gl.viewport(0, 0, vpW, vpH);
    _this.gl.clear(_this.gl.COLOR_BUFFER_BIT | _this.gl.DEPTH_BUFFER_BIT);

    _this.gl.useProgram(_this.glResources.shaderProgram);

    // draw the triangles
    _this.gl.bindBuffer(_this.gl.ARRAY_BUFFER, _this.glResources.vertexBuffer);
    _this.gl.enableVertexAttribArray(_this.glResources.vertAttrib);
    _this.gl.vertexAttribPointer(_this.glResources.vertAttrib, 2, _this.gl.FLOAT, false, 0, 0);
    
    /*  If 'v' is the vector of transform coefficients, we want to use
        the following matrix:
    
        [v[0], v[3],   0, v[6]],
        [v[1], v[4],   0, v[7]],
        [   0,    0,   1,    0],
        [v[2], v[5],   0,    1]
    
        which must be unravelled and sent to uniformMatrix4fv() in *column-major*
        order. Hence the mystical ordering of the array below.
    */
    _this.gl.uniformMatrix4fv(
        _this.glResources.transMatUniform,
        false, [
            v[0], v[1],    0, v[2],
            v[3], v[4],    0, v[5],
            0,    0,    0,    0,
            v[6], v[7],    0,    1
        ]);
        
    _this.gl.activeTexture(_this.gl.TEXTURE0);
    _this.gl.bindTexture(_this.gl.TEXTURE_2D, _this.glResources.screenTexture);
    _this.gl.uniform1i(_this.glResources.samplerUniform, 0);

    _this.gl.drawArrays(_this.gl.TRIANGLE_STRIP, 0, 4);    
};
/**
 * 图片加载时的处理
 */
canvasObj.loadScreenTexture=function () {
    let _this = canvasObj;
    if(!_this.gl || !_this.glResources) { return; }
    
    _this.gl.bindTexture(_this.gl.TEXTURE_2D, _this.glResources.screenTexture);
    
    var image = _this.screenImgElement;
    var extent = { w: image.naturalWidth, h: image.naturalHeight };
    
    // Scale up the texture to the next highest power of two dimensions.
    var canvas = _this.getCanvas2d();
    
    var ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0, image.width, image.height);
    
    _this.gl.texImage2D(_this.gl.TEXTURE_2D, 0, _this.gl.RGBA, _this.gl.RGBA, _this.gl.UNSIGNED_BYTE, canvas);
    _this.gl.texParameteri(_this.gl.TEXTURE_2D, _this.gl.TEXTURE_MIN_FILTER,_this.gl.LINEAR);
    _this.gl.texParameteri(_this.gl.TEXTURE_2D, _this.gl.TEXTURE_MAG_FILTER, _this.gl.NEAREST);
    _this.gl.texParameteri(_this.gl.TEXTURE_2D, _this.gl.TEXTURE_WRAP_S,_this.gl.CLAMP_TO_EDGE);
    _this.gl.texParameteri(_this.gl.TEXTURE_2D, _this.gl.TEXTURE_WRAP_T, _this.gl.CLAMP_TO_EDGE);
    _this.gl.bindTexture(_this.gl.TEXTURE_2D, null);
    
    // Record normalised height and width.
    var w = extent.w / canvas.width, h = extent.h / canvas.height;
    
    _this.srcPoints = [
        { x: 0, y: 0 }, // top-left
        { x: w, y: 0 }, // top-right
        { x: 0, y: h }, // bottom-left
        { x: w, y: h }  // bottom-right
    ];
        
    // setup the vertex buffer with the source points
    var vertices = [];
    for(var i=0; i<_this.srcPoints.length; i++) {
        vertices.push(_this.srcPoints[i].x);
        vertices.push(_this.srcPoints[i].y);
    }
    
    _this.gl.bindBuffer(_this.gl.ARRAY_BUFFER, _this.glResources.vertexBuffer);
    _this.gl.bufferData(_this.gl.ARRAY_BUFFER, new Float32Array(vertices), _this.gl.STATIC_DRAW);
    
    // Redraw the image
    _this.redrawImg();
};
/**
 * 配置控制圆圈
 */
canvasObj.setupControlHandles = function (controlHandlesElement, onChangeCallback){
    let _this = canvasObj;
    // Use d3.js to provide user-draggable control points _this.aftercontrolPoints = dstPoints;
    var rectDragBehav = d3.drag()
        .on('drag', function(d,i) {
            d.x += d3.event.dx; d.y += d3.event.dy;
            _this.aftercontrolPoints[i] = {x:d.x,y:d.y};
            d3.select(this).attr('cx',d.x).attr('cy',d.y);
            onChangeCallback();
        });
    
    var dragT = d3.select(controlHandlesElement).selectAll('circle')
        .data(this.controlPoints)
        .enter().append('circle')
        .attr('cx', function(d) { return d.x; })
        .attr('cy', function(d) { return d.y; })
        .attr('r', 20)
        .attr('class', 'control-point')
        .call(rectDragBehav);
}

canvasObj.getCanvas2d=function(){
    if(!this.canvas2d){
        this.canvas2d = document.createElement('canvas');
        this.canvas2d.width = 800;
        this.canvas2d.height =500;
    }
    return this.canvas2d ;
};

/**变形相关代码--END */


canvasObj.getCanvas = function(){   
    return canvasObj.canvas;
};
canvasObj.createCanvas = function(id){    
    return canvasObj.canvas = new fabric.Canvas(id);
};
canvasObj.copy = function(){
    this.canvas.getActiveObject().clone(function (cloned) {
        canvasObj._clipboard = cloned;
    });
};
canvasObj.paste = function(){
    let obj = this;
    obj._clipboard.clone(function (clonedObj) {
        obj.canvas.discardActiveObject();
        clonedObj.set({
            left: clonedObj.left + 50,
            top: clonedObj.top + 50,
            evented: true
        });
        if (clonedObj.type === 'activeSelection') {
            clonedObj.canvas = obj.canvas;
            clonedObj.forEachObject(function (obj) {
                obj.canvas.add(obj);
            });
            clonedObj.setCoords();
        } else {
            obj.canvas.add(clonedObj);
        }
        obj._clipboard.top += 30;
        obj._clipboard.left += 30;
        obj.canvas.setActiveObject(clonedObj);
        obj.canvas.requestRenderAll();
        canvasObj.bindSeletUnSelectEvent(clonedObj);
        obj.optionSelect = true;
        // vm.$store.commit('setOptionSelect', true);
    
    });
};
canvasObj.bindSeletUnSelectEvent = function(img){
    let _this = this;
    img.on('selected', function (options) {
        _this.optionSelect = true;
        if (_this.canvas.getActiveObject().lockMovementX) {
            _this.unclock = false;
            // vm.$store.commit('setUnclock', false);
            return;
        }
        _this.unclock = true;
        // vm.$store.commit('setUnclock', true);
    })
        .on('deselected', function (options) {
            _this.optionSelect = false;
            // vm.$store.commit('setOptionSelect', false);
        });
};
canvasObj.startCrop = function(){
    let canvas = this.canvas;
    canvas.remove(this.cutRect.el);
    if (canvas.getActiveObject()) {
        this.cutRect.object = canvas.getActiveObject();
  
        if (this.cutRect.lastActive && this.cutRect.lastActive !== this.cutRect.object) {
            this.cutRect.lastActive.clipTo = null;
        }
  
        this.cutRect.el = new fabric.Rect({
            fill: 'rgba(0,0,0,0.3)',
            originX: 'left',
            originY: 'top',
            stroke: '#ccc',
            strokeDashArray: [2, 2],
            opacity: 1,
            width: 1,
            height: 1,
            borderColor: '#36fd00',
            cornerColor: 'green',
            hasRotatingPoint: false
        });
        this.cutRect.el.left = canvas.getActiveObject().left;
        this.cutRect.selection_object_left = canvas.getActiveObject().left;
        this.cutRect.selection_object_top = canvas.getActiveObject().top;
        this.cutRect.el.top = canvas.getActiveObject().top;
        this.cutRect.el.width =
        canvas.getActiveObject().width *
        canvas.getActiveObject().scaleX;
        this.cutRect.el.height =
        canvas.getActiveObject().height *
        canvas.getActiveObject().scaleY;
        canvas.add(this.cutRect.el);
        canvas.setActiveObject(this.cutRect.el);
        return;
    }
    alert("Please select an object or layer");
};
canvasObj.crop = function(){
    let cutEl = this.cutRect.el;
    var left = cutEl.left - this.cutRect.object.left;
    var top = cutEl.top - this.cutRect.object.top;
    left *= 1;
    top *= 1;
    var width = cutEl.width * 1;
    var height = cutEl.height * 1;

    this.cutRect.object.clipTo = function (ctx) {
        ctx.rect(-(cutEl.width / 2) + left, -(cutEl.height / 2) + top, parseInt(width * cutEl.scaleX), parseInt(cutEl.scaleY * height));
    };
    this.canvas.remove(this.canvas.getActiveObject());
    this.cutRect.lastActive = this.cutRect.object;
    this.canvas.renderAll();
};
canvasObj.lockOption = function(){
    let obj = this.canvas.getActiveObject();
    if (this.unclock) {
        obj.lockMovementX = true;
        obj.lockMovementY = true;
        obj.lockRotation = true;
        obj.lockScalingX = true;
        obj.lockScalingY = true;
        this.unclock = false;
        // vm.$store.commit('setUnclock', false);
        return;
    }
    obj.lockMovementX = false;
    obj.lockMovementY = false;
    obj.lockRotation = false;
    obj.lockScalingX = false;
    obj.lockScalingY = false;
    this.unclock = true;
    // vm.$store.commit('setUnclock', true);
    
};
canvasObj.hide = function(){ 
    let c = this.canvas;
    c.getActiveObject().set('opacity', 0).setCoords();
    c.requestRenderAll();
};
canvasObj.show = function(){
    let c = this.canvas;
    c.getActiveObject().set('opacity', 1).setCoords();
    c.requestRenderAll();
};
canvasObj.group = function(){
    let c = this.canvas;
    if (!c.getActiveObject()) {
        return;
    }
    if (c.getActiveObject().type !== 'activeSelection') {
        return;
    }
    c.getActiveObject().toGroup();
    c.requestRenderAll();
};

canvasObj.ungroup = function(){
    let c = this.canvas;
    if (!c.getActiveObject()) {
        return;
    }
    if (c.getActiveObject().type !== 'group') {
        return;
    }
    c.getActiveObject().toActiveSelection();
    c.requestRenderAll(); 
};
canvasObj.flip = function(){
    let c = this.canvas;
    c.getActiveObject().set('scaleX', -1).setCoords();
    c.requestRenderAll();  
};
canvasObj.fabricForward = function(style){
    let c = this.canvas;
    this.forWrodBoxShow = false;
    // vm.$store.commit('setForwordBox', false);
    this.canvas.preserveObjectStacking = true;
    if (style == 'forWard') {
  
        c.bringForward(c.getActiveObject());
        return;
    }
    if (style == 'backWard') {
        c.sendBackwards(c.getActiveObject());
  
        return;
    }
    if (style == 'toFront') {
  
        c.bringToFront(c.getActiveObject());
        return;
    }
    if (style == 'toBack') {
        c.sendToBack(c.getActiveObject());
        return;
    }
};
canvasObj.changeBright = function(lightnum){
    let c = this.canvas;
    c.getActiveObject().filters[0] = new this.filter.Brightness({
        brightness: parseFloat(lightnum)
    });
    c.getActiveObject().applyFilters();
    c.renderAll();
};
canvasObj.changeOpacity = function(opacityNun){
    let c = this.canvas;
    c.getActiveObject().opacity = parseFloat(opacityNun);
    c.renderAll();
};
canvasObj.changeContrast = function(contrastnum){
    let c = this.canvas;
    c.getActiveObject().filters[1] = new this.filter.Contrast({
        contrast: parseFloat(contrastnum)
    });
    c.getActiveObject().applyFilters();
    c.renderAll();
};
canvasObj.changeSaturation = function(saturation){
    let c = this.canvas;
    c.getActiveObject().filters[2] = new this.filter.Saturation({
        saturation: parseFloat(saturation)
    });
    c.getActiveObject().applyFilters();
    c.renderAll();
};
canvasObj.changeBlur = function(blur){
    let c = this.canvas;
    c.getActiveObject().filters[3] = new this.filter.Blur({
        blur: parseFloat(blur)
    });
    c.getActiveObject().applyFilters();
    c.renderAll();
};

export default canvasObj;