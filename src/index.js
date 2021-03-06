/* global THREE */
global.THREE = require('three')
require('three/examples/js/controls/OrbitControls')
const { World } = require('./world')
const { Entities } = require('./entities')
const { Primitives } = require('./primitives')
const Vec3 = require('vec3').Vec3

const io = require('socket.io-client')
const socket = io()

const scene = new THREE.Scene()
scene.background = new THREE.Color('lightblue')

const ambientLight = new THREE.AmbientLight(0xcccccc)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 2)
directionalLight.position.set(1, 1, 0.5).normalize()
scene.add(directionalLight)

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.z = 5

const world = new World(scene)
const entities = new Entities(scene)
const primitives = new Primitives(scene)

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const controls = new THREE.OrbitControls(camera, renderer.domElement)

function animate () {
  window.requestAnimationFrame(animate)
  controls.update()
  world.update()
  renderer.render(scene, camera)
}
animate()

socket.on('version', (version) => {
  console.log('Using version: ' + version)
  const Chunk = require('prismarine-chunk')(version)

  const geometry = new THREE.BoxGeometry(0.6, 1.8, 0.6)
  geometry.translate(0, 0.9, 0)
  const material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
  const botMesh = new THREE.Mesh(geometry, material)
  scene.add(botMesh)

  socket.on('position', (pos) => {
    controls.target.set(pos.x, pos.y, pos.z)
    botMesh.position.set(pos.x, pos.y, pos.z)
  })

  socket.on('entity', (e) => {
    entities.update(e)
  })

  socket.on('primitive', (p) => {
    primitives.update(p)
  })

  socket.on('chunk', (data) => {
    const chunk = Chunk.fromJson(data.chunk)
    console.log(data.coords)
    const [x, z] = data.coords.split(',')
    world.addColumn(parseInt(x, 10), parseInt(z, 10), chunk)
  })

  socket.on('blockUpdate', ({ pos, stateId }) => {
    console.log(pos, stateId)
    world.setBlockStateId(new Vec3(pos.x, pos.y, pos.z), stateId)
  })
})
