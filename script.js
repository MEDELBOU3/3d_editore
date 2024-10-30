 const canvas = document.getElementById('renderCanvas');
        const engine = new BABYLON.Engine(canvas, true);
        let scene, camera, selectedMesh, gizmoManager;
        const undoStack = [];
        const redoStack = [];

        const createScene = function() {
            const scene = new BABYLON.Scene(engine);
            scene.clearColor = new BABYLON.Color3(0.05, 0.05, 0.05);

            camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 10, new BABYLON.Vector3(0, 0, 0), scene);
            camera.attachControl(canvas, true);
            camera.wheelPrecision = 50;
            camera.lowerRadiusLimit = 2;
            camera.upperRadiusLimit = 50;

            const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

            const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 20, height: 20}, scene);
            const gridMaterial = new BABYLON.GridMaterial("gridMaterial", scene);
            gridMaterial.majorUnitFrequency = 5;
            gridMaterial.minorUnitVisibility = 0.45;
            gridMaterial.gridRatio = 1;
            gridMaterial.backFaceCulling = false;
            gridMaterial.mainColor = new BABYLON.Color3(1, 1, 1);
            gridMaterial.lineColor = new BABYLON.Color3(1.0, 1.0, 1.0);
            gridMaterial.opacity = 0.98;
            ground.material = gridMaterial;

            gizmoManager = new BABYLON.GizmoManager(scene);
            gizmoManager.positionGizmoEnabled = true;
            gizmoManager.rotationGizmoEnabled = false;
            gizmoManager.scaleGizmoEnabled = false;
            gizmoManager.attachableMeshes = [];

            return scene;
        };

        scene = createScene();

        const addMesh = function(type) {
            let mesh;
            switch(type) {
                case 'cube':
                    mesh = BABYLON.MeshBuilder.CreateBox("cube", {size: 1}, scene);
                    break;
                case 'sphere':
                    mesh = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 1}, scene);
                    break;
                case 'cylinder':
                    mesh = BABYLON.MeshBuilder.CreateCylinder("cylinder", {height: 1, diameter: 1}, scene);
                    break;
                case 'plane':
                    mesh = BABYLON.MeshBuilder.CreatePlane("plane", {size: 1}, scene);
                    break;
                case 'torus':
                    mesh = BABYLON.MeshBuilder.CreateTorus("torus", {thickness: 0.2, diameter: 1}, scene);
                    break;
            }
            mesh.position.y = 0.5;
            selectMesh(mesh);
            updateObjectList();
            addToUndoStack();
            return mesh;
        };

        const setTransformMode = function(mode) {
            gizmoManager.positionGizmoEnabled = mode === 'translate';
            gizmoManager.rotationGizmoEnabled = mode === 'rotate';
            gizmoManager.scaleGizmoEnabled = mode === 'scale';
        };

        const updateMaterial = function() {
            if (selectedMesh) {
                const type = document.getElementById('material-type').value;
                const color = document.getElementById('material-color').value;
                const roughness = parseFloat(document.getElementById('material-roughness').value);
                const metallic = parseFloat(document.getElementById('material-metallic').value);

                let material;
                switch(type) {
                    case 'standard':
                        material = new BABYLON.StandardMaterial("material", scene);
                        material.diffuseColor = BABYLON.Color3.FromHexString(color);
                        break;
                    case 'pbr':
                        material = new BABYLON.PBRMaterial("material", scene);
                        material.albedoColor = BABYLON.Color3.FromHexString(color);
                        material.metallic = metallic;
                        material.roughness = roughness;
                        break;
                    case 'glass':
                        material = new BABYLON.PBRMaterial("glass", scene);
                        material.reflectionTexture = scene.environmentTexture;
                        material.refractionTexture = scene.environmentTexture;
                        material.linkRefractionWithTransparency = true;
                        material.indexOfRefraction = 0.52;
                        material.alpha = 0;
                        material.microSurface = 1;
                        material.reflectivityColor = new BABYLON.Color3(0.2, 0.2, 0.2);
                        material.albedoColor = BABYLON.Color3.FromHexString(color);
                        break;
                    case 'fire':
                        material = new BABYLON.FireMaterial("fire", scene);
                        material.diffuseTexture = new BABYLON.Texture("https://assets.babylonjs.com/textures/fire/diffuse.png", scene);
                        material.distortionTexture = new BABYLON.Texture("https://assets.babylonjs.com/textures/fire/distortion.png", scene);
                        material.opacityTexture = new BABYLON.Texture("https://assets.babylonjs.com/textures/fire/opacity.png", scene);
                        material.speed = 5.0;
                        break;
                }
                selectedMesh.material = material;
            }
        };

        const applyAdvancedMaterial = function() {
            if (selectedMesh) {
                const type = document.getElementById('advanced-material-type').value;
                let material;
                switch(type) {
                    case 'normal':
                        material = new BABYLON.StandardMaterial("normalMaterial", scene);
                        material.bumpTexture = new BABYLON.Texture("https://assets.babylonjs.com/textures/normal_map.jpg", scene);
                        break;
                    case 'fresnel':
                        material = new BABYLON.StandardMaterial("fresnelMaterial", scene);
                        material.reflectionFresnelParameters = new BABYLON.FresnelParameters();
                        material.reflectionFresnelParameters.bias = 0.1;
                        material.reflectionFresnelParameters.power = 2;
                        material.reflectionFresnelParameters.leftColor = BABYLON.Color3.White();
                        material.reflectionFresnelParameters.rightColor = BABYLON.Color3.Black();
                        break;
                    case 'fur':
                        material = new BABYLON.FurMaterial("furMaterial", scene);
                        material.furLength = 1;
                        material.furAngle = 0;
                        material.furColor = new BABYLON.Color3(0.44, 0.21, 0.02);
                        break;
                }
                selectedMesh.material = material;
            }
        };

        const addLight = function(type) {
            let light;
            switch(type) {
                case 'point':
                    light = new BABYLON.PointLight("pointLight", new BABYLON.Vector3(0, 1, 0), scene);
                    break;
                case 'spot':
                    light = new BABYLON.SpotLight("spotLight", new BABYLON.Vector3(0, 5, 0), new BABYLON.Vector3(0, -1, 0), Math.PI / 3, 2, scene);
                    break;
                case 'directional':
                    light = new BABYLON.DirectionalLight("directionalLight", new BABYLON.Vector3(-1, -2, -1), scene);
                    break;
            }
            updateObjectList();
            addToUndoStack();
        };

        const changeEnvironment = function() {
            const hdrTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("https://assets.babylonjs.com/environments/environmentSpecular.env", scene);
            scene.environmentTexture = hdrTexture;
            scene.createDefaultSkybox(hdrTexture, true, 1000, 0.1);
        };

        const updateEnvironmentIntensity = function(intensity) {
            if (scene.environmentTexture) {
                scene.environmentIntensity = intensity;
            }
        };

        const addAnimation = function(type) {
            if (selectedMesh) {
                let animation;
                switch(type) {
                    case 'rotation':
                        animation = new BABYLON.Animation("rotationAnimation", "rotation.y", 30, 
                            BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
                        const rotationKeys = [];
                        rotationKeys.push({ frame: 0, value: 0 });
                        rotationKeys.push({ frame: 100, value: 2 * Math.PI });
                        animation.setKeys(rotationKeys);
                        break;
                    case 'scaling':
                        animation = new BABYLON.Animation("scalingAnimation", "scaling", 30, 
                        BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
                        const scalingKeys = [];
                        scalingKeys.push({ frame: 0, value: new BABYLON.Vector3(1, 1, 1) });
                        scalingKeys.push({ frame: 50, value: new BABYLON.Vector3(1.5, 1.5, 1.5) });
                        scalingKeys.push({ frame: 100, value: new BABYLON.Vector3(1, 1, 1) });
                        animation.setKeys(scalingKeys);
                        break;
                }
                selectedMesh.animations.push(animation);
                scene.beginAnimation(selectedMesh, 0, 100, true);
            }
        };

        const createParticleSystem = function() {
            if (selectedMesh) {
                const particleSystem = new BABYLON.ParticleSystem("particles", 2000, scene);
                particleSystem.particleTexture = new BABYLON.Texture("https://assets.babylonjs.com/textures/flare.png", scene);
                particleSystem.emitter = selectedMesh;
                particleSystem.minEmitBox = new BABYLON.Vector3(-1, 0, 0);
                particleSystem.maxEmitBox = new BABYLON.Vector3(1, 0, 0);
                particleSystem.color1 = new BABYLON.Color4(0.7, 0.8, 1.0, 1.0);
                particleSystem.color2 = new BABYLON.Color4(0.2, 0.5, 1.0, 1.0);
                particleSystem.colorDead = new BABYLON.Color4(0, 0, 0.2, 0.0);
                particleSystem.minSize = 0.1;
                particleSystem.maxSize = 0.5;
                particleSystem.minLifeTime = 0.3;
                particleSystem.maxLifeTime = 1.5;
                particleSystem.emitRate = 1500;
                particleSystem.gravity = new BABYLON.Vector3(0, -9.81, 0);
                particleSystem.direction1 = new BABYLON.Vector3(-7, 8, 3);
                particleSystem.direction2 = new BABYLON.Vector3(7, 8, -3);
                particleSystem.minAngularSpeed = 0;
                particleSystem.maxAngularSpeed = Math.PI;
                particleSystem.start();
            }
        };

        let physicsEnabled = false;

        const enablePhysics = function() {
            if (!physicsEnabled) {
                scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), new BABYLON.CannonJSPlugin());
                scene.meshes.forEach(mesh => {
                    if (mesh.name !== "ground") {
                        mesh.physicsImpostor = new BABYLON.PhysicsImpostor(mesh, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 1, restitution: 0.9 }, scene);
                    }
                });
                ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9 }, scene);
                physicsEnabled = true;
            }
        };

        const applyImpulse = function() {
            if (selectedMesh && selectedMesh.physicsImpostor) {
                selectedMesh.physicsImpostor.applyImpulse(new BABYLON.Vector3(0, 5, 0), selectedMesh.getAbsolutePosition());
            }
        };

        let bloomPipeline, depthOfFieldPipeline;

        const toggleBloom = function() {
            if (bloomPipeline) {
                bloomPipeline.dispose();
                bloomPipeline = null;
            } else {
                bloomPipeline = new BABYLON.DefaultRenderingPipeline("bloom", true, scene, [camera]);
                bloomPipeline.bloomEnabled = true;
                bloomPipeline.bloomThreshold = 0.8;
                bloomPipeline.bloomWeight = 0.3;
                bloomPipeline.bloomKernel = 64;
                bloomPipeline.bloomScale = 0.5;
            }
        };

        const toggleDepthOfField = function() {
            if (depthOfFieldPipeline) {
                depthOfFieldPipeline.dispose();
                depthOfFieldPipeline = null;
            } else {
                depthOfFieldPipeline = new BABYLON.DefaultRenderingPipeline("dof", true, scene, [camera]);
                depthOfFieldPipeline.depthOfFieldEnabled = true;
                depthOfFieldPipeline.depthOfFieldBlurLevel = BABYLON.DepthOfFieldEffectBlurLevel.Low;
                depthOfFieldPipeline.depthOfField.focusDistance = 2000;
                depthOfFieldPipeline.depthOfField.focalLength = 50;
                depthOfFieldPipeline.depthOfField.fStop = 1.4;
            }
        };

        const importModel = function(file) {
            BABYLON.SceneLoader.ImportMesh("", "", file, scene, function (meshes) {
                meshes.forEach(mesh => {
                    mesh.position.y = 0.5;
                    selectMesh(mesh);
                });
                updateObjectList();
                addToUndoStack();
            });
        };

        const exportModel = function() {
            BABYLON.GLTF2Export.GLBAsync(scene, "scene").then((glb) => {
                glb.downloadFiles();
            });
        };

        const selectMesh = function(mesh) {
            if (selectedMesh) {
                selectedMesh.showBoundingBox = false;
            }
            selectedMesh = mesh;
            if (selectedMesh) {
                selectedMesh.showBoundingBox = true;
                gizmoManager.attachToMesh(selectedMesh);
                updatePropertiesPanel();
            } else {
                gizmoManager.attachToMesh(null);
                clearPropertiesPanel();
            }
        };

        const updateObjectList = function() {
            const objectList = document.getElementById('object-list');
            objectList.innerHTML = '';
            scene.meshes.forEach(mesh => {
                if (mesh.name !== "ground") {
                    const li = document.createElement('li');
                    li.textContent = mesh.name;
                    li.onclick = () => selectMesh(mesh);
                    objectList.appendChild(li);
                }
            });
        };

        const updatePropertiesPanel = function() {
            const panel = document.getElementById('properties-panel');
            panel.innerHTML = '<h3>Properties</h3>';
            if (selectedMesh) {
                addPropertyInput(panel, 'Position X', 'positionX', selectedMesh.position.x);
                addPropertyInput(panel, 'Position Y', 'positionY', selectedMesh.position.y);
                addPropertyInput(panel, 'Position Z', 'positionZ', selectedMesh.position.z);
                addPropertyInput(panel, 'Rotation X', 'rotationX', selectedMesh.rotation.x);
                addPropertyInput(panel, 'Rotation Y', 'rotationY', selectedMesh.rotation.y);
                addPropertyInput(panel, 'Rotation Z', 'rotationZ', selectedMesh.rotation.z);
                addPropertyInput(panel, 'Scale X', 'scaleX', selectedMesh.scaling.x);
                addPropertyInput(panel, 'Scale Y', 'scaleY', selectedMesh.scaling.y);
                addPropertyInput(panel, 'Scale Z', 'scaleZ', selectedMesh.scaling.z);
            }
        };

        const addPropertyInput = function(panel, label, property, value) {
            const div = document.createElement('div');
            div.className = 'property-input';
            div.innerHTML = `<label>${label}</label><input type="number" step="0.1" value="${value}" id="${property}">`;
            panel.appendChild(div);
            document.getElementById(property).onchange = (e) => updateMeshProperty(property, parseFloat(e.target.value));
        };

        const updateMeshProperty = function(property, value) {
            if (selectedMesh) {
                switch(property) {
                    case 'positionX': selectedMesh.position.x = value; break;
                    case 'positionY': selectedMesh.position.y = value; break;
                    case 'positionZ': selectedMesh.position.z = value; break;
                    case 'rotationX': selectedMesh.rotation.x = value; break;
                    case 'rotationY': selectedMesh.rotation.y = value; break;
                    case 'rotationZ': selectedMesh.rotation.z = value; break;
                    case 'scaleX': selectedMesh.scaling.x = value; break;
                    case 'scaleY': selectedMesh.scaling.y = value; break;
                    case 'scaleZ': selectedMesh.scaling.z = value; break;
                }
                addToUndoStack();
            }
        };

        const clearPropertiesPanel = function() {
            document.getElementById('properties-panel').innerHTML = '';
        };

        const addToUndoStack = function() {
            const state = scene.serialize();
            undoStack.push(state);
            redoStack.length = 0;
        };

        const undo = function() {
            if (undoStack.length > 1) {
                redoStack.push(undoStack.pop());
                const previousState = undoStack[undoStack.length - 1];
                scene.dispose();
                scene = BABYLON.Scene.Parse(previousState, engine);
                updateObjectList();
                selectMesh(null);
            }
        };

        const redo = function() {
            if (redoStack.length > 0) {
                const nextState = redoStack.pop();
                undoStack.push(nextState);
                scene.dispose();
                scene = BABYLON.Scene.Parse(nextState, engine);
                updateObjectList();
                selectMesh(null);
            }
        };

        const duplicateSelected = function() {
            if (selectedMesh) {
                const clone = selectedMesh.clone("clone_" + selectedMesh.name);
                clone.position.x += 1;
                selectMesh(clone);
                updateObjectList();
                addToUndoStack();
            }
        };

        const deleteSelected = function() {
            if (selectedMesh) {
                selectedMesh.dispose();
                selectMesh(null);
                updateObjectList();
                addToUndoStack();
            }
        };

        const showSnackbar = function(message) {
            const snackbar = document.getElementById("snackbar");
            snackbar.textContent = message;
            snackbar.className = "show";
            setTimeout(() => { snackbar.className = snackbar.className.replace("show", ""); }, 3000);
        };

        // Event listeners
        document.getElementById('add-cube').onclick = () => addMesh('cube');
        document.getElementById('add-sphere').onclick = () => addMesh('sphere');
        document.getElementById('add-cylinder').onclick = () => addMesh('cylinder');
        document.getElementById('add-plane').onclick = () => addMesh('plane');
        document.getElementById('add-torus').onclick = () => addMesh('torus');
        document.getElementById('translate-mode').onclick = () => setTransformMode('translate');
        document.getElementById('rotate-mode').onclick = () => setTransformMode('rotate');
        document.getElementById('scale-mode').onclick = () => setTransformMode('scale');
        document.getElementById('material-type').onchange = updateMaterial;
        document.getElementById('material-color').onchange = updateMaterial;
        document.getElementById('material-roughness').onchange = updateMaterial;
        document.getElementById('material-metallic').onchange = updateMaterial;
        document.getElementById('apply-advanced-material').onclick = applyAdvancedMaterial;
        document.getElementById('add-point-light').onclick = () => addLight('point');
        document.getElementById('add-spot-light').onclick = () => addLight('spot');
        document.getElementById('add-directional-light').onclick = () => addLight('directional');
        document.getElementById('change-environment').onclick = changeEnvironment;
        document.getElementById('environment-intensity').oninput = (e) => updateEnvironmentIntensity(parseFloat(e.target.value));
        document.getElementById('add-rotation-animation').onclick = () => addAnimation('rotation');
        document.getElementById('add-scaling-animation').onclick = () => addAnimation('scaling');
        document.getElementById('create-particle-system').onclick = createParticleSystem;
        document.getElementById('enable-physics').onclick = enablePhysics;
        document.getElementById('apply-impulse').onclick = applyImpulse;
        document.getElementById('toggle-bloom').onclick = toggleBloom;
        document.getElementById('toggle-dof').onclick = toggleDepthOfField;
        document.getElementById('import-file').onchange = (e) => importModel(e.target.files[0]);
        document.getElementById('export-gltf').onclick = exportModel;
        document.getElementById('undo').onclick = undo;
        document.getElementById('redo').onclick = redo;
        document.getElementById('duplicate').onclick = duplicateSelected;
        document.getElementById('delete').onclick = deleteSelected;

        // Render loop
        engine.runRenderLoop(() => {
            scene.render();
        });

        // Resize event
        window.addEventListener('resize', () => {
            engine.resize();
        });

        // Initial setup
        updateObjectList();
        addToUndoStack();
        showSnackbar("Welcome to the Advanced 3D Editor!");
