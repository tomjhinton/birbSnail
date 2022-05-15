import './style.scss'
import * as THREE from 'three'

import { gsap } from 'gsap'

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const textureLoader = new THREE.TextureLoader()

const canvas = document.querySelector('canvas.webgl')
import * as CANNON from 'cannon-es'
import CannonDebugger from 'cannon-es-debugger'


import vertexShader from './shaders/vert.glsl'
import fragmentShader from './shaders/frag.glsl'

const scene = new THREE.Scene()
const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.82, 0) // m/s²
})

const gtlfLoader = new GLTFLoader()


const invisibleMaterial = new THREE.MeshBasicMaterial({transparent: true, opacity: 0, depthWrite: false})


const slimeMaterial = new THREE.ShaderMaterial({
  vertexShader: vertexShader,
  fragmentShader: fragmentShader,
  transparent: true,
  depthWrite: true,
  clipShadows: true,
  wireframe: false,
  side: THREE.DoubleSide,
  uniforms: {

    uTime: {
      value: 0
    },

    uResolution: { type: 'v2', value: new THREE.Vector2() }


  }
})


let sceneGroup, mixer, gltfVar, snail, bit, shell, floor, segments
gtlfLoader.load(
  'snail.glb',
  (gltf) => {
    console.log(gltf)
    gltfVar = gltf
    gltf.scene.scale.set(1,1,1)
    sceneGroup = gltf.scene
    sceneGroup.needsUpdate = true

    scene.add(sceneGroup)
    segments = []

    snail = gltf.scene.children.find((child) => {
    return child.name === 'snail'
  })
  console.log(snail)
    snail.rotation.y -= 3

  }
)





const halfExtents = new CANNON.Vec3(1, 1, 1)
const boxShape = new CANNON.Box(halfExtents)
const thumbBody = new CANNON.Body({ mass: 0, shape: boxShape })



// world.addBody(thumbBody)





const groundBody = new CANNON.Body({
  type: CANNON.Body.STATIC,
  shape: new CANNON.Plane(),
})

groundBody.position.y -=1.5
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0) // make it face up
world.addBody(groundBody)

// let objectsToUpdate =[{
//   mesh: cylinder,
//   body: cylinderBody
// }]

// window.addEventListener( 'pointerup', onClick, false )
let ready = true



const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

window.addEventListener('resize', () =>{



  // Update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  // Update camera
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  // Update renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2 ))


})


/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 1000)
camera.position.x = -6.2
camera.position.y = 15
camera.position.z = 50
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.maxPolarAngle = Math.PI / 2 - 0.1
// controls.enableZoom = false;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  alpha: true
})
renderer.outputEncoding = THREE.sRGBEncoding
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor( 0x000000, 1)
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

const light = new THREE.AmbientLight( 0x404040 )
scene.add( light )
const directionalLight = new THREE.DirectionalLight( 0xffffff, 1.5 )
scene.add( directionalLight )

let objectsToUpdate = []

let floorMaterial = new THREE.MeshBasicMaterial({color: 'green'})
const floorCMaterial = new CANNON.Material('floor')
   floorCMaterial.friction = 0.0


const playerMaterial = new CANNON.Material('player')

       playerMaterial.friction = 0.0

const createFloor = (width, height, depth, position) =>{

  const floorGeometry = new THREE.PlaneGeometry(width, depth)
  const mesh = new THREE.Mesh(floorGeometry, floorMaterial)


  mesh.position.copy(position)
  mesh.scale.set(width, height)

  mesh.rotation.x = - Math.PI / 2;

  // console.log(mesh)
  scene.add(mesh)

  //Cannon.js Body
  const shape = new CANNON.Box(new CANNON.Vec3(width * 0.5, height * 0.5, depth * 0.5))
  const body = new CANNON.Body({
    mass: 0,
    positon: new CANNON.Vec3(0, 3, 0),
    shape: shape,
    material: floorCMaterial
  })
  body.position.copy(position)
  body.position.y-=.5
  world.addBody(body)

  objectsToUpdate.push({
    mesh: mesh,
    body: body
  })

}

let floorSize = 50
for(let i=0; i< floorSize; i++){

  for(let j=0; j< floorSize; j++){

    createFloor(1,1,1, {x: i -floorSize,y: -1.5,z: j - floorSize*.5})
  }

}


let body
const createPlayer = (width, height, depth, position) =>{






  //Cannon.js Body
  const playerShape = new CANNON.Box(new CANNON.Vec3(width * 0.5, height * 0.5, depth * 0.5))

  body = new CANNON.Body({
    mass: 5,
    positon: new CANNON.Vec3(0, 1,1),
    shape: playerShape,
    material: playerMaterial,
    name: 'player',
    allowSleep: false
  })
  body.position.copy(position)

  world.addBody(body)

  objectsToUpdate.push({
    body: body
  })


}

// createPlayer(3,1,2, {x:0, y:1, z:0})


// Build the car chassis
       const chassisShape = new CANNON.Box(new CANNON.Vec3(2.5, 0.5, 1))
       const chassisBody = new CANNON.Body({ mass: 1 })
       const centerOfMassAdjust = new CANNON.Vec3(0, -1, 0)
       chassisBody.addShape(chassisShape, centerOfMassAdjust)


       // Create the vehicle
       const vehicle = new CANNON.RigidVehicle({
         chassisBody,
       })

       const mass = 3
       const axisWidth = 7
       const wheelShape = new CANNON.Sphere(.75)
       const wheelMaterial = new CANNON.Material('wheel')
       wheelMaterial.friction = 0
       const down = new CANNON.Vec3(0, -1, 0)

       const wheelBody1 = new CANNON.Body({ mass, material: wheelMaterial })
       wheelBody1.addShape(wheelShape)
       vehicle.addWheel({
         body: wheelBody1,
         position: new CANNON.Vec3(-2.5, 0, axisWidth / 2).vadd(centerOfMassAdjust),
         axis: new CANNON.Vec3(0, 0, 1),
         direction: down,
       })

       const wheelBody2 = new CANNON.Body({ mass, material: wheelMaterial })
       wheelBody2.addShape(wheelShape)
       vehicle.addWheel({
         body: wheelBody2,
         position: new CANNON.Vec3(-2.5, 0, -axisWidth / 2).vadd(centerOfMassAdjust),
         axis: new CANNON.Vec3(0, 0, -1),
         direction: down,
       })

       const wheelBody3 = new CANNON.Body({ mass, material: wheelMaterial })
       wheelBody3.addShape(wheelShape)
       vehicle.addWheel({
         body: wheelBody3,
         position: new CANNON.Vec3(2.5, 0, axisWidth / 2).vadd(centerOfMassAdjust),
         axis: new CANNON.Vec3(0, 0, 1),
         direction: down,
       })

       const wheelBody4 = new CANNON.Body({ mass, material: wheelMaterial })
       wheelBody4.addShape(wheelShape)
       vehicle.addWheel({
         body: wheelBody4,
         position: new CANNON.Vec3(2.5, 0, -axisWidth / 2).vadd(centerOfMassAdjust),
         axis: new CANNON.Vec3(0, 0, -1),
         direction: down,
       })

       const wheelBody5 = new CANNON.Body({ mass, material: playerMaterial })
       wheelBody5.addShape(wheelShape)
       vehicle.addWheel({
         body: wheelBody5,
         position: new CANNON.Vec3(2.5, 0, 0).vadd(centerOfMassAdjust),
         axis: new CANNON.Vec3(0, 0, -1),
         direction: down,
       })

       wheelBody5.addEventListener("collide",function(e){
                    objectsToUpdate.map(x=> {
                      if(x.body === e.body){
                        x.mesh.material = slimeMaterial
                      }
                    })
                 });


       vehicle.wheelBodies.forEach((wheelBody) => {
         // Some damping to not spin wheels too fast
         wheelBody.angularDamping = 0.1

         // Add visuals

       })



       vehicle.addToWorld(world)


       document.addEventListener('keydown', (event) => {
                 const maxSteerVal = Math.PI / 8
                 const maxSpeed = 100
                 const maxForce = 100

                 switch (event.key) {
                   case 'w':
                   case 'ArrowUp':
                     vehicle.setWheelForce(maxForce, 2)
                     vehicle.setWheelForce(-maxForce, 3)
                     break

                   case 's':
                   case 'ArrowDown':
                     vehicle.setWheelForce(-maxForce / 2, 2)
                     vehicle.setWheelForce(maxForce / 2, 3)
                     break

                   case 'a':
                   case 'ArrowLeft':
                     vehicle.setSteeringValue(maxSteerVal, 0)
                     vehicle.setSteeringValue(maxSteerVal, 1)
                     break

                   case 'd':
                   case 'ArrowRight':
                     vehicle.setSteeringValue(-maxSteerVal, 0)
                     vehicle.setSteeringValue(-maxSteerVal, 1)
                     break
                 }
               })

               // Reset force on keyup
               document.addEventListener('keyup', (event) => {
                 switch (event.key) {
                   case 'w':
                   case 'ArrowUp':
                     vehicle.setWheelForce(0, 2)
                     vehicle.setWheelForce(0, 3)
                     break

                   case 's':
                   case 'ArrowDown':
                     vehicle.setWheelForce(0, 2)
                     vehicle.setWheelForce(0, 3)
                     break

                   case 'a':
                   case 'ArrowLeft':
                     vehicle.setSteeringValue(0, 0)
                     vehicle.setSteeringValue(0, 1)
                     break

                   case 'd':
                   case 'ArrowRight':
                     vehicle.setSteeringValue(0, 0)
                     vehicle.setSteeringValue(0, 1)
                     break
                 }
               })



        const worldContactMaterial = new CANNON.ContactMaterial(
        floorCMaterial,
          playerMaterial,
          {
            friction: 1.000,
            restitution: 0.0
          }
        )


        world.addContactMaterial(worldContactMaterial)
        // world.defaultContactMaterial = worldContactMaterial
let titular = document.getElementById('titular')
let cannonMesh = false
const cannonDebugger = new CannonDebugger(scene, world, {
  onInit(body, mesh) {
    mesh.visible = false
           // Toggle visibiliy on "d" press
           titular.addEventListener('click', function (e) {
             mesh.visible = !mesh.visible
             console.log(cannonMesh)
           });
         },
})
// body.allowSleep = false






const clock = new THREE.Clock()
let oldElapsedTime = 0

const tick = () =>{

  if ( mixer ) mixer.update( clock.getDelta() )
  const elapsedTime = clock.getElapsedTime()

  if(slimeMaterial.uniforms.uResolution.value.x === 0 && slimeMaterial.uniforms.uResolution.value.y === 0 ){
    slimeMaterial.uniforms.uResolution.value.x = renderer.domElement.width
    slimeMaterial.uniforms.uResolution.value.y = renderer.domElement.height

  }

  const deltaTime = elapsedTime - oldElapsedTime
  oldElapsedTime = elapsedTime
  world.step(1/60, deltaTime, 3)

  // Update controls
  controls.update()

  // for(const object of objectsToUpdate){
  //   object.mesh.position.copy(object.body.position)
  //   object.mesh.quaternion.copy(object.body.quaternion)
  // }

  if(chassisBody && snail){
  snail.position.copy(chassisBody.position)
  snail.quaternion.copy(chassisBody.quaternion)
}

  // if(cannonMesh === true){
   cannonDebugger.update()
 // }


  slimeMaterial.uniforms.uTime.value = elapsedTime


  // Render
  renderer.render(scene, camera)

  // Call tick again on the next frame
  window.requestAnimationFrame(tick)
}

tick()
