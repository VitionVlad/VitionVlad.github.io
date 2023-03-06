const fshader = `#version 300 es
precision mediump float;
layout (location = 0) out vec4 color;
in vec2 xy;
in vec3 norm;
in float dep;
uniform sampler2D albedo;
uniform sampler2D specular;
uniform sampler2D normal;
uniform sampler2D shadow;
uniform vec3 lightp[5];
uniform vec3 lightc[5];
uniform int lightt[5];
uniform vec3 ppos;
in vec3 posit;
in mat3 tbn;
uniform samplerCube cubemap;

const float constant = 1.0;
const float linear = 0.09;
const float quadratic = 0.032;

in vec4 str;

float shadowMapping(){
  vec3 projected = str.xyz / str.w;
  float fshadow = 0.0f;
  if(projected.z <= 1.0f){ 
   projected.xy = (projected.xy + 1.0f)/2.0f; 
   float closestDepth = texture(shadow, projected.xy).r; 
   float currentDepth = projected.z; 
   if(currentDepth > closestDepth){ 
    fshadow+=1.0f;
   } 
  } 
  return fshadow; 
} 

void main(){
    vec3 finalcolor = vec3(0);
    vec3 normal = normalize(texture(normal, xy).rgb*2.0 - 1.0);
    for(int i = 0; i!=5; i++){
        float ambientStrength = 0.2;
        vec3 ambient = ambientStrength * lightc[i];
        vec3 lightDir;
        if(lightt[i] == 0){
            lightDir = tbn * normalize(lightp[i] - posit);
        }else{
            lightDir = tbn * normalize(lightp[i]);
        }
        float diff = max(dot(normal, lightDir), 0.0);
        vec3 diffuse = diff * lightc[i];

        float specularStrength = texture(specular, xy).r;
        vec3 viewDir = tbn * normalize(vec3(-ppos.x, -ppos.y, -ppos.z) - posit);
        vec3 reflectDir = reflect(-lightDir, normal);  
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
        vec3 specu = specularStrength * spec * lightc[i];  

        if(lightt[i] == 0){
            float distance = length(lightp[i] - posit);
            float attenuation = 1.0 / (constant + linear * distance + quadratic * (distance * distance)); 
            ambient  *= attenuation; 
            diffuse  *= attenuation;
            specu *= attenuation;     
        }

        finalcolor += ((diffuse + specu)*(1.0-shadowMapping())+ambient) * texture(albedo, xy).rgb;
    }
    vec3 I = normalize(posit - -ppos);
    vec3 R = reflect(I, normalize(tbn*normal));
    color = vec4(mix(finalcolor, texture(cubemap, R).gbr, texture(specular, xy).r/2.0), 1);
}
`;

const vshader = `#version 300 es

in vec3 positions;
in vec3 normals;
in vec2 uv;
in vec3 ntangent;

uniform mat4 proj;
uniform mat4 trans;
uniform mat4 rotx;
uniform mat4 roty;

uniform mat4 mtrans;
uniform mat4 mrotx;
uniform mat4 mroty;
uniform mat4 mrotz;
uniform mat4 mscale;

uniform mat4 sproj;
uniform mat4 strans;
uniform mat4 srotx;
uniform mat4 sroty;

out vec2 xy;
out vec3 norm;
out float dep;
out vec3 posit;
out vec4 str;
out mat3 tbn;
void main(){
    vec4 fin = mscale * vec4(positions, 1.0);
    fin = mtrans * mroty * mrotx * mrotz * fin;
    fin = proj * roty * rotx * trans * fin;
    gl_Position = fin;
    fin = mscale * vec4(positions, 1.0);
    fin = mtrans * mroty * mrotx * mrotz * fin;
    fin = sproj * sroty * srotx * strans * fin;
    str = fin;
    dep = fin.z;
    xy = uv;
    norm = normals;
    posit = positions;
    mat3 vTBN = transpose(mat3(
        normalize(ntangent),
        normalize(cross(normals, ntangent)),
        normalize(normals)
    ));
    tbn = vTBN;
}
`;

const sfshader = `#version 300 es
precision mediump float;
layout (location = 0) out vec4 color;
in vec2 xy;
in vec3 norm;
in float dep;
uniform sampler2D albedo;
uniform sampler2D specular;
uniform sampler2D normal;
uniform sampler2D shadow;
uniform samplerCube cubemap;
uniform vec3 lightp[5];
uniform vec3 lightc[5];
uniform int lightt[5];
uniform vec3 ppos;
in vec3 posit;

void main(){
    color = vec4(texture(cubemap, posit).gbr, 1);
}
`;

const svshader = `#version 300 es

in vec3 positions;
in vec3 normals;
in vec2 uv;
in vec3 ntangent;

uniform mat4 proj;
uniform mat4 trans;
uniform mat4 rotx;
uniform mat4 roty;

uniform mat4 mtrans;
uniform mat4 mrotx;
uniform mat4 mroty;
uniform mat4 mrotz;
uniform mat4 mscale;

out vec2 xy;
out vec3 norm;
out vec3 posit;
void main(){
    vec4 fin = mscale * vec4(positions, 1.0);
    fin = mtrans * mroty * mrotx * mrotz * fin;
    fin = proj * roty * rotx * trans * fin;
    gl_Position = fin;
    xy = uv;
    norm = normals;
    posit = positions;
}
`;

var locked = false;

function main(){
    document.body.style.cursor = 'none';
    const speed = 0.0001;
    const sensivity = 500;
    var eng = new Engine();
    eng.useorthosh = true;
    eng.sfov = 15;
    eng.sfar = 6.0;
    //eng.playerphysics = false;
    eng.pos.z = -1.0;
    eng.pos.y = -2.7;
    eng.rot.x = 0.0;
    eng.rot.y = 0.0;
    eng.shadowpos.z = -1.0;
    eng.shadowpos.y = -2.7;
    eng.shadowrot.y = 0.7;
    eng.setLight(0, new vec3(0, 1, 1), new vec3(1, 1, 1), 1);
    var cubem = new cubeMap(right, left, ttop, bottom, back, front, 200, 200, eng);
    var mesh = new Mesh(susv, susn, susu, fshader, vshader, eng, tex, spec, norm, texx, texy, true, cubem);
    mesh.pos.y = 1;
    mesh.pos.z = -1.5;
    var mesh2 = new Mesh(planev, planen, planeu, fshader, vshader, eng, tex, spec, norm, texx, texy, true, cubem);
    var mesh3 = new Mesh(skyv, skyn, skyu, sfshader, svshader, eng, null, null, null, 1, 1, false, cubem);
    mesh3.cullmode = eng.gl.FRONT;
    mesh3.rot.y = 3.0;
    function key_callback(){
        document.addEventListener('keydown', function(event) {
            if (event.key == "w") {
                eng.pos.z += Math.cos(eng.rot.y) * Math.cos(eng.rot.x) * speed;
                eng.pos.x -= Math.cos(eng.rot.y) * Math.sin(eng.rot.x) * speed;
            }
            if (event.key == "a") {
                eng.pos.x += Math.cos(eng.rot.y) * Math.cos(eng.rot.x) * speed;
                eng.pos.z += Math.cos(eng.rot.y) * Math.sin(eng.rot.x) * speed;
            }
            if (event.key == "s") {
                eng.pos.z -= Math.cos(eng.rot.y) * Math.cos(eng.rot.x) * speed;
                eng.pos.x += Math.cos(eng.rot.y) * Math.sin(eng.rot.x) * speed;
            }
            if (event.key == "d") {
                eng.pos.x -= Math.cos(eng.rot.y) * Math.cos(eng.rot.x) * speed;
                eng.pos.z -= Math.cos(eng.rot.y) * Math.sin(eng.rot.x) * speed;
            }
        }, true);
    }
    function mousecallback(){
        document.addEventListener("mousemove", function(event){
            eng.rot.x += ((event.movementX) / (eng.gl.canvas.width/2))/sensivity;
            eng.rot.y += ((event.movementY) / (eng.gl.canvas.height/2))/sensivity;
            if(eng.rot.y > 1.5){
                eng.rot.y = 1.5;
            }
            if(eng.rot.y < -1.5){
                eng.rot.y = -1.5;
            }
        }, false);     
        document.getElementById("glCanvas").onclick = function(){
            document.getElementById("glCanvas").requestPointerLock();
            document.getElementById("glCanvas").requestFullscreen();
        };
    }
    drawFrame();
    function drawFrame(now){
        eng.beginShadowPass();
        
        mesh.Draw(eng);
        mesh2.Draw(eng);

        eng.beginFrame();
        mousecallback();
        key_callback();

        mesh3.Draw(eng);
        mesh.Draw(eng);
        mesh2.Draw(eng);

        eng.endFrame(drawFrame, now);
    }
}

window.onload = main;