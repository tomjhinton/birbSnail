varying vec2 vUv;
uniform float uTime;
varying float vTime;

void main(){
  vec4 modelPosition = modelMatrix * vec4(position, 1.);

  vec4 viewPosition = viewMatrix * modelPosition;

  vec4 projectionPosition = projectionMatrix * viewPosition;

  gl_Position = projectionPosition;
  vUv = uv;
  vTime = uTime;
}
