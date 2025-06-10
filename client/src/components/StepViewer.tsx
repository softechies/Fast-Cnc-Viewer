import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
// @ts-ignore
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Ruler, Camera, Palette } from "lucide-react";
import { loadSTLModel } from "@/lib/step-parser";
// You need to implement or install a STEP loader, e.g. three-loader-step
// import { loadSTEPModel } from '@/lib/step-parser-step';
import { Toggle } from "@/components/ui/toggle";
import { useLanguage } from "@/lib/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { loadSTEPModel } from "@/lib/loadStepModel";

// Interface for STL File Information
interface StlFileInfo {
  url: string;
  isDirectStl?: boolean;
}

// Props for the StepViewer component
interface StepViewerProps {
  modelId: number | null;
  isPublic?: boolean;
  publicId?: string;
  allowScreenshots?: boolean;
}

export default function StepViewer({
  modelId,
  isPublic,
  publicId,
  allowScreenshots = false
}: StepViewerProps) {
  const { t } = useLanguage();
  const { toast } = useToast();

  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileContentRef = useRef<string | null>(null);

  const [fileData, setFileData] = useState<File | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [stlFileInfo, setStlFileInfo] = useState<StlFileInfo | null>(null);
  const [isLoadingStlFile, setIsLoadingStlFile] = useState(false);
  const [debugInfo, setDebugInfo] = useState("Initializing...");
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);
  const [modelColor, setModelColor] = useState("#4A90E2");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const modelMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);

  // Support both STL and STEP
  const renderMode = "stl_and_step" as const;

  type ModelDimensions = {
    width: number;
    height: number;
    depth: number;
    scale: number;
    size?: number;
  };
  const [modelDimensions, setModelDimensions] =
    useState<ModelDimensions | null>(null);

  const [measureMode, setMeasureMode] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<THREE.Vector3[]>([]);
  const [measureDistance, setMeasureDistance] = useState<number | null>(null);

  const handleMeasureClick = (event: MouseEvent) => {
    if (
      !measureMode ||
      !containerRef.current ||
      !sceneRef.current ||
      !cameraRef.current
    )
      return;

    // Get the container's bounds and calculate normalized device coordinates
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / containerRef.current.clientWidth) * 2 - 1;
    const y = -((event.clientY - rect.top) / containerRef.current.clientHeight) * 2 + 1;

    // Create and configure the raycaster
    const raycaster = new THREE.Raycaster();
    const mousePosition = new THREE.Vector2(x, y);
    raycaster.setFromCamera(mousePosition, cameraRef.current);
    raycaster.params.Line.threshold = 0.1; // Increase line detection threshold
    raycaster.params.Points.threshold = 0.1; // Increase point detection threshold

    // Get the model and perform intersection test
    const model = sceneRef.current.getObjectByName("StepModel");
    if (!model) return;

    // Get all intersections and sort by distance
    const intersects = raycaster.intersectObjects(model.children, true)
      .sort((a, b) => a.distance - b.distance);

    if (intersects.length > 0) {
      const intersectionPoint = intersects[0].point.clone();
      
      // Snap to vertices if close enough
      const snapThreshold = 0.1;
      const geometry = intersects[0].object.geometry;
      if (geometry.isBufferGeometry) {
        const positions = geometry.attributes.position;
        const worldMatrix = intersects[0].object.matrixWorld;
        
        for (let i = 0; i < positions.count; i++) {
          const vertex = new THREE.Vector3();
          vertex.fromBufferAttribute(positions, i);
          vertex.applyMatrix4(worldMatrix);
          
          if (vertex.distanceTo(intersectionPoint) < snapThreshold) {
            intersectionPoint.copy(vertex);
            break;
          }
        }
      }

      setMeasurePoints(prev => {
        if (prev.length === 2) {
          const measureLine = sceneRef.current?.getObjectByName("MeasureLine");
          if (measureLine) {
            sceneRef.current?.remove(measureLine);
          }
          return [intersectionPoint];
        }
        return [...prev, intersectionPoint];
      });

      createMeasurePoint(intersectionPoint);

      if (measurePoints.length === 1) {
        const distance = measurePoints[0].distanceTo(intersectionPoint);
        setMeasureDistance(distance);
        createMeasureLine(measurePoints[0], intersectionPoint, distance);
      }
    }
  };

  const createMeasurePoint = (position: THREE.Vector3) => {
    if (!sceneRef.current) return;
    const pointId = `MeasurePoint_${measurePoints.length}`;
    const existingPoint = sceneRef.current.getObjectByName(pointId);
    if (existingPoint) {
      sceneRef.current.remove(existingPoint);
    }

    const pointGroup = new THREE.Group();
    pointGroup.name = pointId;

    // Create center point
    const pointGeometry = new THREE.SphereGeometry(0.03, 32, 32);
    const pointMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);

    // Create outer halo
    const haloGeometry = new THREE.SphereGeometry(0.05, 32, 32);
    const haloMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
      depthTest: false
    });
    const haloMesh = new THREE.Mesh(haloGeometry, haloMaterial);

    // Create crosshair lines
    const crosshairMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const crosshairSize = 0.08;
    
    const horizontalGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-crosshairSize, 0, 0),
      new THREE.Vector3(crosshairSize, 0, 0)
    ]);
    const verticalGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -crosshairSize, 0),
      new THREE.Vector3(0, crosshairSize, 0)
    ]);
    
    const horizontalLine = new THREE.Line(horizontalGeometry, crosshairMaterial);
    const verticalLine = new THREE.Line(verticalGeometry, crosshairMaterial);

    // Position all elements
    pointMesh.position.copy(position);
    haloMesh.position.copy(position);
    horizontalLine.position.copy(position);
    verticalLine.position.copy(position);

    // Add all elements to the group
    pointGroup.add(pointMesh);
    pointGroup.add(haloMesh);
    pointGroup.add(horizontalLine);
    pointGroup.add(verticalLine);

    // Add the group to the scene
    sceneRef.current.add(pointGroup);
  };

  const createMeasureLine = (
    start: THREE.Vector3,
    end: THREE.Vector3,
    distance: number
  ) => {
    if (!sceneRef.current || !cameraRef.current) return;
    const existingLine = sceneRef.current.getObjectByName("MeasureLine");
    if (existingLine) {
      sceneRef.current.remove(existingLine);
    }

    const lineGroup = new THREE.Group();
    lineGroup.name = "MeasureLine";

    // Create main measurement line
    const lineMaterial = new THREE.LineDashedMaterial({
      color: 0xff0000,
      dashSize: 0.05,
      gapSize: 0.03,
      linewidth: 2,
      depthTest: false
    });

    const lineGeometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const line = new THREE.Line(lineGeometry, lineMaterial);
    line.computeLineDistances();
    lineGroup.add(line);

    // Create direction arrows at both ends
    const arrowLength = 0.08;
    const arrowWidth = 0.03;

    const direction = end.clone().sub(start).normalize();
    const arrowGeometry = new THREE.ConeGeometry(arrowWidth, arrowLength, 8);
    const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

    // Start arrow
    const startArrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
    startArrow.position.copy(start);
    startArrow.lookAt(end);
    startArrow.rotateX(Math.PI / 2);

    // End arrow
    const endArrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
    endArrow.position.copy(end);
    endArrow.lookAt(start);
    endArrow.rotateX(Math.PI / 2);

    lineGroup.add(startArrow);
    lineGroup.add(endArrow);

    // Create distance label
    const distanceText = distance >= 1
      ? `${distance.toFixed(3)} ${t("measurement.units")}`
      : `${distance.toFixed(4)} ${t("measurement.units")}`;

    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 64;
    const context = canvas.getContext("2d");
    if (context) {
      context.fillStyle = "rgba(0, 0, 0, 0.7)";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.font = "bold 24px Arial";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillStyle = "#ffffff";
      context.fillText(distanceText, canvas.width / 2, canvas.height / 2);

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        depthTest: false
      });

      const sprite = new THREE.Sprite(spriteMaterial);
      const midPoint = start.clone().add(end).multiplyScalar(0.5);
      sprite.position.copy(midPoint);
      sprite.scale.set(0.5, 0.25, 1);

      lineGroup.add(sprite);
    }

    sceneRef.current.add(lineGroup);
  };

  const changeModelColor = (color: string) => {
    setModelColor(color);
    if (modelMaterialRef.current) {
      const threeColor = new THREE.Color(color);
      modelMaterialRef.current.color = threeColor;
      modelMaterialRef.current.needsUpdate = true;
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(5, 5, 5);
    cameraRef.current = camera;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controlsRef.current = controls;
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);
    const animate = () => {
      if (controlsRef.current) controlsRef.current.update();
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();
    setDebugInfo("Scene ready");
    const axesHelper = new THREE.AxesHelper(3);
    axesHelper.position.y = -0.1;
    axesHelper.visible = false;
    axesHelper.name = "AxesHelper";
    scene.add(axesHelper);
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current)
        return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      if (sceneRef.current) {
        sceneRef.current.traverse(object => {
          if (object instanceof THREE.Mesh) {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach(material => material.dispose());
              } else {
                object.material.dispose();
              }
            }
          }
        });
      }
      rendererRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    if (!modelId) {
      setFileData(null);
      setStlFileInfo(null);
      setDebugInfo("No model selected");
      return;
    }
    const loadFile = async () => {
      try {
        setIsLoadingFile(true);
        setDebugInfo("Loading model information...");
        const modelEndpoint =
          isPublic && publicId
            ? `/api/public/models/${publicId}`
            : `/api/models/${modelId}`;
        const modelResponse = await fetch(modelEndpoint);
        if (!modelResponse.ok) {
          const errorData = await modelResponse.json();
          throw new Error(
            `Cannot retrieve model information (${modelResponse.status}): ${
              errorData.message || ""
            }`
          );
        }
        const modelInfo = await modelResponse.json();
        setDebugInfo("Loading model file...");
        const fileEndpoint =
          isPublic && publicId
            ? `/api/public/models/${publicId}/file`
            : `/api/models/${modelId}/file`;
        const response = await fetch(fileEndpoint);
        if (!response.ok) {
          throw new Error(`Cannot download file (${response.status})`);
        }
        const blob = await response.blob();
        const filename = modelInfo.filename || `model-${modelId}.step`;
        const file = new File([blob], filename, { type: "application/step" });
        setFileData(file);
        const ext = filename.split(".").pop()?.toLowerCase();
        const isDirectStl = modelInfo.format?.toLowerCase() === "stl";
        console.log("Model file loaded:", file, { isDirectStl, fileEndpoint });

        if (isDirectStl || ext === "stl") {
          setDebugInfo("Direct STL file...");
          setStlFileInfo({
            url: fileEndpoint,
            isDirectStl: true
          });
        } else if (ext === "step" || ext === "stp") {
          try {
            setIsLoadingStlFile(true);
            setDebugInfo("Checking STEP file availability...");
            // Use the /step endpoint for STEP files
            const stepResponse = await fetch(`/api/models/${modelId}/step`);
            if (stepResponse.ok) {
              setStlFileInfo({
                url: `/api/models/${modelId}/step`,
                isDirectStl: false
              });
              setDebugInfo("STEP file available");
            } else {
              setStlFileInfo(null);
              setDebugInfo("No STEP file for this model");
            }
          } catch (stepError) {
            setStlFileInfo(null);
            setDebugInfo("Error checking STEP file");
          } finally {
            setIsLoadingStlFile(false);
          }
        } else {
          // fallback for unsupported formats
          setStlFileInfo(null);
          setDebugInfo("Unsupported file format");
        }
      } catch (error) {
        setDebugInfo(
          `Model loading error: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        setFileData(null);
      } finally {
        setIsLoadingFile(false);
      }
    };
    // ...existing code...
    loadFile();
  }, [modelId]);

  // Main renderModel function: now supports STL and STEP
  async function renderModel(content: string) {
    if (!sceneRef.current || !cameraRef.current || !controlsRef.current) return;
    try {
      const existingModel = sceneRef.current.getObjectByName("StepModel");
      if (existingModel) {
        sceneRef.current.remove(existingModel);
      }
      const onProgress = (event: ProgressEvent) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setDebugInfo(`Loading: ${percent}%`);
        }
      };
      // Detect file type by extension
      const fileName = fileData?.name?.toLowerCase() || "";
      const isSTL = fileName.endsWith(".stl");
      const isSTEP = fileName.endsWith(".step") || fileName.endsWith(".stp");
      if (isSTL && stlFileInfo?.url) {
        try {
          setDebugInfo(
            `Loading STL model... ${
              stlFileInfo.isDirectStl ? "(direct upload)" : "(converted)"
            }`
          );
          const stlLoadResult = await loadSTLModel(stlFileInfo.url, onProgress);
          const modelGroup = stlLoadResult.model;
          const scale = stlLoadResult.scale;
          if (stlLoadResult.originalDimensions) {
            setModelDimensions({
              width: stlLoadResult.originalDimensions.width,
              height: stlLoadResult.originalDimensions.height,
              depth: stlLoadResult.originalDimensions.depth,
              size: Math.sqrt(
                Math.pow(stlLoadResult.originalDimensions.width, 2) +
                  Math.pow(stlLoadResult.originalDimensions.height, 2) +
                  Math.pow(stlLoadResult.originalDimensions.depth, 2)
              ),
              scale: scale
            });
          }
          setDebugInfo("STL model loaded successfully");
          modelGroup.name = "StepModel";
          sceneRef.current.add(modelGroup);
          modelMaterialRef.current = stlLoadResult.material;
          if (cameraRef.current && controlsRef.current) {
            const boundingBox = new THREE.Box3().setFromObject(modelGroup);
            const center = new THREE.Vector3();
            boundingBox.getCenter(center);
            cameraRef.current.position.set(
              center.x + 20,
              center.y + 20,
              center.z + 20
            );
            cameraRef.current.lookAt(center);
            controlsRef.current.target.copy(center);
            controlsRef.current.update();
          }
          setDebugInfo(`Model loaded (format: STL)`);
          return;
        } catch (error) {
          setDebugInfo(
            `STL loading error: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      } else if (isSTEP) {
        setDebugInfo("STEP file detected. Loading STEP model...");

        try {
          const stepLoadResult = await loadSTEPModel(content, onProgress);
          const modelGroup = stepLoadResult.model;
          modelGroup.name = "StepModel";
          sceneRef.current.add(modelGroup);

          modelMaterialRef.current = stepLoadResult.material;

          if (stepLoadResult.originalDimensions) {
            setModelDimensions({
              ...stepLoadResult.originalDimensions,
              size: Math.sqrt(
                Math.pow(stepLoadResult.originalDimensions.width, 2) +
                  Math.pow(stepLoadResult.originalDimensions.height, 2) +
                  Math.pow(stepLoadResult.originalDimensions.depth, 2)
              ),
              scale: stepLoadResult.scale
            });
          }

          const boundingBox = new THREE.Box3().setFromObject(modelGroup);
          const center = new THREE.Vector3();
          boundingBox.getCenter(center);
          cameraRef.current.position.set(
            center.x + 20,
            center.y + 20,
            center.z + 20
          );
          cameraRef.current.lookAt(center);
          controlsRef.current.target.copy(center);
          controlsRef.current.update();

          setDebugInfo("STEP model loaded successfully");
          return;
        } catch (error) {
          setDebugInfo(
            `STEP loading error: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      } else {
        setDebugInfo(
          "This file format is not supported. Only STL and STEP files are supported."
        );
        const infoGroup = new THREE.Group();
        infoGroup.name = "StepModel";
        const infoGeometry = new THREE.PlaneGeometry(10, 5);
        const infoMaterial = new THREE.MeshBasicMaterial({
          color: 0xe0e0e0,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.7
        });
        const infoPlane = new THREE.Mesh(infoGeometry, infoMaterial);
        infoPlane.rotation.x = Math.PI / 2;
        infoPlane.position.y = 0.5;
        infoGroup.add(infoPlane);
        const axesHelper = new THREE.AxesHelper(5);
        infoGroup.add(axesHelper);
        sceneRef.current.add(infoGroup);
        if (cameraRef.current && controlsRef.current) {
          cameraRef.current.position.set(5, 5, 5);
          cameraRef.current.lookAt(0, 0, 0);
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        }
      }
    } catch (error) {
      setDebugInfo(
        `Rendering error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      try {
        if (!sceneRef.current) return;
        const errorModel = new THREE.Group();
        errorModel.name = "StepModel";
        const errorGeometry = new THREE.BoxGeometry(3, 3, 3);
        const errorMaterial = new THREE.MeshBasicMaterial({
          color: 0xff3333,
          wireframe: true
        });
        errorModel.add(new THREE.Mesh(errorGeometry, errorMaterial));
        const axesHelper = new THREE.AxesHelper(5);
        errorModel.add(axesHelper);
        sceneRef.current.add(errorModel);
        if (cameraRef.current && controlsRef.current) {
          cameraRef.current.position.set(5, 5, 5);
          cameraRef.current.lookAt(0, 0, 0);
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        }
      } catch (fallbackError) {}
    }
  }

  useEffect(() => {
    if (!containerRef.current) return;
    const handleClick = (event: MouseEvent) => {
      handleMeasureClick(event);
    };
    if (measureMode) {
      containerRef.current.addEventListener("click", handleClick);
    }
    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener("click", handleClick);
      }
    };
  }, [measureMode, measurePoints]);

  useEffect(() => {
    if (!measureMode && sceneRef.current) {
      for (let i = 0; i < 2; i++) {
        const point = sceneRef.current.getObjectByName(`MeasurePoint_${i}`);
        if (point) {
          sceneRef.current.remove(point);
        }
      }
      const measureLine = sceneRef.current.getObjectByName("MeasureLine");
      if (measureLine) {
        sceneRef.current.remove(measureLine);
      }
      setMeasurePoints([]);
      setMeasureDistance(null);
    }
  }, [measureMode]);

  useEffect(() => {
    if (!fileData || !sceneRef.current) return;
    const loadModel = async () => {
      try {
        setDebugInfo("Processing model...");
        const reader = new FileReader();
        reader.onload = event => {
          if (!event.target || !event.target.result || !sceneRef.current) {
            setDebugInfo("File reading error");
            return;
          }
          try {
            const fileContent = event.target.result as string;
            fileContentRef.current = fileContent;
            renderModel(fileContent);
          } catch (error) {
            setDebugInfo(
              `Processing error: ${
                error instanceof Error ? error.message : "Unknown error"
              }`
            );
          }
        };
        reader.onerror = () => {
          setDebugInfo("File reading error");
        };
        reader.readAsText(fileData);
      } catch (error) {
        setDebugInfo(
          `Error: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    };
    loadModel();
    return () => {
      if (sceneRef.current) {
        const model = sceneRef.current.getObjectByName("StepModel");
        if (model) {
          sceneRef.current.remove(model);
        }
      }
      fileContentRef.current = null;
    };
  }, [fileData, renderMode, stlFileInfo]);

  const refreshModel = () => {
    if (!fileContentRef.current || !sceneRef.current) {
      setDebugInfo("No data for re-rendering");
      return;
    }
    setDebugInfo("Refreshing model...");
    renderModel(fileContentRef.current);
  };

  const captureScreenshot = async () => {
    if (!rendererRef.current || !modelId || isPublic) {
      toast({
        title: t("error"),
        description:
          "Cannot capture screenshot - renderer not available or model is public",
        variant: "destructive"
      });
      return;
    }
    setIsCapturingScreenshot(true);
    try {
      if (sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      const canvas = rendererRef.current.domElement;
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          blob => {
            if (blob) resolve(blob);
            else reject(new Error("Failed to create blob"));
          },
          "image/png",
          0.9
        );
      });
      const formData = new FormData();
      formData.append("thumbnail", blob, "screenshot.png");
      const response = await fetch(`/api/models/${modelId}/thumbnail`, {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("Failed to upload screenshot");
      }
      toast({
        title: t("success"),
        description: t("screenshot_captured_successfully")
      });
      window.dispatchEvent(new CustomEvent(`thumbnail-updated-${modelId}`));
      window.dispatchEvent(new CustomEvent(`gallery-updated-${modelId}`));
    } catch (error) {
      toast({
        title: t("error"),
        description: t("screenshot_capture_failed"),
        variant: "destructive"
      });
    } finally {
      setIsCapturingScreenshot(false);
    }
  };

  // Helper for format badge
  function getFormatBadge() {
    const fileName = fileData?.name?.toLowerCase() || "";
    if (fileName.endsWith(".stl")) {
      return (
        <Badge variant="outline" className="bg-green-900/50">
          STL
        </Badge>
      );
    }
    if (fileName.endsWith(".step") || fileName.endsWith(".stp")) {
      return (
        <Badge variant="outline" className="bg-blue-900/50">
          STEP
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-red-700/50">
        Unsupported format
      </Badge>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Debug info */}
      <div className="absolute top-2 left-2 z-10 bg-black/70 text-white text-xs p-1 rounded">
        {debugInfo}
      </div>

      {/* Controls overlay */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={refreshModel}
          className="bg-black/50 text-white hover:bg-black/70 border-none p-2"
          title="Refresh model"
        >
          <RefreshCw className="h-6 w-6" />
        </Button>
        <Toggle
          aria-label="Measurement mode"
          pressed={measureMode}
          onPressedChange={setMeasureMode}
          className={`p-2 ${
            measureMode
              ? "bg-blue-500 text-white"
              : "bg-black/50 text-white hover:bg-black/70"
          } border-none`}
          title="Toggle measurement mode"
        >
          <Ruler className="h-6 w-6" />
        </Toggle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="bg-black/50 text-white hover:bg-black/70 border-none p-2"
          title="Change model color"
        >
          <Palette className="h-6 w-6" />
        </Button>
        {allowScreenshots && modelId && (
          <Button
            variant="outline"
            size="sm"
            onClick={captureScreenshot}
            disabled={isCapturingScreenshot}
            className="bg-black/50 text-white hover:bg-black/70 border-none p-2"
            title={t("capture_screenshot")}
          >
            <Camera className="h-6 w-6" />
          </Button>
        )}
      </div>

      {/* Color picker panel */}
      {showColorPicker && (
        <div className="absolute top-2 right-40 z-10 bg-white rounded-lg shadow-lg p-4 border">
          <h4 className="text-sm font-medium mb-3">
            {t("change_model_color")}
          </h4>
          <div className="grid grid-cols-6 gap-2 mb-3">
            {[
              "#4A90E2", // Niebieski (domyślny)
              "#FF6B6B", // Czerwony
              "#4ECDC4", // Turkusowy
              "#45B7D1", // Jasnoniebieski
              "#96CEB4", // Zielony
              "#FFEAA7", // Żółty
              "#DDA0DD", // Fioletowy
              "#FFA07A", // Łososiowy
              "#98D8C8", // Miętowy
              "#F7DC6F", // Złoty
              "#BB8FCE", // Lawenda
              "#85C1E9", // Błękitny
              "#82E0AA", // Jasny zielony
              "#F8C471", // Pomarańczowy
              "#F1948A", // Różowy
              "#D7DBDD", // Szary
              "#2C3E50", // Ciemny granat
              "#E74C3C" // Ciemny czerwony
            ].map(color => (
              <button
                key={color}
                onClick={() => changeModelColor(color)}
                className={`w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform ${
                  modelColor === color ? "border-gray-800" : "border-gray-300"
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600">
              {t("custom_color")}:
            </label>
            <input
              type="color"
              value={modelColor}
              onChange={e => changeModelColor(e.target.value)}
              className="w-8 h-8 rounded border cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Measurement info */}
      {measureMode && (
        <div className="absolute top-12 left-2 z-10 bg-black/70 text-white p-2 rounded max-w-xs">
          <div className="font-bold mb-1 flex items-center">
            <Ruler className="h-4 w-4 mr-2" />
            {t("measurement.mode")}
          </div>
          <div className="text-xs mb-2">{t("measurement.instructions")}</div>
          {measurePoints.length > 0 && (
            <div className="text-xs">
              {t("measurement.points")}: {measurePoints.length}/2
            </div>
          )}
          {measureDistance !== null && (
            <div className="mt-1 p-1 bg-blue-900/50 rounded text-center">
              <span className="font-bold">{t("measurement.distance")}:</span>{" "}
              {measureDistance.toFixed(3)} {t("measurement.units")}
            </div>
          )}
        </div>
      )}

      {/* Loading overlay */}
      {(isLoadingFile || isLoadingStlFile) && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-20">
          <div className="bg-white p-4 rounded shadow-md">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
            <div className="text-sm mt-2">Loading model...</div>
          </div>
        </div>
      )}

      {/* Three.js container */}
      <div
        ref={containerRef}
        className="w-full h-full min-h-[500px] bg-gray-100"
        style={{ minHeight: "500px" }}
      />

      {/* Mode info and dimensions */}
      <div className="absolute bottom-2 left-2 z-10 bg-black/70 text-white text-xs p-2 rounded flex flex-col gap-1">
        <div className="flex items-center gap-2 mt-1">
          Format: {getFormatBadge()}
        </div>
        {modelDimensions && (
          <div className="mt-2 pt-2 border-t border-gray-600">
            <div className="font-bold mb-1">{t("dimensions.title")}:</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <div className="flex items-center gap-1">
                <span className="text-gray-400">
                  {t("dimensions.width")} (X):
                </span>
                <span className="font-mono">
                  {modelDimensions.width.toFixed(2)} mm
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-400">
                  {t("dimensions.depth")} (Y):
                </span>
                <span className="font-mono">
                  {modelDimensions.depth.toFixed(2)} mm
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-400">
                  {t("dimensions.height")} (Z):
                </span>
                <span className="font-mono">
                  {modelDimensions.height.toFixed(2)} mm
                </span>
              </div>
            </div>
          </div>
        )}
        {!modelDimensions && (
          <div className="flex flex-col gap-1">
            <div className="text-gray-300 text-xs italic">
              Only STL and STEP files are supported
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
