 //SketchfabModal
        var modal = document.getElementById("myModal");
        var btn = document.getElementById("sketchfab");
        var span = document.getElementsByClassName("close")[0];


        btn.onclick = function() {
            modal.style.display = "block";

            //sketchfab
            var iframeContainer = document.getElementById("sketchfab-iframe-container");
            iframeContainer.innerHTML = '';
            var client = new Sketchfab('1.12.1', iframeContainer);

            var modelUid = '43b7d9eae20d46a78e9ce245e452fb19';
            client.init(modelUid, {
                success: function(api) {
                    api.start();

                api.addEventListener('viewerready', function(){
                    console.log('Sketchfab viewer is ready');
                });

                },
                error: function(){
                    console.log('Error while initializing Sketchfab model');
                }
            });
        };
       
        //close modal
        span.onclick = function (){
            modal.style.display = "none";
        }

        window.onclick = function(){
            if (event.target == modal){
                modal.style.display = "none";
            }
        }

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
                    mesh.rotation.x = Math.PI / 2;
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

        //textures function
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
                    case 'glass1':
                        material = new BABYLON.PBRMaterial("glass", scene);
                        material.reflectionTexture = scene.environmentTexture;
                        material.refractionTexture = scene.environmentTexture;
                        material.linkRefractionWithTransparency = true;
                        material.indexOfRefraction = 0.52;
                        material.alpha = 0;
                        material.microSurface = 1;
                        material.reflectivityColor = new BABYLON.Color3(0.2, 0.2, 0.2);
                        material.albedoColor = BABYLON.Color3.FromHexString(color);
                        // إضافة خريطة العمق لتحسين المظهر
                        material.bumpTexture = new BABYLON.Texture("https://assets.babylonjs.com/textures/glassOpacity.png", scene);
                        material.bumpTexture.level = 0.1;
                        break;
                    case 'fire':
                        material = new BABYLON.FireMaterial("fire", scene);
                        material.diffuseTexture = new BABYLON.Texture("https://assets.babylonjs.com/textures/fire/diffuse.png", scene);
                        material.distortionTexture = new BABYLON.Texture("https://assets.babylonjs.com/textures/fire/distortion.png", scene);
                        material.opacityTexture = new BABYLON.Texture("https://assets.babylonjs.com/textures/fire/opacity.png", scene);
                        material.speed = 5.0;
                        break;
                    case 'lava':
                        material = new BABYLON.StandardMaterial("lava", scene);
                        const fireTexture = new BABYLON.FireProceduralTexture("lava", 256, scene);
                        fireTexture.level = 1;
                        material.diffuseTexture = fireTexture;
                        material.opacityTexture = fireTexture;
                        material.emissiveTexture = fireTexture;
                        break;
                    case 'wood':
                        material = new BABYLON.PBRMaterial("woodMaterial", scene);
                        material.albedoTexture = new BABYLON.Texture("https://playground.babylonjs.com/textures/wood.jpg", scene);
                        material.bumpTexture = new BABYLON.Texture("https://playground.babylonjs.com/textures/woodBump.jpg", scene);
                        material.metallic = 0.1;
                        material.roughness = 0.8;
                        break;
                    case 'grass':
                        material = new BABYLON.StandardMaterial("grassMaterial", scene);
                        material.diffuseTexture = new BABYLON.Texture("https://playground.babylonjs.com/textures/grass.jpg", scene);
                        material.bumpTexture = new BABYLON.Texture("https://playground.babylonjs.com/textures/grassNormal.png", scene);
                        material.specularTexture = new BABYLON.Texture("https://playground.babylonjs.com/textures/grassSpecular.jpg", scene);
                        material.bumpTexture.level = 0.5;
                        material.diffuseTexture.uScale = 0.5;
                        material.diffuseTexture.vScale = 0.5;
                        break;
                    case 'metal':
                        material = new BABYLON.PBRMaterial("metalMaterial", scene);
                        material.metallic = 1.0;
                        material.roughness = 0.2;
                        material.albedoColor = new BABYLON.Color3(0.8, 0.8, 0.8);
                        break;
                        case 'marble':
                        material = new BABYLON.PBRMaterial("marbleMaterial", scene);
                        material.albedoColor = new BABYLON.Color3.FromHexString(color);
                        material.metallic = 0.1;
                        material.roughness = 0.2;
        
                        // إنشاء قوام الرخام برمجياً
                        const marbleTexture = new BABYLON.ProceduralTexture("marbleTexture", 512, "marbleProceduralTexture", scene);
                        marbleTexture.setFloat("numberOfTilesHeight", 3);
                        marbleTexture.setFloat("numberOfTilesWidth", 3);
                        material.albedoTexture = marbleTexture;
                        break;
        
                    case 'polishedMetal':
                        material = new BABYLON.PBRMaterial("polishedMetalMaterial", scene);
                        material.albedoColor = new BABYLON.Color3.FromHexString(color);
                        material.metallic = 0.9;
                        material.roughness = 0.1;
                        material.reflectionTexture = new BABYLON.CubeTexture("textures/TropicalSunnyDay", scene);
                        material.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
                        break;
        
                    
                    case 'water2':
                        material = new BABYLON.PBRMaterial("waterMaterial", scene);
                        material.albedoColor = new BABYLON.Color3(0.1, 0.3, 0.5);
                        material.alpha = 0.8;
                        material.roughness = 0.1;
                        material.metallic = 0.2;
        
                        // إنشاء قوام الماء المتحرك
                        const waterTexture = new BABYLON.NoiseProceduralTexture("waterTexture", 256, scene);
                        waterTexture.animationSpeedFactor = 5;
                        waterTexture.persistence = 0.2;
                        waterTexture.brightness = 0.5;
                        waterTexture.octaves = 5;
        
                        material.bumpTexture = waterTexture;
                        material.bumpTexture.level = 0.4; // زيادة مستوى التضاريس
        
                        // إضافة انعكاس للماء
                        material.reflectionTexture = new BABYLON.MirrorTexture("waterMirror", 512, scene, true);
                        material.reflectionTexture.mirrorPlane = new BABYLON.Plane(0, -1, 0, 0);
                        material.reflectionTexture.level = 0.6;
        
                        // إضافة تموجات للماء
                        const waterMesh = selectedMesh;
                        waterMesh.position.y = 0;
                        const waterMaterial = material;
                        scene.registerBeforeRender(function () {
                            waterMesh.position.y = Math.sin(Date.now() * 0.001) * 0.2;
                            waterMaterial.bumpTexture.uOffset += 0.01;
                            waterMaterial.bumpTexture.vOffset += 0.01;
                        });
                        break;
                    case 'snow':
                        material = new BABYLON.PBRMaterial("snowMaterial", scene);
                        material.albedoColor = new BABYLON.Color3(0.95, 0.95, 0.95);
                        material.metallic = 0.1;
                        material.roughness = 0.7;
                        material.subSurface.isTranslucencyEnabled = true;
                        material.subSurface.translucencyIntensity = 0.5;
                        material.subSurface.tintColor = BABYLON.Color3.White();
        
                        // إنشاء قوام الثلج برمجياً
                        const snowTexture = new BABYLON.NoiseProceduralTexture("snowTexture", 256, scene);
                        snowTexture.octaves = 3;
                        snowTexture.persistence = 0.8;
                        snowTexture.animationSpeedFactor = 0.5;
                        material.bumpTexture = snowTexture;
                        material.bumpTexture.level = 0.1;
                        break;
        
                    case 'leather':
                        material = new BABYLON.PBRMaterial("leatherMaterial", scene);
                        material.albedoColor = new BABYLON.Color3.FromHexString(color);
                        material.metallic = 0.1;
                        material.roughness = 0.6;
        
                        // إنشاء قوام الجلد برمجياً
                        const leatherTexture = new BABYLON.NoiseProceduralTexture("leatherTexture", 256, scene);
                        leatherTexture.octaves = 4;
                        leatherTexture.persistence = 0.7;
                        material.bumpTexture = leatherTexture;
                        material.bumpTexture.level = 0.3;
                        break;
        
                    case 'fabric':
                        material = new BABYLON.PBRMaterial("fabricMaterial", scene);
                        material.albedoColor = new BABYLON.Color3.FromHexString(color);
                        material.metallic = 0.05;
                        material.roughness = 0.8;
                        material.subSurface.isTranslucencyEnabled = true;
                        material.subSurface.translucencyIntensity = 0.2;
        
                        // إنشاء قوام القماش برمجياً
                        const fabricTexture = new BABYLON.NoiseProceduralTexture("fabricTexture", 256, scene);
                        fabricTexture.octaves = 8;
                        fabricTexture.persistence = 0.5;
                        material.bumpTexture = fabricTexture;
                        material.bumpTexture.level = 0.1;
                        break;
                        case 'oil':
                        material = new BABYLON.PBRMaterial("oilMaterial", scene);
                        material.albedoColor = new BABYLON.Color3(0.05, 0.05, 0.05);
                        material.metallic = 0.6;
                        material.roughness = 0.1;
                        material.subSurface.isRefractionEnabled = true;
                        material.subSurface.refractionIntensity = 0.8;
                        material.bumpTexture = new BABYLON.Texture("https://playground.babylonjs.com/textures/waterbump.png", scene);
                        material.bumpTexture.level = 0.1;
                        break;
            
                    case 'water':
                        material = new BABYLON.PBRMaterial("waterMaterial", scene);
                        material.albedoTexture = new BABYLON.Texture("https://playground.babylonjs.com/textures/waterbump.png", scene);
                        material.bumpTexture = new BABYLON.Texture("https://playground.babylonjs.com/textures/waterbump.png", scene);
                        material.metallic = 0.1;
                        material.roughness = 0.1;
                        material.alpha = 0.8;
                        material.useReflectionFresnelFromSpecular = true;
                        material.useReflectionOverAlpha = true;
                        material.refractionTexture = new BABYLON.MirrorTexture("waterRefraction", {ratio: 0.5}, scene, true);
                        material.refractionTexture.mirrorPlane = new BABYLON.Plane(0, -1, 0, 0);
                        break;
            
                    case 'rock':
                        material = new BABYLON.PBRMaterial("rockMaterial", scene);
                        material.albedoTexture = new BABYLON.Texture("https://playground.babylonjs.com/textures/rock.png", scene);
                        material.bumpTexture = new BABYLON.Texture("https://playground.babylonjs.com/textures/rockn.png", scene);
                        material.metallicTexture = new BABYLON.Texture("https://playground.babylonjs.com/textures/rockm.png", scene);
                        material.useAmbientOcclusionFromMetallicTextureRed = true;
                        material.useRoughnessFromMetallicTextureGreen = true;
                        material.useMetallnessFromMetallicTextureBlue = true;
                        break;
            
                    case 'cartoon':
                        material = new BABYLON.PBRMaterial("cartoonMaterial", scene);
                        material.albedoColor = new BABYLON.Color3(1, 0.5, 0);
                        material.metallic = 0;
                        material.roughness = 1;
                        material.twoSidedLighting = true;
                        material.bumpTexture = new BABYLON.Texture("https://playground.babylonjs.com/textures/normalMap.jpg", scene);
                        material.bumpTexture.level = 0.3;
                        material.emissiveColor = new BABYLON.Color3(0.2, 0.1, 0);
                        break;
            
                    case 'terrain':
                        material = new BABYLON.PBRMaterial("terrainMaterial", scene);
                        material.albedoTexture = new BABYLON.Texture("https://playground.babylonjs.com/textures/grass.png", scene);
                        material.bumpTexture = new BABYLON.Texture("https://playground.babylonjs.com/textures/grassn.png", scene);
                        material.metallicTexture = new BABYLON.Texture("https://playground.babylonjs.com/textures/grassm.png", scene);
                        material.useAmbientOcclusionFromMetallicTextureRed = true;
                        material.useRoughnessFromMetallicTextureGreen = true;
                        material.useMetallnessFromMetallicTextureBlue = true;
                        material.detailMap.texture = new BABYLON.Texture("https://playground.babylonjs.com/textures/rock.png", scene);
                        material.detailMap.isEnabled = true;
                        material.detailMap.scale = 10;
                        break;
            
                    case 'wool':
                        material = new BABYLON.PBRMaterial("woolMaterial", scene);
                        material.albedoTexture = new BABYLON.Texture("https://playground.babylonjs.com/textures/fur.jpg", scene);
                        material.bumpTexture = new BABYLON.Texture("https://playground.babylonjs.com/textures/fur_normal.jpg", scene);
                        material.metallic = 0;
                        material.roughness = 0.8;
                        material.fuzz = 0.5;
                        material.detailMap.scale = 5;
                        material.detailMap.isEnabled = true;
                        material.linkRefractionWithTransparency = true;
                        break;
                    case 'chocolate':
                        material = new BABYLON.PBRMaterial("chocolateMaterial", scene);
                        material.albedoColor = new BABYLON.Color3(0.2, 0.1, 0.05);
                        material.metallic = 0.3;
                        material.roughness = 0.4;
                        material.microSurface = 0.9;
                        material.subSurface.isRefractionEnabled = true;
                        material.subSurface.refractionIntensity = 0.2;
                        material.bumpTexture = new BABYLON.Texture("https://assets.babylonjs.com/textures/floor_bump.png", scene);
                        material.bumpTexture.level = 0.6;
                        material.useParallax = true;
                        material.useParallaxOcclusion = true;
                        material.parallaxScaleBias = 0.1;
                        break;
                    case 'holographic':
                        material = new BABYLON.PBRMaterial("holographicMaterial", scene);
                        material.albedoColor = new BABYLON.Color3.FromHexString(color);
                        material.alpha = 0.5;
                        material.metallic = 0.8;
                        material.roughness = 0.2;
        
                        const holographicTexture = new BABYLON.NoiseProceduralTexture("holographicTexture", 256, scene);
                        holographicTexture.octaves = 8;
                        holographicTexture.persistence = 0.5;
                        holographicTexture.animationSpeedFactor = 2;
        
                        material.emissiveTexture = holographicTexture;
                        material.opacityTexture = holographicTexture;
        
                        // إضافة تأثير هولوغرافي متحرك
                        scene.registerBeforeRender(function () {
                            material.emissiveTexture.uOffset += 0.01;
                            material.emissiveTexture.vOffset += 0.01;
                        });
                        break;
        
                    case 'galaxy':
                        material = new BABYLON.PBRMaterial("galaxyMaterial", scene);
                        material.albedoColor = new BABYLON.Color3(0.1, 0.1, 0.3);
                        material.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.5);
                        material.metallic = 0.9;
                        material.roughness = 0.4;
        
                        const galaxyTexture = new BABYLON.ProceduralTexture("galaxyTexture", 512, "galaxyProceduralTexture", scene);
                        galaxyTexture.setFloat("time", 0);
        
                        material.emissiveTexture = galaxyTexture;
                        material.opacityTexture = galaxyTexture;
        
                        // إضافة حركة للمجرة
                        let time = 0;
                        scene.registerBeforeRender(function () {
                            time += 0.01;
                            galaxyTexture.setFloat("time", time);
                        });
                        break;
        
                    case 'woodGrain':
                        material = new BABYLON.PBRMaterial("woodMaterial", scene);
                        material.albedoColor = new BABYLON.Color3.FromHexString(color);
                        material.metallic = 0.1;
                        material.roughness = 0.6;
        
                        const woodTexture = new BABYLON.WoodProceduralTexture("woodTexture", 512, scene);
                        woodTexture.ampScale = 50;
                        woodTexture.woodColor = new BABYLON.Color3.FromHexString(color);
        
                        material.albedoTexture = woodTexture;
                        material.bumpTexture = woodTexture;
                        material.bumpTexture.level = 0.4;
                        break;
                    case 'cream':
                        material = new BABYLON.PBRMaterial("creamMaterial", scene);
                        material.albedoColor = new BABYLON.Color3(0.98, 0.98, 0.95);
                        material.metallic = 0.1;
                        material.roughness = 0.2;
                        material.microSurface = 0.95;
                        material.subSurface.isTranslucencyEnabled = true;
                        material.subSurface.translucencyIntensity = 0.8;
                        material.bumpTexture = new BABYLON.Texture("https://assets.babylonjs.com/textures/floor_bump.png", scene);
                        material.bumpTexture.level = 0.3;
                        material.useParallax = true;
                        material.useParallaxOcclusion = true;
                        material.parallaxScaleBias = 0.05;
                        break;

                    default:
                    case 'crystal':
                        material = new BABYLON.PBRMaterial("crystalMaterial", scene);
                        material.albedoColor = new BABYLON.Color3(0.8, 0.8, 1);
                        material.metallic = 0.2;
                        material.roughness = 0.1;
                        material.alpha = 0.5;
                        material.subSurface.isRefractionEnabled = true;
                        material.subSurface.refractionIntensity = 0.8;
                        material.subSurface.translucencyIntensity = 0.8;
                        material.bumpTexture = new BABYLON.Texture("https://playground.babylonjs.com/textures/crystalNormal.png", scene);
                        material.bumpTexture.level = 0.5;
                        break;
                
                }
                selectedMesh.material = material;
            }
        };
        // إضافة شيدر خاص للمجرة
        BABYLON.Effect.ShadersStore["galaxyProceduralTexturePixelShader"] = `
        precision highp float;
        varying vec2 vUV;
        uniform float time;
        
        float noise(vec2 uv) {
            return fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        void main() {
            vec2 uv = vUV * 2.0 - 1.0;
            float t = time * 0.1;
            
            float color = 0.0;
            for(float i = 0.0; i < 3.0; i++) {
                uv = fract(uv * 1.5) - 0.5;
                float d = length(uv) * exp(-length(vUV));
                color += exp(-d * (15.0 + sin(t + i * 0.3) * 5.0));
            }
            
            vec3 finalColor = vec3(color * 0.4, color * 0.3, color * 0.8);
            finalColor += vec3(noise(vUV + t) * 0.1);
            
            gl_FragColor = vec4(finalColor, 1.0);
        }
        `;

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

       //Add light
        const addLight = function(type) {
        let light;
        let lightMesh;
        let gizmoManager = new BABYLON.GizmoManager(scene);
        gizmoManager.usePointerToAttachGizmos = false;
        gizmoManager.attachableMeshes = [];
        gizmoManager.enableAutoPicking = false;
    
        switch(type) {
            case 'point':
                light = new BABYLON.PointLight("pointLight", new BABYLON.Vector3(0, 1, 0), scene);
                light.intensity = 2;
                break;
            case 'spot':
                light = new BABYLON.SpotLight("spotLight", new BABYLON.Vector3(0, 5, 0), new BABYLON.Vector3(0, -1, 0), Math.PI / 3, 2, scene);
                light.intensity = 2;
                break;
            case 'directional':
                light = new BABYLON.DirectionalLight("directionalLight", new BABYLON.Vector3(-1, -2, -1), scene);
                light.intensity = 2;
                break;
        }
    
        // إنشاء mesh خاص للضوء لتمثيل حجمه
        lightMesh = BABYLON.MeshBuilder.CreateSphere("lightMesh", {diameter: 0.5}, scene);
        lightMesh.position = light.position;
        lightMesh.material = new BABYLON.StandardMaterial("lightMaterial", scene);
        lightMesh.material.emissiveColor = new BABYLON.Color3(1, 1, 0);
        lightMesh.parent = light;
    
        // إنشاء Light Gizmo
        let lightGizmo = new BABYLON.LightGizmo();
        lightGizmo.light = light;
        lightGizmo.scaleRatio = 1;
    
        // إنشاء خطوط لتمثيل اتجاه الضوء
        let rayLines = [];
        const createRayLines = () => {
            // إزالة الخطوط القديمة إن وجدت
            rayLines.forEach(line => line.dispose());
            rayLines = [];
    
            const rayColor = new BABYLON.Color3(1, 0.5, 0); // لون برتقالي
            const rayCount = type === 'point' ? 8 : 4;
            const rayLength = type === 'directional' ? 20 : 10;
    
            for (let i = 0; i < rayCount; i++) {
                let direction;
                if (type === 'point') {
                    const angle = (i / rayCount) * Math.PI * 2;
                    direction = new BABYLON.Vector3(Math.cos(angle), 0, Math.sin(angle));
                } else if (type === 'spot') {
                    const angle = (i / rayCount) * Math.PI * 2;
                    direction = new BABYLON.Vector3(Math.sin(angle) * 0.5, -1, Math.cos(angle) * 0.5);
                } else {
                    direction = light.direction.scale(-1);
                }
    
                const ray = BABYLON.MeshBuilder.CreateLines("ray", {
                    points: [
                        light.position,
                        light.position.add(direction.scale(rayLength))
                    ],
                    updatable: true
                }, scene);
                ray.color = rayColor;
                rayLines.push(ray);
            }
        };
    
        createRayLines();
    
        // إضافة التحكم في اللون والسطوع
        let advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        
        let panel = new BABYLON.GUI.StackPanel();
        panel.width = "220px";
        panel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        panel.top = "20px";
        panel.left = "-20px";
        advancedTexture.addControl(panel);
    
        let brightnessToggle = new BABYLON.GUI.Checkbox();
        brightnessToggle.width = "20px";
        brightnessToggle.height = "20px";
        brightnessToggle.isChecked = true;
        brightnessToggle.onIsCheckedChangedObservable.add((value) => {
            light.intensity = value ? 2 : 0.5;
        });
    
        let brightnessTextBlock = new BABYLON.GUI.TextBlock();
        brightnessTextBlock.text = "High Brightness";
        brightnessTextBlock.width = "180px";
        brightnessTextBlock.height = "30px";
        brightnessTextBlock.color = "white";
    
        let brightnessStackPanel = new BABYLON.GUI.StackPanel();
        brightnessStackPanel.addControl(brightnessToggle);
        brightnessStackPanel.addControl(brightnessTextBlock);
        brightnessStackPanel.isVertical = false;
        panel.addControl(brightnessStackPanel);
    
        let colorPicker = new BABYLON.GUI.ColorPicker();
        colorPicker.value = light.diffuse;
        colorPicker.height = "150px";
        colorPicker.width = "150px";
        colorPicker.onValueChangedObservable.add((value) => {
            light.diffuse = value;
            lightMesh.material.emissiveColor = value;
        });
        panel.addControl(colorPicker);
    
        // أزرار التحكم
        let controlButtons = ["Move", "Rotate", "Scale"];
        controlButtons.forEach(buttonText => {
            let button = BABYLON.GUI.Button.CreateSimpleButton("button", buttonText);
            button.width = "100px";
            button.height = "40px";
            button.color = "white";
            button.background = "blue";
            button.onPointerUpObservable.add(() => {
                gizmoManager.positionGizmoEnabled = buttonText === "Move";
                gizmoManager.rotationGizmoEnabled = buttonText === "Rotate";
                gizmoManager.scaleGizmoEnabled = buttonText === "Scale";
                gizmoManager.attachToMesh(lightMesh);
            });
            panel.addControl(button);
        });
    
        // تحديث موقع واتجاه الضوء والخطوط
        scene.onBeforeRenderObservable.add(() => {
            light.position = lightMesh.position;
            if (type === 'spot' || type === 'directional') {
                light.direction = lightMesh.forward;
            }
            createRayLines();
        });
    
        gizmoManager.attachToMesh(lightMesh);
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
