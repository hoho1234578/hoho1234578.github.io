function webGLStart() {
  	var canvas = document.getElementById("lesson01-canvas");
  	initGL(canvas);
  	initShaders();
  	initBuffers();

	// gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);

	drawScene();
}


//這個函式獲取 WebGL 的紋理 (context)，且使用標準紋理名字告知畫布
var gl;
function initGL(canvas) {
    try {
	    gl = canvas.getContext("experimental-webgl");
	    gl.viewportWidth = canvas.width;
	    gl.viewportHeight = canvas.height;
    } catch(e) {
    }
    if (!gl) {
    	alert("Could not initialise WebGL, sorry :-( ");
    }
}


//定義變數 mvMatrix 來儲存模型視圖矩陣， pMatrix 是存投影矩陣
var mvMatrix = mat4.create();
var pMatrix = mat4.create();


//如何設定著色器
var shaderProgram;
function initShaders() {
	//使用 getShader() 去獲得片段著色器 (fragment shader) 與 頂點著色器 (vertex shader)，且把它們添加到 WebGL 的 program 內
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    //取得顏色屬性 (colour attribute)，啟動此顏色屬性的頂點屬性陣列
    shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, 
                                                              "aVertexColor");
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
}


/*webGLstart 呼叫 initShaders() 後者使用 getshader() HTML 文件之 script 中載入片段與頂點著色器的，
所以它們可編譯且傳送給 WebGL，且之後提供給三維場景 (3D scene) 的渲染使用。*/
function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3)
            str += k.textContent;
        k = k.nextSibling;
    }
  	var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}


/*使用 initShaders() 得到的模型視圖矩陣與投影矩陣之 uniform 值，
就是 shaderProgram.pMatrixUniform 與 shaderProgram.mvMatrixUniform。
把這兩個值透過 JavaScript 樣式矩陣送給 WebGL。*/
function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}


//宣告兩全域變數持有緩衝器，以及兩個顏色緩衝器 (colour buffers)
var flower1VertexPositionBuffer;
var flower1VertexColorBuffer;
var flower2VertexPositionBuffer;
var flower2VertexColorBuffer;
var centerVertexPositionBuffer;
var centerVertexColorBuffer;

function initBuffers() {

    /******************畫花心*******************/

    centerVertexPositionBuffer = gl.createBuffer(); //設定緩衝區

    //告訴 WebGL 操作可使用的緩衝器，就是「當前陣列緩衝器 (current array buffers)」
    gl.bindBuffer(gl.ARRAY_BUFFER, centerVertexPositionBuffer);
    var circle = {x: 0, y: 0, r: 0.2};
    var numFans = 100;
    var degreePerFan = degToRad(360 / numFans); //算每個扇子的角度
    var circleVertex =[];
    var j = 0;

    for (var i = 1; i <= numFans; i++){
    	
    	circleVertex[j++] = circle.x + Math.cos(degreePerFan * i) * circle.r;
    	circleVertex[j++] = circle.y + Math.sin(degreePerFan * i) * circle.r;
    	circleVertex[j++] = 0.0;
    	
    }

    //使用 Float32Array 轉換 Javascript 列表跨到 WebGL 填滿當前緩衝器
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(circleVertex), gl.STATIC_DRAW);
    centerVertexPositionBuffer.itemSize = 3; //每一個頂點位置擁有三個數值
    centerVertexPositionBuffer.numItems = numFans; //頂點位置

    centerVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, centerVertexColorBuffer);
    colors = []
    
    for (var i=0; i < numFans; i++) {
      colors = colors.concat([116/255, 52/255, 59/255, 1.0]);
    }

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    centerVertexColorBuffer.itemSize = 4;
    centerVertexColorBuffer.numItems = numFans;


    /******************畫花瓣*******************/
    
    flower2VertexPositionBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, flower2VertexPositionBuffer);

    var circle = {x: 0, y: 0, r: 0};
    var numFans = 80;
    var degreePerFan = 360/numFans;
    var flower2Vertex =[];
    var j = 0;

    //畫雨滴狀花瓣
    for (var i = 1; i <= numFans; i++){
    	if ( degreePerFan*i >= 0 && degreePerFan*i <= 20){
    		circle.r += 0.01;
    	}else if ( degreePerFan*i >= 20 && degreePerFan*i <= 90 ){
    		circle.r += 0.1;
    	}
    	else if ( degreePerFan*i >= 90 && degreePerFan*i <= 160 ){
    		circle.r -= 0.1;
    	}
    	else if ( degreePerFan*i >= 160 && degreePerFan*i <= 180 ){
    		circle.r -= 0.01;
    	}
    	else{
    		circle.r =0;
    	}

    	flower2Vertex[j++] = circle.x + Math.cos(degToRad(degreePerFan) * i) * circle.r;
    	flower2Vertex[j++] = circle.y + Math.sin(degToRad(degreePerFan) * i) * circle.r;
    	flower2Vertex[j++] = 0.0;
    }

    
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flower2Vertex), gl.STATIC_DRAW);
    flower2VertexPositionBuffer.itemSize = 3;
    flower2VertexPositionBuffer.numItems = numFans;

    flower2VertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, flower2VertexColorBuffer);
    colors = []
    colors = colors.concat([207/255, 64/255, 96/255, 1.0]);
    for (var i=1; i < numFans; i++) {
      colors = colors.concat([251/255, 173/255, 201/255, 1.0]);
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    flower2VertexColorBuffer.itemSize = 4;
    flower2VertexColorBuffer.numItems = numFans;

 }


//推物件頂點位置到顯示卡
function drawScene() {
	//使用 gl.viewport() 函式告訴 WebGL 畫布的大小
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	
	//在開始畫之前需要設定畫布的大小，接著清除 gl.clear() 畫布準備畫它
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    /*設定觀看場景的透視 (perspective) 參數。預設的 WebGL 畫的大小等同於從遠處觀看東西的大小，
    此為正交投影 (orthographic projection) 的三維風格，為了讓遠處的東西看起來較小，需要告訴 透視一些設定方式。
	對這個場景而言，設定垂直視角 (field of view, FOV) 為 45°，告知此畫布需要的寬度與高度比率，
	不想看到視口 (viewport) 過近於 0.1 單位，且過遠於 100 單位；此透視 (perspective) 使用 mat4 的模組，包含一個 pMatrix 的變數。
	總之，這個函式是根據寬高比 (aspect ratio) 和視野 (field-of-view) 的訊息， 設定需要的透視效果值到該矩陣中。*/
	mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

    /**************畫花心**************/

    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, [0, 3, -19]);

    gl.bindBuffer(gl.ARRAY_BUFFER, centerVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                           centerVertexPositionBuffer.itemSize, 
                           gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, centerVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                           centerVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    setMatrixUniforms();

    gl.drawArrays(gl.TRIANGLE_FAN, 0, centerVertexPositionBuffer.numItems);


    /**************畫花瓣**************/

    
    var numPetal = 8; //決定畫幾個花瓣
    var degreePerPetal = 360/numPetal; //每個花瓣起始角度
    var lean = 15; //傾斜角度

    for (var i = 1; i <= numPetal; i+=2){

    	mat4.identity(mvMatrix);
    	mat4.translate(mvMatrix, [0, 3, -19]);
    	mat4.rotate(mvMatrix, degToRad(degreePerPetal*i+lean), [0, 0, 1]);


	    gl.bindBuffer(gl.ARRAY_BUFFER, flower2VertexPositionBuffer);
	    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
	                           flower2VertexPositionBuffer.itemSize, 
	                           gl.FLOAT, false, 0, 0);

	    gl.bindBuffer(gl.ARRAY_BUFFER, flower2VertexColorBuffer);
	    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
	                           flower2VertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

	    setMatrixUniforms();

	    gl.drawArrays(gl.TRIANGLE_FAN, 0, flower2VertexPositionBuffer.numItems);

	    if(i==7){i=0;}
    }
}

//角度變弧度
function degToRad(degrees) {
    return degrees * Math.PI / 180;
}
