import * as THREE from 'three'
import {Camera, Scene, WebGLRenderer, Texture} from 'three'
import Stats from "./stats"
import {Color} from "three/src/math/Color"
import {Object3D} from "three/src/core/Object3D"


interface Context {
    scene: Scene
    camera: Camera
    renderer: WebGLRenderer
    register: Function
    width: number
    height: number
}


class Entity {
    object3D: Object3D
    context: Context

    constructor(context: Context, object3D: Object3D) {
        this.object3D = object3D
        this.context = context
        context.register(this)
    }

    update() {
    }
}

class Rectangle extends Entity {

    delta: number = 0.20

    constructor(context: Context, width: number, height: number, color: Color = new Color(0xffff00)) {
        super(
            context,
            new THREE.Mesh(
                new THREE.PlaneGeometry(width, height),
                new THREE.MeshBasicMaterial({color: color, side: THREE.DoubleSide})
            )
        )
        this.object3D.position.y = Math.random() * 1000 % 60 - 30
        this.object3D.position.x = Math.random() * 1000 % 120 - 60
    }

    update() {
        if (this.object3D.position.x > 60) {
            this.delta *= -1
        }
        if (this.object3D.position.x < -60) {
            this.delta *= -1
        }
        this.object3D.rotation.z += 0.01
        this.object3D.position.x += this.delta

    }
}


class TextureAnimator {
    // note: texture passed by reference, will be updated by the update function.
    texture: Texture
    tilesHorizontal: number
    tilesVertical: number
    numberOfTiles: number
    tileDisplayDuration: number
    currentDisplayTime: number
    currentTile: number

    constructor(texture: Texture, tilesHoriz: number, tilesVert: number, numTiles: number, tileDispDuration: number, currentTile: number = 0) {
        this.texture = texture

        this.tilesHorizontal = tilesHoriz
        this.tilesVertical = tilesVert
        // how many images does this spritesheet contain?
        //  usually equals tilesHoriz * tilesVert, but not necessarily,
        //  if there at blank tiles at the bottom of the spritesheet.
        this.numberOfTiles = numTiles
        this.texture.wrapS = this.texture.wrapT = THREE.RepeatWrapping
        this.texture.repeat.set(1 / this.tilesHorizontal, 1 / this.tilesVertical)

        // how long should each image be displayed?
        this.tileDisplayDuration = tileDispDuration

        // how long has the current image been displayed?
        this.currentDisplayTime = 0

        // which image is currently being displayed?
        this.currentTile = currentTile
        this.updatePosition()
    }

    updatePosition() {
        var currentColumn = this.currentTile % this.tilesHorizontal
        this.texture.offset.x = currentColumn / this.tilesHorizontal
        var currentRow = Math.floor(this.currentTile / this.tilesHorizontal)
        this.texture.offset.y = currentRow / this.tilesVertical
    }

    update(milliSec: number) {
        this.currentDisplayTime += milliSec
        while (this.currentDisplayTime > this.tileDisplayDuration) {
            this.currentDisplayTime -= this.tileDisplayDuration
            this.currentTile++
            if (this.currentTile == this.numberOfTiles)
                this.currentTile = 0
            this.updatePosition()
        }
    }
}


class Bunny extends Entity {

    delta: number = 0.20
    annie: TextureAnimator

    constructor(context: Context, bunnyType: number) {
        super(
            context,
            function () {
                let texture = new THREE.TextureLoader().load("imgs/bunnys.png")
                let material = new THREE.SpriteMaterial({
                    map: texture,
                    transparent: true,
                })

                let sprite = new THREE.Sprite(material)
                sprite.scale.set(2, 3, 1)
                return sprite
            }()
        )

        // @ts-ignore
        let runnerTexture: Texture = <Texture>this.object3D.material.map
        this.annie = new TextureAnimator(runnerTexture, 1, 5, 5, 10, bunnyType) // texture, #horiz, #vert, #total, duration.
        this.object3D.position.y = Math.random() * 1000 % 60 - 30
        this.object3D.position.x = Math.random() * 1000 % 120 - 60
    }


    update() {
        // var delta = clock.getDelta();
        // this.annie.update(1000 * delta);

        if (this.object3D.position.x > 60) {
            this.delta *= -1
        }
        if (this.object3D.position.x < -60) {
            this.delta *= -1
        }
        this.object3D.rotation.z += 0.01
        this.object3D.position.x += this.delta

    }
}

class App implements Context {
    width!: number
    height!: number
    scene!: Scene
    camera!: Camera
    renderer!: WebGLRenderer

    entities: Entity[]

    stats: any

    constructor() {
        THREE.Object3D.DefaultUp = new THREE.Vector3(0, 0, 1)

        this.createScene()
        this.createCamera()
        // this.createLight()
        this.createStats()
        this.createRenderer()
        this.addHelpers()
        // this.addObjects()
        // this.render()
        this.entities = []

        // For Three.js inspector
        // @ts-ignore
        window.scene = this.scene
        // @ts-ignore
        window.THREE = THREE
    }


    addHelpers() {
        var axesHelper = new THREE.AxesHelper(20)
        this.scene.add(axesHelper)
        var grid = new THREE.GridHelper(200, 40, 0x000000, 0x000000)
        // @ts-ignore
        grid.material.opacity = 0.2
        // @ts-ignore
        grid.material.transparent = true
        grid.rotateX(Math.PI / 2)
        this.scene.add(grid)
    }

    register(entity: Entity) {
        this.entities.push(entity)
        this.scene.add(entity.object3D)
    }

    createScene() {
        this.scene = new THREE.Scene()
        this.scene.background = new THREE.Color(0x343434)
    }

    createCamera() {
        let aspect = window.innerWidth / window.innerHeight
        // let fov = 75
        // let near = 0.1
        // let far = 1000
        let fov = 40 //75
        let near = 10 //0.1
        let far = 100 //1000
        this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far + 1)
        this.camera.position.z = 100
    }

    createStats() {
        this.stats = new Stats()
        document.body.appendChild(this.stats.dom)
    }

    createRenderer() {
        this.renderer = new THREE.WebGLRenderer()
        this.updateRendererSize()
        document.body.appendChild(this.renderer.domElement)
    }


    updateRendererSize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        this.width = window.innerWidth
        this.height = window.innerHeight
    }

    startUpdate() {
        let self = this

        function update() {
            for (let entity of self.entities) {
                entity.update()
            }
            requestAnimationFrame(update)
        }

        update()
    }

    startRender() {
        console.log('startRender')
        let self = this

        function render() {
            requestAnimationFrame(render)
            self.stats.update()
            self.renderer.render(self.scene, self.camera)
        }

        render()
    }


}

let app = new App()

// for (let i = 0; i < 3000; i++) {
//     new Rectangle(app, 2, 2, new Color(Math.random(), Math.random(), Math.random()))
// }

for (let i = 0; i < 3000; i++) {
    new Bunny(app, Math.round(Math.random() * 10 % 5))
}

app.startRender()
app.startUpdate()
