import React, {PropTypes, Component} from 'react';
import ReactDOM from 'react-dom';
import THREE from 'three';
let OrbitControls = require('three-orbit-controls')(THREE);

class Viewer3D extends Component {
    mesh = null;
    renderer = null;
    scene = null;
    camera = null;
    shirts = [];

    componentDidMount = () => {
        ReactDOM.findDOMNode(this).addEventListener('mousedown', (event) => {
            event.preventDefault();
            let raycaster = new THREE.Raycaster();
            let mouse = new THREE.Vector2();
            let domElement = ReactDOM.findDOMNode(this);
            mouse.x = ( event.offsetX / domElement.offsetWidth ) * 2 - 1;
            mouse.y = - ( event.offsetY / domElement.offsetHeight ) * 2 + 1;

            raycaster.setFromCamera(mouse, this.camera);
            let intersects = raycaster.intersectObjects(this.shirts);

            if (intersects.length > 0) {
                intersects[0].object.onPlayerClick();
            }
        }, false);
        this.init();
    }

    shouldComponentUpdate = (nextProps, nestState) => {
        return nextProps.shouldUpdate;
    }

    componentDidUpdate = () => this.init();

    applyResize = () => {
        let width = ReactDOM.findDOMNode(this).offsetWidth;
        let height = ReactDOM.findDOMNode(this).offsetHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        this.renderer.render(this.scene, this.camera);
    }

    init = () => {
        let controls = null;
        let component = this;
        let width = ReactDOM.findDOMNode(this).offsetWidth;
        let height = ReactDOM.findDOMNode(this).offsetHeight;

        this.scene = new THREE.Scene();
        let distance = 10000;

        let directionalLight = new THREE.DirectionalLight(0xffffff, 0.25);
        directionalLight.position.x = 0;
        directionalLight.position.y = 0;
        directionalLight.position.z = 1;
        directionalLight.position.normalize();
        this.scene.add(directionalLight);

        directionalLight = new THREE.DirectionalLight(0xffffff, 0.25);
        directionalLight.position.x = 0;
        directionalLight.position.y = 0;
        directionalLight.position.z = -1;
        directionalLight.position.normalize();
        this.scene.add(directionalLight);

        this.camera = new THREE.PerspectiveCamera(30, width/height, 1, distance);
        let fact = width / this.props.field.width;
        this.camera.position.set(0, 1000 / fact, 1000 / fact);

        this.scene.add(this.camera);

        this.renderer = new THREE.WebGLRenderer({ alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setClearColor(0x000000, 0);

        controls = new OrbitControls(this.camera, ReactDOM.findDOMNode(component));
        controls.addEventListener('change', () => {
            for (let i = 0; i < this.shirts.length; i++) {
                this.shirts[i].rotation.copy(this.camera.rotation);
            }
            this.renderer.render(this.scene, this.camera);
        });

        ReactDOM.findDOMNode(component).replaceChild(this.renderer.domElement, ReactDOM.findDOMNode(component).firstChild);

        this.loadField();

        this.renderer.render(this.scene, this.camera);
    }

    getPlayerById = (playerId, teamData) => {
        return teamData.players.filter((player) => Number(player.id) === Number(playerId))[0];
    }

    loadField = () => {
        let fieldWidth = this.props.field.width;
        let fieldHeight = this.props.field.height;
        let halfFieldWidth = fieldWidth / 2;
        let halfFieldHeight = fieldHeight / 2;

        let createMeshThenRender = () => {
            let imgWidth = 1024;
            let imgHeight = 1024;
            let mapCanvas = document.createElement('canvas');
            mapCanvas.width = mapCanvas.height = 1024;

            let ctx = mapCanvas.getContext('2d');
            ctx.drawImage(img, 0, 0, imgWidth, imgHeight);

            let texture = new THREE.Texture(mapCanvas);
            texture.needsUpdate = true;

            let marginColor = '#4F2E25';
            let bottomColor = '#4F2E25';
            let materials = [
                new THREE.MeshBasicMaterial({color: marginColor}),
                new THREE.MeshBasicMaterial({color: marginColor}),
                new THREE.MeshBasicMaterial({color: '#fff', map: texture }),
                new THREE.MeshBasicMaterial({color: bottomColor}),
                new THREE.MeshBasicMaterial({color: marginColor}),
                new THREE.MeshBasicMaterial({color: marginColor}),
            ];

            this.mesh = new THREE.Mesh(new THREE.CubeGeometry(fieldWidth, 0, fieldHeight), new THREE.MeshFaceMaterial(materials));
            let geometry = this.mesh.geometry;

            geometry.center();
            this.scene.add(this.mesh);
            this.mesh.position.set(0, 1, 0);

            this.renderer.render(this.scene, this.camera);
        }

        let img = new Image();
        img.onload = createMeshThenRender;
        img.src = this.props.field.textureUrl;

        this.props.objects.forEach((object, i) => {
            this.loadObject(object.data, object.x - halfFieldWidth, object.y - halfFieldHeight, true);
        });

        this.props.arrows.forEach((arrow, i) => {
            if (arrow.middle) {
                this.addArrow3(arrow, halfFieldWidth, halfFieldHeight);
            } else {
                this.addArrow2(arrow, halfFieldWidth, halfFieldHeight);
            }
        });
    }

    loadObject = (playerData, x, y, isHomeTeam) => {
        let createMeshThenRender = () => {
            let imgWidth = 256;
            let imgHeight = imgWidth;
            let imgStartX = 0;
            let marginTShirt = 32;
            let tShirtDim = imgWidth - marginTShirt;
            let textHeight = imgHeight - tShirtDim;
            let tShirtNrDim = 75;
            let tShirtNrStartX = imgWidth - tShirtNrDim;
            let tShirtNrStartY = imgHeight - textHeight - tShirtNrDim;
            let tShirtNrFontSize = 60;
            let playerNameFontSize = 30;
            let tShirtNrLeftPadding = playerData.tShirtNr > 9 ? 5 : 20;

            if (!isHomeTeam) {
                imgStartX = marginTShirt;
                tShirtNrStartX = 0;
            }

            let mapCanvas = document.createElement('canvas');
            mapCanvas.width = mapCanvas.height = imgWidth;
            let ctx = mapCanvas.getContext('2d');

            ctx.fillStyle='rgba(255,255,255,0)';
            ctx.fillRect(imgStartX, 0, imgWidth, imgHeight);

            ctx.fillStyle = 'rgba(0,0,0,0)';
            ctx.shadowColor = '#000';
            ctx.shadowOffsetY = 10;
            ctx.shadowBlur = 30;
            ctx.drawImage(img, imgStartX, 0, tShirtDim, tShirtDim);

            ctx.shadowColor = 'rgba(0,0,0,0)';

            // player name
            ctx.fillStyle='rgba(0,0,0,1)';
            ctx.fillRect(0, tShirtDim, imgWidth, textHeight);

            ctx.fillStyle = 'white';
            ctx.font = playerNameFontSize + 'px Arial';
            ctx.fillText(playerData.name, 5, tShirtDim + textHeight/2 + 10);

            // tshirt number
            ctx.fillStyle ='rgba(255,255,255,0.75)';
            ctx.fillRect(tShirtNrStartX, tShirtNrStartY, tShirtNrDim, tShirtNrDim);

            ctx.fillStyle = 'black';
            ctx.font = tShirtNrFontSize + "px Arial";
            ctx.fillText(playerData.tShirtNr, tShirtNrStartX + tShirtNrLeftPadding, tShirtNrStartY + tShirtNrFontSize);

            let texture = new THREE.Texture(mapCanvas);
            texture.needsUpdate = true;
            let mesh2 = new THREE.Mesh(new THREE.CubeGeometry(8, 8, 0), new THREE.MeshBasicMaterial({ color: '#fff', transparent:true, map: texture }));
            mesh2.position.set(x, 5, y);
            this.scene.add(mesh2);

            mesh2.onPlayerClick = this.props.onPlayerClick.bind(null, playerData);

            this.shirts.push(mesh2);
            mesh2.rotation.copy(this.camera.rotation);
            this.renderer.render(this.scene, this.camera);
        }

        let img = new Image();
        img.onload = createMeshThenRender;
        img.src = playerData.tShirtImgUrl;
    };

    addArrow3 = (arrowData, baseWidth, baseHeight) => {
        let geometry = new THREE.Geometry();
        let curve = new THREE.QuadraticBezierCurve3();
        curve.v0 = new THREE.Vector3(arrowData.start[0] - baseWidth, arrowData.start[2] + 2, arrowData.start[1] - baseHeight);
        curve.v1 = new THREE.Vector3(arrowData.middle[0] - baseWidth, arrowData.middle[2], arrowData.middle[1] - baseHeight);
        curve.v2 = new THREE.Vector3(arrowData.end[0] - baseWidth, arrowData.end[2] + 2, arrowData.end[1] - baseHeight);
        for (let j = 0; j < 21; j++) {
           geometry.vertices.push( curve.getPoint(j / 20) )
        }
        let material = new THREE.LineBasicMaterial( { color: arrowData.color, linewidth: arrowData.lineWidth } );
        let line = new THREE.Line(geometry, material);
        this.scene.add(line);

        // let axisHelper = new THREE.Object3D();
        // let params = {};
        // params.radius = params.radius || 0.1;
        // params.height = params.height || 7;
        // params.startX  = params.startX  || 0;
        //
        // let arrowGeometry = new THREE.CylinderGeometry (0, 2 * params.radius, params.height / 5);
        //
        // let yAxisMaterial = new THREE.MeshBasicMaterial ({color: 0xFFFFFF});
        // let yArrowMesh    = new THREE.Mesh (arrowGeometry, yAxisMaterial);
        // let direction = new THREE.Vector3().subVectors( geometry.vertices[18], geometry.vertices[17] );
        // let arrow = new THREE.ArrowHelper( direction, geometry.vertices[19] );
        // yArrowMesh.position.x = geometry.vertices[18].x * 1;
        // yArrowMesh.position.y = geometry.vertices[18].y * 1;
        // yArrowMesh.position.z = geometry.vertices[18].z * 1;
        // yArrowMesh.rotation.x = arrow.rotation.x;
        // yArrowMesh.rotation.y = arrow.rotation.y;
        // yArrowMesh.rotation.z = arrow.rotation.z;
        // axisHelper.add (yArrowMesh);
        //
        // this.scene.add(axisHelper);
    }

    addArrow2 = (arrowData, baseWidth, baseHeight) => {
        let geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(arrowData.start[0] - baseWidth, arrowData.start[2] +2, arrowData.start[1] - baseHeight));
        geometry.vertices.push(new THREE.Vector3(arrowData.end[0] - baseWidth, arrowData.end[2] + 2, arrowData.end[1] - baseHeight));
        let material = new THREE.LineBasicMaterial( {  color: arrowData.color, linewidth: arrowData.lineWidth } );
        let line = new THREE.Line(geometry, material);
        this.scene.add(line);
    }

    render = () => (
            <div id="SSUI-Field3D" style={{width: '100%', height:'100%'}}>
                  <div style={{
                          textAlign: 'center',
                          marginTop: 0
                      }}>
                  </div>
            </div>
       );
};

module.exports = Viewer3D;
