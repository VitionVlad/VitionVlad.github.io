
class vec2{
    constructor(x, y){
        this.x  = x;
        this.y = y;
    }
}

class vec3{
    constructor(x, y, z){
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

class mat4{
    constructor(){
        this.mat = new Float32Array([0, 0, 0, 0,
                    0, 0, 0, 0,
                    0, 0, 0, 0,
                    0, 0, 0, 0]);
    }
    buildtranslatemat(pos){
        this.mat[0] = 1;
        this.mat[5] = 1;
        this.mat[10] = 1;
        this.mat[15] = 1;
        this.mat[12] = pos.x;
        this.mat[13] = pos.y;
        this.mat[14] = pos.z;
    }
    buildxrotmat(angle){
        this.mat[0] = 1;
        this.mat[5] = Math.cos(angle);
        this.mat[6] = -Math.sin(angle);
        this.mat[9] = Math.sin(angle);
        this.mat[10] = Math.cos(angle);
        this.mat[15] = 1;
    }
    buildyrotmat(angle){
        this.mat[0] = Math.cos(angle);
        this.mat[5] = 1.0;
        this.mat[2] = Math.sin(angle);
        this.mat[8] = -Math.sin(angle);
        this.mat[10] = Math.cos(angle);
        this.mat[15] = 1;
    }
    buildzrotmat(angle){
        this.mat[0] = Math.cos(angle);
        this.mat[5] = Math.cos(angle);
        this.mat[4] = Math.sin(angle);
        this.mat[1] = -Math.sin(angle);
        this.mat[10] = 1;
        this.mat[15] = 1;
    }
    buildperspectivemat(fov, zNear, zFar, aspect){
        var S = Math.tan((fov/2)*(3.1415/180));
        this.mat[0] = 1/(aspect*S);
        this.mat[5] = 1/S;
        this.mat[10] = -zFar/(zFar-zNear);
        this.mat[11] = -1;
        this.mat[14] = -zFar*zNear/(zFar-zNear);
    }
    buildorthomat(r, l, t, b, zNear, zFar){
        this.mat[0] = 2/(r-l);
        this.mat[5] = 2/(t-b);
        this.mat[10] = -2/(zFar-zNear);
        this.mat[15] = 1;
        this.mat[12] = -(r+l)/(r-l);
        this.mat[13] = -(t+b)/(t-b);
        this.mat[14] = -(zFar+zNear)/(zFar-zNear);
    }
    buildIdentityMat(){
        this.mat[0] = 1;
        this.mat[5] = 1;
        this.mat[10] = 1;
        this.mat[15] = 1;
    }
    buildScaleMat(scale){
        this.mat[0] = scale.x;
        this.mat[5] = scale.y;
        this.mat[10] = scale.z;
        this.mat[15] = 1;
    }
    clearmat(){
        for(var i = 0; i != 16; i++){
            this.mat[i] = 0.0;
        }
    }
}

class Engine{
    between(x, min, max) {
        return x >= min && x <= max;
    }
    loadShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }
    initShaderProgram(vsSource, fsSource) {
        const vertexShader = this.loadShader(this.gl, this.gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.loadShader(this.gl, this.gl.FRAGMENT_SHADER, fsSource);
      
        const shaderProgram = this.gl.createProgram();
        this.gl.attachShader(shaderProgram, vertexShader);
        this.gl.attachShader(shaderProgram, fragmentShader);
        this.gl.linkProgram(shaderProgram);
        if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS)) {
            alert('Unable to initialize the shader program: ' + this.gl.getProgramInfoLog(shaderProgram));
            return null;
        }
        return shaderProgram;
    }
    constructor(){
        this.canvas = document.querySelector("#glCanvas");
        this.canvas.width = window.screen.width;
        this.canvas.height = window.screen.height;
        this.gl = this.canvas.getContext("webgl2");
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        const ext = this.gl.getExtension('WEBGL_depth_texture');
        this.dptex = true;
        if (!ext) {
            this.dptex = false;
            console.log("depth texture extension missing");
        }
        this.touchHandler = function(event) {
            let x = event.touches[0].clientX, y = event.touches[0].clientY;
            var resolution = new vec2(window.screen.width, window.screen.height);
            var touchpos = new vec2(x, y);
            if(touchpos.x < resolution.x/2){
                this.pos.z += Math.cos(this.rot.y) * Math.cos(this.rot.x) * (((((-touchpos.y/resolution.y)*2) +1)*0.01)*2);
                this.pos.x -= Math.cos(this.rot.y) * Math.sin(this.rot.x) * (((((-touchpos.y/resolution.y)*2) +1)*0.01)*2);
            }else if(touchpos.x > resolution.x/2){
                this.rot.x += (((touchpos.x/ (resolution.x*1.7))*2) -1)*0.1;
                this.rot.y += ((((-touchpos.y/resolution.y)*2) +1)*0.01);
            }
        }
        window.addEventListener('touchstart', this.touchHandler, false);
        window.addEventListener('touchmove', this.touchHandler, false);
        window.addEventListener('touchend', this.touchHandler, false);
        this.fov = 120;
        this.pos = new vec3(0.0, 0.0, 0.0);
        this.lpos = new vec3(0.0, 0.0, 0.0);
        this.camsize = new vec3(0.1, 1.7, 0.1);
        this.rot = new vec2(0.0, 0.0);
        this.fsSource = `#version 300 es
        precision mediump float;
        in vec2 uv;
        out vec4 color;
        uniform sampler2D maintex;
        uniform sampler2D shadow;
        void main(){
            color = vec4(texture(maintex, uv).rgb, 1);
        }
        `;
        this.vsSource = `#version 300 es
        const vec2 screenplane[6] = vec2[](
            vec2(-1, -1),
            vec2(-1, 1),
            vec2(1, 1),
            vec2(-1, -1),
            vec2(1, -1),
            vec2(1, 1)
        );
        out vec2 uv;
        void main(){
            gl_Position = vec4(screenplane[gl_VertexID], 0, 1);
            uv = (screenplane[gl_VertexID]+vec2(1))/vec2(2);
        }
        `;
        this.fsShadow = `#version 300 es
        precision mediump float;
        layout (location = 0) out vec4 color;
        in float dep;
        void main(){
            color = vec4(vec3(dep), 1);
        }
        `;
        this.vsShadow = `#version 300 es
        in vec3 positions;
        out float dep;
        uniform mat4 proj;
        uniform mat4 trans;
        uniform mat4 rotx;
        uniform mat4 roty;

        uniform mat4 mtrans;
        uniform mat4 mrotx;
        uniform mat4 mroty;
        uniform mat4 mrotz;
        uniform mat4 mscale;
        void main(){
            vec4 fin = mscale * vec4(positions, 1.0);
            fin = mtrans * mroty * mrotx * mrotz * fin;
            fin = proj * roty * rotx * trans * fin;
            gl_Position = fin;
            dep = fin.z/fin.w;
        }
        `;
        this.finalprog = this.initShaderProgram(this.vsSource, this.fsSource);
        this.mainFramebuffer = this.gl.createFramebuffer();
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.mainFramebuffer);
        this.torendertex = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.torendertex);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.canvas.width, this.gl.canvas.height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.depthBuffer = this.gl.createRenderbuffer();
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.depthBuffer);
        this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH_COMPONENT32F, this.gl.canvas.width, this.gl.canvas.height);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.torendertex, 0)
        this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.RENDERBUFFER, this.depthBuffer);

        this.shadowmapresolution = 4000;
        this.shadowpos = new vec3(0, 0, 0);
        this.shadowrot = new vec2(0, 0);
        this.sfov = 90;
        this.snear = 0.1;
        this.sfar = 100.0;
        this.isshadowpass = false;
        this.shadowprog = this.initShaderProgram(this.vsShadow, this.fsShadow);
        this.positionLoc = this.gl.getAttribLocation(this.shadowprog, "positions");
        this.shadowfr = this.gl.createFramebuffer();
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.shadowfr);
        this.shadowtex = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.shadowtex);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.shadowmapresolution, this.shadowmapresolution, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.depthBuffers = this.gl.createRenderbuffer();
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.depthBuffers);
        this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH_COMPONENT32F, this.shadowmapresolution, this.shadowmapresolution);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.shadowtex, 0)
        this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.RENDERBUFFER, this.depthBuffers);
        this.useorthosh = false;

        this.lightposes = new Float32Array([
            0, 0, 0,
            0, 0, 0,
            0, 0, 0,
            0, 0, 0,
            0, 0, 0,
        ]);
        this.lightcolors = new Float32Array([
            0, 0, 0,
            0, 0, 0,
            0, 0, 0,
            0, 0, 0,
            0, 0, 0,
        ]);
        this.lighttypes = new Int32Array([
            0,
            0,
            0,
            0,
            0
        ]);
        this.then = 0;
        this.fps = 0;
        this.playerphysics = true;
        this.playerforce = 0.01;
    }
    aabbPlayer(meshPos, meshBorder, enableColision){
        var toreturn  = false;
        if(this.between(-this.pos.x, meshPos.x - meshBorder.x - this.camsize.x, meshPos.x + meshBorder.x + this.camsize.x) && this.between(-this.pos.y, meshPos.y - meshBorder.y, meshBorder.y + meshPos.y + this.camsize.y) && this.between(-this.pos.z, meshPos.z - meshBorder.z - this.camsize.z, meshBorder.z + meshPos.z + this.camsize.z)){
            if(enableColision == true){
                this.pos.y = this.lpos.y;
            }
            toreturn = true;
            if (this.between(-this.pos.y, meshPos.y - meshBorder.y, meshBorder.y + meshPos.y + this.camsize.y / 2)){
                if(enableColision == true){
                    this.pos.x = this.lpos.x;
                    this.pos.z = this.lpos.z;
                }
            }
        }
        return toreturn;
    }
    setLight(num, pos, color, type){
        this.lightposes[num*3] = pos.x;
        this.lightposes[num*3+1] = pos.y;
        this.lightposes[num*3+2] = pos.z;
        this.lightcolors[num*3] = color.x;
        this.lightcolors[num*3+1] = color.y;
        this.lightcolors[num*3+2] = color.z;
        this.lighttypes[num] = type;
    }
    beginShadowPass(){
        this.isshadowpass = true;
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.shadowfr);
        this.gl.viewport(0, 0, this.shadowmapresolution, this.shadowmapresolution);
        this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT); 
    }
    beginFrame(){
        this.isshadowpass = false;
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.mainFramebuffer);
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        if(this.playerphysics === true){
            this.pos.y += this.playerforce;
        }
    }
    endFrame(framefunc, now){
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.useProgram(this.finalprog);

        this.gl.uniform1i(this.gl.getUniformLocation(this.finalprog, "maintex"), 0);
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.torendertex);

        this.gl.uniform1i(this.gl.getUniformLocation(this.finalprog, "shadow"), 1);
        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.shadowtex);

        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 6);
        this.lpos.x = this.pos.x;
        this.lpos.y = this.pos.y;
        this.lpos.z = this.pos.z;
        now *= 0.001;
        const delta =  now - this.then;
        this.then = now;
        this.fps = 1 / delta;
        requestAnimationFrame(framefunc);
    }
}

class cubeMap{
    constructor(right, left, top, bottom, back, front, resx, resy, engineh){
        this.texture = engineh.gl.createTexture();
        engineh.gl.bindTexture(engineh.gl.TEXTURE_CUBE_MAP, this.texture);
        engineh.gl.texImage2D(engineh.gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, engineh.gl.RGBA, resx, resy, 0, engineh.gl.RGBA, engineh.gl.UNSIGNED_BYTE, right);
        engineh.gl.texImage2D(engineh.gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, engineh.gl.RGBA, resx, resy, 0, engineh.gl.RGBA, engineh.gl.UNSIGNED_BYTE, left);
        engineh.gl.texImage2D(engineh.gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, engineh.gl.RGBA, resx, resy, 0, engineh.gl.RGBA, engineh.gl.UNSIGNED_BYTE, top);
        engineh.gl.texImage2D(engineh.gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, engineh.gl.RGBA, resx, resy, 0, engineh.gl.RGBA, engineh.gl.UNSIGNED_BYTE, bottom);
        engineh.gl.texImage2D(engineh.gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, engineh.gl.RGBA, resx, resy, 0, engineh.gl.RGBA, engineh.gl.UNSIGNED_BYTE, back);
        engineh.gl.texImage2D(engineh.gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, engineh.gl.RGBA, resx, resy, 0, engineh.gl.RGBA, engineh.gl.UNSIGNED_BYTE, front);
        engineh.gl.texParameteri(engineh.gl.TEXTURE_CUBE_MAP, engineh.gl.TEXTURE_MAG_FILTER, engineh.gl.LINEAR);
        engineh.gl.texParameteri(engineh.gl.TEXTURE_CUBE_MAP, engineh.gl.TEXTURE_MIN_FILTER, engineh.gl.LINEAR);
        engineh.gl.texParameteri(engineh.gl.TEXTURE_CUBE_MAP, engineh.gl.TEXTURE_WRAP_S, engineh.gl.CLAMP_TO_EDGE);
        engineh.gl.texParameteri(engineh.gl.TEXTURE_CUBE_MAP, engineh.gl.TEXTURE_WRAP_T, engineh.gl.CLAMP_TO_EDGE);
        engineh.gl.texParameteri(engineh.gl.TEXTURE_CUBE_MAP, engineh.gl.TEXTURE_WRAP_R, engineh.gl.CLAMP_TO_EDGE);
    }
}

class Mesh{
    vecmatmult(vec, mat){
        var tof = new vec3(0.0, 0.0, 0.0);
        tof.x = vec.x * mat.mat[0] + vec.y * mat.mat[4] + vec.z * mat.mat[8] + mat.mat[12];
        tof.y = vec.x * mat.mat[1] + vec.y * mat.mat[5] + vec.z * mat.mat[9] + mat.mat[13];
        tof.z = vec.x * mat.mat[2] + vec.y * mat.mat[6] + vec.z * mat.mat[10] + mat.mat[14];
        var w = mat.mat[3] + mat.mat[7] +  mat.mat[11] +  mat.mat[15];
        tof.x /= w;
        tof.y /= w;
        tof.z /= w;
        vec.x = tof.x;
        vec.y = tof.y;
        vec.z = tof.z;
    }
    constructor(geometry, normal, uv, fshader, vshader, engineh, albedo, specular, normalmap, resx, resy, collision, cubemap){
        this.shadowcullmode = engineh.gl.FRONT;
        this.cullmode = engineh.gl.BACK;
        this.cubemap = cubemap;
        this.collision = collision;
        this.vt = geometry;
        this.tangent = new Float32Array(geometry.length);
        for(var a = 0, i = 0, v = 0; a !== this.vt.length; a+=9, i+=9, v+=6){
            var v0 = new vec3(geometry[a], geometry[a+1], geometry[a+2]);
            var v1 = new vec3(geometry[a+3], geometry[a+4], geometry[a+5]);
            var v2 = new vec3(geometry[a+6], geometry[a+7], geometry[a+8]);

            var uv0 = new vec2(uv[v], uv[v+1]+1.0);
            var uv1 = new vec2(uv[v+2], uv[v+3]+1.0);
            var uv2 = new vec2(uv[v+4], uv[v+5]+1.0);

            var deltapos1 = new vec3(v1.x-v0.x, v1.y-v0.y, v1.z-v0.z);
            var deltapos2 = new vec3(v2.x-v0.x, v2.y-v0.y, v2.z-v0.z);

            var deltaUV1 = new vec3(uv1.x-uv0.x, uv1.y-uv0.y);
            var deltaUV2 = new vec3(uv2.x-uv0.x, uv2.y-uv0.y);

            var r = 1.0 / (deltaUV1.x * deltaUV2.y - deltaUV1.y * deltaUV2.x);

            this.tangent[i] = (deltapos1.x * deltaUV2.y - deltapos2.x * deltaUV1.y)*r;
            this.tangent[i+1] = (deltapos1.y * deltaUV2.y - deltapos2.y * deltaUV1.y)*r;
            this.tangent[i+2] = (deltapos1.z * deltaUV2.y - deltapos2.z * deltaUV1.y)*r;

            this.tangent[i+3] = (deltapos1.x * deltaUV2.y - deltapos2.x * deltaUV1.y)*r;
            this.tangent[i+4] = (deltapos1.y * deltaUV2.y - deltapos2.y * deltaUV1.y)*r;
            this.tangent[i+5] = (deltapos1.z * deltaUV2.y - deltapos2.z * deltaUV1.y)*r;

            this.tangent[i+6] = (deltapos1.x * deltaUV2.y - deltapos2.x * deltaUV1.y)*r;
            this.tangent[i+7] = (deltapos1.y * deltaUV2.y - deltapos2.y * deltaUV1.y)*r;
            this.tangent[i+8] = (deltapos1.z * deltaUV2.y - deltapos2.z * deltaUV1.y)*r;
        }
        this.vBuf = engineh.gl.createBuffer();
        engineh.gl.bindBuffer(engineh.gl.ARRAY_BUFFER, this.vBuf);
        engineh.gl.bufferData(engineh.gl.ARRAY_BUFFER, geometry, engineh.gl.STATIC_DRAW);
        this.nBuf = engineh.gl.createBuffer();
        engineh.gl.bindBuffer(engineh.gl.ARRAY_BUFFER, this.nBuf);
        engineh.gl.bufferData(engineh.gl.ARRAY_BUFFER, normal, engineh.gl.STATIC_DRAW);
        this.uBuf = engineh.gl.createBuffer();
        engineh.gl.bindBuffer(engineh.gl.ARRAY_BUFFER, this.uBuf);
        engineh.gl.bufferData(engineh.gl.ARRAY_BUFFER, uv, engineh.gl.STATIC_DRAW);
        this.tBuf = engineh.gl.createBuffer();
        engineh.gl.bindBuffer(engineh.gl.ARRAY_BUFFER, this.tBuf);
        engineh.gl.bufferData(engineh.gl.ARRAY_BUFFER, this.tangent, engineh.gl.STATIC_DRAW);
        this.meshMat = new mat4();
        this.shaderprog = engineh.initShaderProgram(vshader, fshader);

        this.positionLoc = engineh.gl.getAttribLocation(this.shaderprog, "positions");
        this.normalLoc = engineh.gl.getAttribLocation(this.shaderprog, "normals");
        this.uvLoc = engineh.gl.getAttribLocation(this.shaderprog, "uv");
        this.tangentLoc = engineh.gl.getAttribLocation(this.shaderprog, "ntangent");

        console.log(this.positionLoc+" "+this.normalLoc+" "+this.uvLoc+" "+this.tangentLoc);
        this.totalv = geometry.length/3;
        this.pos = new vec3(0.0, 0.0, 0.0);
        this.rot = new vec3(0.0, 0.0, 0.0);
        this.scale = new vec3(1.0, 1.0, 1.0);
        this.texture = engineh.gl.createTexture();
        engineh.gl.bindTexture(engineh.gl.TEXTURE_2D, this.texture);
        engineh.gl.texImage2D(engineh.gl.TEXTURE_2D, 0, engineh.gl.RGBA, resx, resy, 0, engineh.gl.RGBA, engineh.gl.UNSIGNED_BYTE, albedo);
        engineh.gl.texParameteri(engineh.gl.TEXTURE_2D, engineh.gl.TEXTURE_MIN_FILTER, engineh.gl.LINEAR);
        engineh.gl.texParameteri(engineh.gl.TEXTURE_2D, engineh.gl.TEXTURE_WRAP_S, engineh.gl.MIRRORED_REPEAT);
        engineh.gl.texParameteri(engineh.gl.TEXTURE_2D, engineh.gl.TEXTURE_WRAP_T, engineh.gl.MIRRORED_REPEAT);
        engineh.gl.bindTexture(engineh.gl.TEXTURE_2D, null);
        this.spec = engineh.gl.createTexture();
        engineh.gl.bindTexture(engineh.gl.TEXTURE_2D, this.spec);
        engineh.gl.texImage2D(engineh.gl.TEXTURE_2D, 0, engineh.gl.RGBA, resx, resy, 0, engineh.gl.RGBA, engineh.gl.UNSIGNED_BYTE, specular);
        engineh.gl.texParameteri(engineh.gl.TEXTURE_2D, engineh.gl.TEXTURE_MIN_FILTER, engineh.gl.LINEAR);
        engineh.gl.texParameteri(engineh.gl.TEXTURE_2D, engineh.gl.TEXTURE_WRAP_S, engineh.gl.MIRRORED_REPEAT);
        engineh.gl.texParameteri(engineh.gl.TEXTURE_2D, engineh.gl.TEXTURE_WRAP_T, engineh.gl.MIRRORED_REPEAT);
        this.norm = engineh.gl.createTexture();
        engineh.gl.bindTexture(engineh.gl.TEXTURE_2D, this.norm);
        engineh.gl.texImage2D(engineh.gl.TEXTURE_2D, 0, engineh.gl.RGBA, resx, resy, 0, engineh.gl.RGBA, engineh.gl.UNSIGNED_BYTE, normalmap);
        engineh.gl.texParameteri(engineh.gl.TEXTURE_2D, engineh.gl.TEXTURE_MIN_FILTER, engineh.gl.LINEAR);
        engineh.gl.texParameteri(engineh.gl.TEXTURE_2D, engineh.gl.TEXTURE_WRAP_S, engineh.gl.MIRRORED_REPEAT);
        engineh.gl.texParameteri(engineh.gl.TEXTURE_2D, engineh.gl.TEXTURE_WRAP_T, engineh.gl.MIRRORED_REPEAT);
        engineh.gl.bindTexture(engineh.gl.TEXTURE_2D, null);
        this.aabb = new vec3(0.0, 0.0, 0.0);
        this.interacting = false;
    }
    CalcAABB(){
        this.aabb.x = 0;
        this.aabb.y = 0;
        this.aabb.z = 0;
        for(var i = 0; i!= this.vt.length; i+=3){
            var ver = new vec3(0.0, 0.0, 0.0);
            ver.x = this.vt[i];
            ver.y = this.vt[i+1];
            ver.z = this.vt[i+2];
            this.meshMat.clearmat();
            this.meshMat.buildScaleMat(this.scale);
            this.vecmatmult(ver, this.meshMat);
            this.meshMat.clearmat();
            this.meshMat.buildxrotmat(this.rot.x);
            this.vecmatmult(ver, this.meshMat);
            this.meshMat.clearmat();
            this.meshMat.buildyrotmat(this.rot.y);
            this.vecmatmult(ver, this.meshMat);
            this.meshMat.clearmat();
            this.meshMat.buildzrotmat(this.rot.z);
            this.vecmatmult(ver, this.meshMat);
            if(Math.abs(ver.x) >= this.aabb.x ){
                this.aabb.x = Math.abs(ver.x);
            }
            if(Math.abs(ver.y) >= this.aabb.y ){
                this.aabb.y = Math.abs(ver.y);
            }
            if(Math.abs(ver.z) >= this.aabb.z ){
                this.aabb.z = Math.abs(ver.z);
            }
        }
    }
    Draw(engineh){
        this.CalcAABB();
        this.interacting = engineh.aabbPlayer(this.pos, this.aabb, this.collision);
        if(engineh.isshadowpass === false){
            engineh.gl.cullFace(this.cullmode);
            engineh.gl.useProgram(this.shaderprog);

            this.meshMat.clearmat();
            if(engineh.useorthosh === false){
                this.meshMat.buildperspectivemat(engineh.sfov, engineh.snear, engineh.sfar, 1);
            }else{
                this.meshMat.buildorthomat(engineh.sfov, -engineh.sfov, engineh.sfov, -engineh.sfov, engineh.snear, engineh.sfar);
            }
            engineh.gl.uniformMatrix4fv(engineh.gl.getUniformLocation(this.shaderprog, "sproj"), false, this.meshMat.mat);

            this.meshMat.clearmat();
            this.meshMat.buildtranslatemat(engineh.shadowpos);
            engineh.gl.uniformMatrix4fv(engineh.gl.getUniformLocation(this.shaderprog, "strans"), false, this.meshMat.mat);

            this.meshMat.clearmat();
            this.meshMat.buildxrotmat(-engineh.shadowrot.y);
            engineh.gl.uniformMatrix4fv(engineh.gl.getUniformLocation(this.shaderprog, "sroty"), false, this.meshMat.mat);

            this.meshMat.clearmat();
            this.meshMat.buildyrotmat(-engineh.shadowrot.x);
            engineh.gl.uniformMatrix4fv(engineh.gl.getUniformLocation(this.shaderprog, "srotx"), false, this.meshMat.mat);

            this.meshMat.clearmat();
            this.meshMat.buildperspectivemat(engineh.fov, 0.1, 100.0, engineh.gl.canvas.width/engineh.gl.canvas.height);
            engineh.gl.uniformMatrix4fv(engineh.gl.getUniformLocation(this.shaderprog, "proj"), false, this.meshMat.mat);

            this.meshMat.clearmat();
            this.meshMat.buildtranslatemat(engineh.pos);
            engineh.gl.uniformMatrix4fv(engineh.gl.getUniformLocation(this.shaderprog, "trans"), false, this.meshMat.mat);

            this.meshMat.clearmat();
            this.meshMat.buildtranslatemat(this.pos);
            engineh.gl.uniformMatrix4fv(engineh.gl.getUniformLocation(this.shaderprog, "mtrans"), false, this.meshMat.mat);

            this.meshMat.clearmat();
            this.meshMat.buildxrotmat(-engineh.rot.y);
            engineh.gl.uniformMatrix4fv(engineh.gl.getUniformLocation(this.shaderprog, "roty"), false, this.meshMat.mat);

            this.meshMat.clearmat();
            this.meshMat.buildyrotmat(-engineh.rot.x);
            engineh.gl.uniformMatrix4fv(engineh.gl.getUniformLocation(this.shaderprog, "rotx"), false, this.meshMat.mat);

            this.meshMat.clearmat();
            this.meshMat.buildxrotmat(this.rot.x);
            engineh.gl.uniformMatrix4fv(engineh.gl.getUniformLocation(this.shaderprog, "mrotx"), false, this.meshMat.mat);

            this.meshMat.clearmat();
            this.meshMat.buildyrotmat(this.rot.y);
            engineh.gl.uniformMatrix4fv(engineh.gl.getUniformLocation(this.shaderprog, "mroty"), false, this.meshMat.mat);

            this.meshMat.clearmat();
            this.meshMat.buildzrotmat(this.rot.z);
            engineh.gl.uniformMatrix4fv(engineh.gl.getUniformLocation(this.shaderprog, "mrotz"), false, this.meshMat.mat);

            this.meshMat.clearmat();
            this.meshMat.buildScaleMat(this.scale);
            engineh.gl.uniformMatrix4fv(engineh.gl.getUniformLocation(this.shaderprog, "mscale"), false, this.meshMat.mat);

            engineh.gl.uniform3fv(engineh.gl.getUniformLocation(this.shaderprog, "lightp"), engineh.lightposes);
            engineh.gl.uniform3fv(engineh.gl.getUniformLocation(this.shaderprog, "lightc"), engineh.lightcolors);
            engineh.gl.uniform1iv(engineh.gl.getUniformLocation(this.shaderprog, "lightt"), engineh.lighttypes);
            engineh.gl.uniform2f(engineh.gl.getUniformLocation(this.shaderprog, "resolution"), engineh.gl.canvas.width, engineh.gl.canvas.height);

            engineh.gl.uniform3f(engineh.gl.getUniformLocation(this.shaderprog, "ppos"), engineh.pos.x, engineh.pos.y, engineh.pos.z);

            engineh.gl.uniform1i(engineh.gl.getUniformLocation(this.shaderprog, "albedo"), 0);
            engineh.gl.activeTexture(engineh.gl.TEXTURE0);
            engineh.gl.bindTexture(engineh.gl.TEXTURE_2D, this.texture);

            engineh.gl.uniform1i(engineh.gl.getUniformLocation(this.shaderprog, "specular"), 1);
            engineh.gl.activeTexture(engineh.gl.TEXTURE1);
            engineh.gl.bindTexture(engineh.gl.TEXTURE_2D, this.spec);

            engineh.gl.uniform1i(engineh.gl.getUniformLocation(this.shaderprog, "shadow"), 2);
            engineh.gl.activeTexture(engineh.gl.TEXTURE2);
            engineh.gl.bindTexture(engineh.gl.TEXTURE_2D, engineh.shadowtex);

            engineh.gl.uniform1i(engineh.gl.getUniformLocation(this.shaderprog, "normal"), 3);
            engineh.gl.activeTexture(engineh.gl.TEXTURE3);
            engineh.gl.bindTexture(engineh.gl.TEXTURE_2D, this.norm);

            if(this.cubemap.texture !== null){
                engineh.gl.uniform1i(engineh.gl.getUniformLocation(this.shaderprog, "cubemap"), 4);
                engineh.gl.activeTexture(engineh.gl.TEXTURE4);
                engineh.gl.bindTexture(engineh.gl.TEXTURE_CUBE_MAP, this.cubemap.texture);
            }

            engineh.gl.bindBuffer(engineh.gl.ARRAY_BUFFER, this.uBuf);
            engineh.gl.enableVertexAttribArray(this.uvLoc);
            engineh.gl.vertexAttribPointer(this.uvLoc, 2, engineh.gl.FLOAT, false, 0, 0);

            engineh.gl.bindBuffer(engineh.gl.ARRAY_BUFFER, this.nBuf);
            engineh.gl.enableVertexAttribArray(this.normalLoc);
            engineh.gl.vertexAttribPointer(this.normalLoc, 3, engineh.gl.FLOAT, false, 0, 0);

            engineh.gl.bindBuffer(engineh.gl.ARRAY_BUFFER, this.vBuf);
            engineh.gl.enableVertexAttribArray(this.positionLoc);
            engineh.gl.vertexAttribPointer(this.positionLoc, 3, engineh.gl.FLOAT, false, 0, 0);

            engineh.gl.bindBuffer(engineh.gl.ARRAY_BUFFER, this.tBuf);
            engineh.gl.enableVertexAttribArray(this.tangentLoc);
            engineh.gl.vertexAttribPointer(this.tangentLoc, 3, engineh.gl.FLOAT, false, 0, 0);

            engineh.gl.drawArrays(engineh.gl.TRIANGLES, 0, this.totalv);
        }else if(engineh.isshadowpass === true){
            engineh.gl.cullFace(this.shadowcullmode);
            engineh.gl.useProgram(engineh.shadowprog);

            this.meshMat.clearmat();
            if(engineh.useorthosh === false){
                this.meshMat.buildperspectivemat(engineh.sfov, engineh.snear, engineh.sfar, 1);
            }else{
                this.meshMat.buildorthomat(engineh.sfov, -engineh.sfov, engineh.sfov, -engineh.sfov, engineh.snear, engineh.sfar);
            }
            engineh.gl.uniformMatrix4fv(engineh.gl.getUniformLocation(engineh.shadowprog, "proj"), false, this.meshMat.mat);

            this.meshMat.clearmat();
            this.meshMat.buildtranslatemat(engineh.shadowpos);
            engineh.gl.uniformMatrix4fv(engineh.gl.getUniformLocation(engineh.shadowprog, "trans"), false, this.meshMat.mat);

            this.meshMat.clearmat();
            this.meshMat.buildtranslatemat(this.pos);
            engineh.gl.uniformMatrix4fv(engineh.gl.getUniformLocation(engineh.shadowprog, "mtrans"), false, this.meshMat.mat);

            this.meshMat.clearmat();
            this.meshMat.buildxrotmat(-engineh.shadowrot.y);
            engineh.gl.uniformMatrix4fv(engineh.gl.getUniformLocation(engineh.shadowprog, "roty"), false, this.meshMat.mat);

            this.meshMat.clearmat();
            this.meshMat.buildyrotmat(-engineh.shadowrot.x);
            engineh.gl.uniformMatrix4fv(engineh.gl.getUniformLocation(engineh.shadowprog, "rotx"), false, this.meshMat.mat);

            this.meshMat.clearmat();
            this.meshMat.buildxrotmat(this.rot.x);
            engineh.gl.uniformMatrix4fv(engineh.gl.getUniformLocation(engineh.shadowprog, "mrotx"), false, this.meshMat.mat);

            this.meshMat.clearmat();
            this.meshMat.buildyrotmat(this.rot.y);
            engineh.gl.uniformMatrix4fv(engineh.gl.getUniformLocation(engineh.shadowprog, "mroty"), false, this.meshMat.mat);

            this.meshMat.clearmat();
            this.meshMat.buildzrotmat(this.rot.z);
            engineh.gl.uniformMatrix4fv(engineh.gl.getUniformLocation(engineh.shadowprog, "mrotz"), false, this.meshMat.mat);

            this.meshMat.clearmat();
            this.meshMat.buildScaleMat(this.scale);
            engineh.gl.uniformMatrix4fv(engineh.gl.getUniformLocation(engineh.shadowprog, "mscale"), false, this.meshMat.mat);

            engineh.gl.uniform2f(engineh.gl.getUniformLocation(this.shaderprog, "resolution"), engineh.gl.canvas.width, engineh.gl.canvas.height);

            engineh.gl.bindBuffer(engineh.gl.ARRAY_BUFFER, this.vBuf);
            engineh.gl.enableVertexAttribArray(engineh.positionLoc);
            engineh.gl.vertexAttribPointer(engineh.positionLoc, 3, engineh.gl.FLOAT, false, 0, 0);

            engineh.gl.drawArrays(engineh.gl.TRIANGLES, 0, this.totalv);
        }
    }
}